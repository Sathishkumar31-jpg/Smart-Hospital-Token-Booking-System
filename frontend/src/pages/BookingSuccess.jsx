import { useNavigate } from "react-router-dom";
import "./BookingSuccess.css";

export default function BookingSuccess() {
  const navigate = useNavigate();
  const patient = JSON.parse(localStorage.getItem("patientProfile"));

  return (
    <div className="success-page">
      <h1>✅ Booking Successful</h1>
      <p>
        Your appointment is scheduled for <b>{patient.date}</b>
      </p>
      <p>You will be notified when the doctor is available.</p>

      <button onClick={() => navigate("/")}>
        Go to Home →
      </button>
    </div>
  );
}
