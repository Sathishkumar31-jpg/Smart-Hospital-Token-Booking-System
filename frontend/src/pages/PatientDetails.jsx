import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { doctors } from "../data/doctors";
import { useNavigate } from "react-router-dom";
import "./PatientDetails.css";

export default function PatientDetails() {
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const navigate = useNavigate();

  const submit = () => {
    if (!name || !age || !gender || !phone || !address) {
      alert("Fill all details");
      return;
    }

    localStorage.setItem(
      "patientProfile",
      JSON.stringify({ name, age, gender, phone, address })
    );

    navigate("/symptom-checker");
  };

  return (
    <div className="patient-page">

      {/* ===== LEFT DOCTOR GRID ===== */}
      <div className="doctor-section">
        <h2>Available Doctors</h2>

        <div className="doctor-grid">
          {doctors.map((d) => (
            <div className="doctor-tile" key={d.id}>
              <h4>{d.name}</h4>
              <p>{d.speciality}</p>
              <span>{d.experience}</span>
            </div>
          ))}
        </div>

        <button
          className="enter-btn"
          onClick={() => setShowForm(true)}
        >
          Enter Patient Details →
        </button>
      </div>

      {/* ===== RIGHT SLIDE FORM ===== */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="patient-form"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4 }}
          >
            <h2>Patient Details</h2>

            <input
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              type="number"
              placeholder="Age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />

            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">Select Gender</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>

            <input
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <textarea
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />

            <button onClick={submit}>
              Continue →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}