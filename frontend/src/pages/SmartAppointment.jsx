// SmartAppointment.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doctors } from "../data/doctors";
import { motion } from "framer-motion";
import "./SmartAppointment.css";

export default function SmartAppointment() {
  const [problem, setProblem] = useState("");
  const [patient, setPatient] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const data = localStorage.getItem("patientProfile");
    if (!data) {
      navigate("/patient-details");
      return;
    }
    setPatient(JSON.parse(data));
  }, [navigate]);

  const problems = [
    "Chest Pain","Heart Checkup","High BP","Diabetes",
    "Headache","Migraine","Back Pain","Joint Pain",
    "Fever","Cold & Cough","Child Care","Pregnancy Care"
  ];

  const filteredDoctors = problem
    ? doctors.filter(d => d.problems.includes(problem))
    : [];

  const selectDoctor = (doc) => {
    localStorage.setItem(
      "selectedDoctor",
      JSON.stringify({ ...doc, problem })
    );
    navigate("/book-appointment"); // 👈 NEW PAGE
  };

  if (!patient) return null;

  return (
    <div className="smart-page">
      <h1>What problem are you facing?</h1>

      <div className="problem-grid">
        {problems.map(p => (
          <button
            key={p}
            className={problem === p ? "problem-chip active" : "problem-chip"}
            onClick={() => setProblem(p)}
          >
            {p}
          </button>
        ))}
      </div>

      {problem && (
        <div className="doctor-grid">
          {filteredDoctors.map(doc => (
            <div key={doc.id} className="doctor-card">
              <h3>{doc.name}</h3>
              <p>{doc.speciality}</p>
              <p>{doc.description}</p>

              <button onClick={() => selectDoctor(doc)}>
                Select & Continue →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
