import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./PatientProfile.css";

const API = "http://localhost:5000";

export default function PatientProfile() {
  const nav = useNavigate();
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔐 AUTH
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (!u) nav("/profile-auth");
      else setUser(u);
    });
  }, []);

  // 📜 LOAD HISTORY
  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const r = await fetch(
        `${API}/patient/history/${user.uid}`
      );
      const d = await r.json();
      setHistory(d.history || []);
      setLoading(false);
    };

    load();
  }, [user]);

  if (loading) {
    return <p className="loading">Loading profile...</p>;
  }

  return (
    <div className="profile-bg">
      <div className="profile-glass">
        <h2>👤 Patient Profile</h2>
        <p className="email">{user.email}</p>

        <h3 className="section-title">
          Consultation History
        </h3>

        {history.length === 0 && (
          <div className="empty">
            No completed consultations yet 🩺
          </div>
        )}

        {/* ✅ GRID WRAPPER ADDED */}
        <div className="history-grid">
          {history.map((h) => (
            <div key={h._id} className="history-card">
              {/* TOP ROW */}
              <div className="row">
                <b>{h.patientName}</b>
                <span className={`badge ${h.priorityType}`}>
                  {h.priorityType}
                </span>
              </div>

              {/* DETAILS */}
              <p className="muted">
                Age: {h.patientAge}
              </p>

              <p className="problem">
                Problem: {h.patientProblem}
              </p>

              <p className="muted">
                Doctor: {h.doctorName}
              </p>

              {/* FOOTER */}
              <div className="row small">
                <span>
                  {new Date(
                    h.updatedAt
                  ).toLocaleDateString()}
                </span>
                <span className="status done">
                  COMPLETED
                </span>
              </div>
            </div>
          ))}
        </div>
        {/* ✅ END GRID */}
      </div>
    </div>
  );
}