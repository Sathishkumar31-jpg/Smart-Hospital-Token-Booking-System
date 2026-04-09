import { analyzeSymptoms } from "../utils/symptomAnalyzer";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { doctors } from "../data/doctors";
import {
  OPD_LIMIT_PER_DOCTOR,
  JUNIOR_DOCTORS,
} from "../config/queueLimits";
import "./BookAppointment.css";

const API = "http://localhost:5000";

// ⏱️ Average consultation time (minutes)
const AVG_CONSULT_TIME = 10;

export default function BookAppointment() {
  const navigate = useNavigate();

  const triage = JSON.parse(sessionStorage.getItem("triage"));
  const patient = JSON.parse(localStorage.getItem("patientProfile"));

  const [doctor, setDoctor] = useState(null);
  const [symptoms, setSymptoms] = useState("");
  const [session, setSession] = useState("");
  const [date, setDate] = useState("");
  const [slotInfo, setSlotInfo] = useState(null);

  useEffect(() => {
    if (!triage?.selectedSymptoms) {
      setDoctor(doctors[0]);
      return;
    }

    const matched = doctors.filter((d) =>
      d.problems.some((p) =>
        triage.selectedSymptoms.some(
          (s) => s.toLowerCase() === p.toLowerCase()
        )
      )
    );

    setDoctor(matched[0] || doctors[0]);
  }, [triage]);

  const today = new Date().toISOString().split("T")[0];

  // 🔹 Run symptom analysis
  const runAnalysis = () => {
    if (!symptoms.trim()) return null;

    const result = analyzeSymptoms(symptoms);

    if (result.isEmergency) {
      alert(
        "🚨 Possible medical emergency detected.\nPlease visit the Emergency Department immediately."
      );
    }

    return result;
  };

  // 🔹 Fetch OPD count
  const getOpdCount = async () => {
    const res = await fetch(
      `${API}/queue/opd-count?doctorId=${doctor.id}&session=${session}&date=${date}`
    );
    const data = await res.json();
    return data.count || 0;
  };

  // 🔹 SMART TIME SLOT CALCULATION (FAIL-SAFE)
  const calculateTimeSlot = (opdCount) => {
    const baseHour =
      session === "morning" ? 9 :
      session === "afternoon" ? 13 : 17;

    const start = new Date();
    start.setHours(baseHour, opdCount * AVG_CONSULT_TIME, 0);

    const end = new Date(start.getTime() + AVG_CONSULT_TIME * 60000);

    const format = (d) =>
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    return {
      expectedArrivalTime: format(start),
      arrivalWindow: `${format(start)} - ${format(end)}`,
    };
  };

  const book = async () => {
    if (!doctor || !session || !date) {
      alert("Select date & session");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert("Login required");
      return;
    }

    const analysis = runAnalysis();
    let arrivalData = {};

    // 🔹 OPD logic only (Emergency bypass)
    if (!analysis?.isEmergency) {
      const opdCount = await getOpdCount();

      // 🔹 OPD LIMIT + JUNIOR DOCTOR
      if (opdCount >= OPD_LIMIT_PER_DOCTOR) {
        const juniorDoctorName =
          JUNIOR_DOCTORS[doctor.specialization || doctor.name];

        if (juniorDoctorName) {
          alert(
            `OPD limit reached for ${doctor.name}.\nYou are redirected to ${juniorDoctorName}.`
          );
          setDoctor({ ...doctor, name: juniorDoctorName });
        } else {
          alert("OPD slots are full. Choose another session.");
          return;
        }
      }

      // 🔹 SMART TIME SLOT ASSIGNMENT
      arrivalData = calculateTimeSlot(opdCount);
      setSlotInfo(arrivalData);

      alert(
        `🕒 Crowd-Free Visit Slot\n\nPlease arrive between:\n${arrivalData.arrivalWindow}\n\nThis helps reduce hospital crowd.`
      );
    }

    try {
      const res = await fetch(`${API}/queue/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: user.uid,
          patientName: patient?.name || "Patient",
          patientAge: Number(patient?.age ?? 1),
          patientProblem:
            symptoms ||
            patient?.problem ||
            triage?.selectedSymptoms?.join(", ") ||
            "General",

          doctorId: doctor.id,
          doctorName: doctor.name,
          session,
          date,

          priorityType:
            analysis?.priorityLevel ||
            triage?.priorityType ||
            "OPD",

          isEmergency: analysis?.isEmergency || false,

          // 🔥 SMART SLOT DATA (NEW)
          ...arrivalData,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        alert("Booking failed");
        return;
      }

      navigate("/queue");
    } catch (err) {
      console.error(err);
      alert("Booking error");
    }
  };

  if (!doctor) return <p>Loading…</p>;

  return (
    <div className="book-wrapper">
      <div className="book-card">
        <h2>{doctor.name}</h2>

        {/* Symptoms */}
        <label>Describe your problem (max 100 words)</label>
        <textarea
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          placeholder="Example: severe headache with vomiting"
          rows={4}
        />

        {/* Date */}
        <div className="date-box">
          <label>Select Date</label>
          <input
            type="date"
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* Session */}
        <p className="session-title">Select Session</p>
        <div className="session-grid">
          {["morning", "afternoon", "evening"].map((s) => (
            <button
              key={s}
              className={`session-btn ${session === s ? "active" : ""}`}
              onClick={() => setSession(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Slot display */}
        {slotInfo && (
          <p style={{ color: "#22c55e", fontSize: "13px" }}>
            ⏰ Your visit slot: <b>{slotInfo.arrivalWindow}</b>
          </p>
        )}

        {/* Confirm */}
        <button className="confirm-btn" onClick={book}>
          Confirm Booking
        </button>

        <p style={{ fontSize: "12px", color: "gray" }}>
          OPD limit per doctor per session: {OPD_LIMIT_PER_DOCTOR}
        </p>
      </div>
    </div>
  );
}
