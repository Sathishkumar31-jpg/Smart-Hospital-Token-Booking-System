import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useLocation, useNavigate } from "react-router-dom";

export default function DoctorConsult() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const id = state.appointmentId;

  const start = async () => {
    await updateDoc(doc(db, "appointments", id), {
      status: "IN_PROGRESS",
    });
  };

  const end = async () => {
    await updateDoc(doc(db, "appointments", id), {
      status: "COMPLETED",
    });
    navigate("/doctor-dashboard");
  };

  return (
    <div className="doctor-glass">
      <h2>Consultation</h2>
      <button onClick={start}>Start Consultation</button>
      <button onClick={end}>End Consultation</button>
    </div>
  );
}