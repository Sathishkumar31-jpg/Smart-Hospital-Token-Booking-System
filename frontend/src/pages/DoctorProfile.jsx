import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DoctorProfile.css";

const API = "http://localhost:5000";

export default function DoctorProfile() {
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔐 LOAD DOCTOR SESSION
  useEffect(() => {
    const d = JSON.parse(sessionStorage.getItem("doctorSession"));

    if (!d || !d.doctorId) {
      alert("Doctor session expired. Login again.");
      navigate("/profile-auth");
      return;
    }

    setDoctor(d);
  }, [navigate]);

  // 📊 LOAD ANALYTICS
  useEffect(() => {
    if (!doctor) return;

    const load = async () => {
      try {
        const res = await fetch(
          `${API}/doctor/analytics/${doctor.doctorId}`
        );
        const data = await res.json();
        setStats(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        alert("Failed to load analytics");
        setLoading(false);
      }
    };

    load();
  }, [doctor]);

  if (loading) return <p className="loading">Loading doctor analytics...</p>;

  if (!stats) return <p>No data available</p>;

  return (
    <div className="doctor-profile-bg">
      <div className="doctor-profile-glass">
        <h2>🩺 Doctor Profile</h2>

        <p className="doctor-name">
          {doctor.doctorName} – {doctor.speciality}
        </p>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Patients</h3>
            <p>{stats.total}</p>
          </div>

          <div className="stat-card emergency">
            <h3>Emergency</h3>
            <p>{stats.emergency}</p>
          </div>

          <div className="stat-card opd">
            <h3>OPD</h3>
            <p>{stats.opd}</p>
          </div>

          <div className="stat-card today">
            <h3>Today</h3>
            <p>{stats.todayCount}</p>
          </div>
        </div>

        <h3 className="section-title">Session Wise</h3>

        <div className="session-grid">
          <div>🌅 Morning: {stats.sessions.morning}</div>
          <div>🌞 Afternoon: {stats.sessions.afternoon}</div>
          <div>🌆 Evening: {stats.sessions.evening}</div>
        </div>

        <button
          className="logout-btn"
          onClick={() => {
            sessionStorage.removeItem("doctorSession");
            navigate("/profile-auth");
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}