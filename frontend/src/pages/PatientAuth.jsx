import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";
import "./PatientAuth.css";

export default function PatientAuth() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!email || !password) {
      alert("Please fill all fields");
      return;
    }

    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }

      // ✅ LOGIN SUCCESS → PATIENT DETAILS
      navigate("/patient-details");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="auth-page">
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          className="auth-card"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.95 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <h2>
            {mode === "login"
              ? "Patient Login"
              : "Create Patient Account"}
          </h2>

          <p className="subtitle">
            {mode === "login"
              ? "Welcome back. Login to continue"
              : "Create account to book appointments"}
          </p>

          <input
            type="email"
            placeholder="Email address"
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
            {mode === "login" ? "Login" : "Create Account"}
          </button>

          <p className="switch-text">
            {mode === "login" ? (
              <>
                New patient?{" "}
                <span onClick={() => setMode("signup")}>
                  Create account
                </span>
              </>
            ) : (
              <>
                Already have an account?{" "}
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
