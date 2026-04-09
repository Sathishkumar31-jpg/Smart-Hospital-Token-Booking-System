import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../firebase";
import { doctors } from "../data/doctors";
import "./DoctorAuth.css";

export default function DoctorAuth() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [doctorId, setDoctorId] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!doctorId) {
      alert("Please select your doctor profile");
      return;
    }

    try {
      let userCredential;

      if (mode === "login") {
        userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
      } else {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
      }

      const selectedDoctor = doctors.find(
        (d) => d.id === Number(doctorId)
      );

      if (!selectedDoctor) {
        alert("Invalid doctor selected");
        return;
      }

      // 🔥🔥🔥 MAIN FIX – STORE IN localStorage
    // 🔥🔥🔥 FINAL & CORRECT DOCTOR SESSION FIX

const doctorSession = {
  doctorId: String(selectedDoctor.id), // 🔥 MUST MATCH Firestore
  name: selectedDoctor.name,
  speciality: selectedDoctor.speciality,
  uid: userCredential.user.uid,
};

// store ONLY this for dashboard
sessionStorage.setItem(
  "doctorSession",
  JSON.stringify(doctorSession)
);

// optional – for profile pages
localStorage.setItem(
  "doctorProfile",
  JSON.stringify(doctorSession)
);

console.log("Doctor logged in:", doctorSession);

navigate("/doctor-dashboard");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="doctor-auth-page">
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          className="doctor-auth-card"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
        >
          <h2>
            {mode === "login"
              ? "Doctor Login"
              : "Doctor Registration"}
          </h2>

          <p className="subtitle">
            {mode === "login"
              ? "Access your dashboard and manage patients"
              : "Create a new doctor account"}
          </p>

          {/* DOCTOR SELECT */}
          <div className="select-wrap">
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
            >
              <option value="">Select Doctor Profile</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} • {doc.speciality}
                </option>
              ))}
            </select>
          </div>

          <input
            placeholder="Doctor Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={handleSubmit}>
            {mode === "login"
              ? "Login to Dashboard"
              : "Create Doctor Account"}
          </button>

          <p className="switch-text">
            {mode === "login" ? (
              <>
                New doctor?{" "}
                <span onClick={() => setMode("signup")}>
                  Create account
                </span>
              </>
            ) : (
              <>
                Already registered?{" "}
                <span onClick={() => setMode("login")}>
                  Login
                </span>
              </>
            )}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}