import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doctors } from "../data/doctors";
import "./SymptomChecker.css";

const SYMPTOMS = [
  "Chest Pain",
  "Breathing Difficulty",
  "Headache",
  "Migraine",
  "Fever",
  "Cold & Cough",
  "Stomach Pain",
  "Vomiting",
  "Joint Pain",
  "Back Pain",
  "Skin Allergy",
  "Hair Fall",
  "Pregnancy Care",
  "Diabetes",
  "Anxiety",
  "Depression",
];

export default function SymptomChecker() {
  const navigate = useNavigate();
  const [typedText, setTypedText] = useState("");
  const [selected, setSelected] = useState([]);
  const [severity, setSeverity] = useState(5);
  const [matchedDoctors, setMatchedDoctors] = useState([]);
  const [priorityType, setPriorityType] = useState("OPD");

  const toggleSymptom = (s) => {
    setSelected((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  // 🔥 TEXT → CHECKBOX AUTO MATCH
  const autoMatchFromText = () => {
    const lower = typedText.toLowerCase();
    const matches = SYMPTOMS.filter((s) =>
      lower.includes(s.toLowerCase())
    );
    setSelected([...new Set([...selected, ...matches])]);
  };

  // 🧠 TRIAGE ENGINE
  const analyzeSymptoms = () => {
    if (selected.length === 0) {
      alert("Select or type at least one symptom");
      return;
    }

    let emergencyLevel = "OPD";

    const hasChest = selected.includes("Chest Pain");
    const hasBreath = selected.includes("Breathing Difficulty");
    const hasPregnancy = selected.includes("Pregnancy Care");

    if ((hasChest && hasBreath && severity >= 8)) {
      emergencyLevel = "E1";
    } else if (hasChest || hasBreath || hasPregnancy) {
      emergencyLevel = "E2";
    } else if (severity >= 7) {
      emergencyLevel = "E3";
    }

    setPriorityType(emergencyLevel === "OPD" ? "OPD" : emergencyLevel);

    // 🎯 MATCH DOCTORS BY PROBLEMS
    const matched = doctors.filter((doc) =>
      doc.problems.some((p) =>
        selected.some((s) => p.toLowerCase() === s.toLowerCase())
      )
    );

    setMatchedDoctors(matched);

    sessionStorage.setItem(
      "triage",
      JSON.stringify({
        priorityType: emergencyLevel,
        selectedSymptoms: selected,
        severity,
      })
    );
  };

  return (
    <div className="symptom-wrapper">
      <div className="symptom-page">
        <h2>🩺 Symptom Checker</h2>

        {/* TEXT INPUT */}
        <textarea
          placeholder="Type your problem..."
          value={typedText}
          onChange={(e) => setTypedText(e.target.value)}
          onBlur={autoMatchFromText}
        />

        {/* CHECKBOX */}
        <div className="symptom-list">
          {SYMPTOMS.map((s) => (
            <label key={s} className="symptom-item">
              <input
                type="checkbox"
                checked={selected.includes(s)}
                onChange={() => toggleSymptom(s)}
              />
              {s}
            </label>
          ))}
        </div>

        {/* SEVERITY */}
        <div className="severity">
          <span>Mild</span>
          <input
            type="range"
            min="1"
            max="10"
            value={severity}
            onChange={(e) => setSeverity(Number(e.target.value))}
          />
          <span>Severe</span>
          <b>{severity}/10</b>
        </div>

        {matchedDoctors.length === 0 && (
          <button onClick={analyzeSymptoms}>Analyze →</button>
        )}

        {matchedDoctors.length > 0 && (
          <>
            <h3>Suggested Doctors ({priorityType})</h3>

            <div className="doctor-grid">
              {matchedDoctors.map((d) => (
                <div key={d.id} className="doctor-card">
                  <h4>{d.name}</h4>
                  <p>{d.speciality}</p>
                  <span className={`badge ${priorityType}`}>
                    {priorityType}
                  </span>
                </div>
              ))}
            </div>

            <button onClick={() => navigate("/book-appointment")}>
              Continue →
            </button>
          </>
        )}
      </div>
    </div>
  );
}