import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { auth } from "../firebase";
import "./Landing.css";

export default function Landing() {
  const navigate = useNavigate();

  // 🔥 PROFILE BUTTON LOGIC
  const handleProfile = () => {
    const doctorSession = sessionStorage.getItem("doctorSession");

    if (doctorSession) {
      navigate("/doctor-profile");
    } else if (auth.currentUser) {
      navigate("/patient-profile");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="landing">
      {/* 🔥 TOP PROFILE BUTTON */}
      <div className="top-bar">
       <button
  className="profile-btn"
onClick={() => navigate("/profile-auth")}
>
  👤 Profile
</button>

      </div>

      {/* OVERLAY */}
      <div className="landing-overlay" />

      {/* MAIN CONTENT */}
      <div className="content">
        <motion.h1
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          Smart Queue <span>+</span>
          <br />
          Appointment
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          Skip long hospital queues.
          <br />
          Book the right doctor in minutes with
          <b> smart scheduling</b>.
        </motion.p>

        <motion.button
          className="get-started"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={() => navigate("/login")}
        >
          Book Appointment →
        </motion.button>

        {/* TRUST LINE */}
        <motion.div
          className="trust-line"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          ✔ Faster Appointments &nbsp; • &nbsp;
          ✔ Smart Queue System &nbsp; • &nbsp;
          ✔ Trusted Doctors
        </motion.div>
      </div>

      {/* SPECIALTIES FLOAT BAR */}
      <motion.div
        className="services"
        initial={{ y: 25, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.1 }}
      >
        <span>🩺 General</span>
        <span>❤️ Cardiology</span>
        <span>🧠 Neurology</span>
        <span>👶 Pediatrics</span>
        <span>🦴 Orthopedics</span>
      </motion.div>
    </div>
  );
}
