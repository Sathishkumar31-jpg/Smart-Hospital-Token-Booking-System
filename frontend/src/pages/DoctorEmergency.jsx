import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function DoctorEmergency() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];
  const doctor = JSON.parse(sessionStorage.getItem("doctorSession"));

  const confirmEmergency = async () => {
    const q = query(
      collection(db, "appointments"),
      where("doctorId", "==", String(doctor.id)),
      where("appointmentDate", "==", today),
      where("isActive", "==", true)
    );

    const snap = await getDocs(q);

    for (const d of snap.docs) {
      await updateDoc(doc(db, "appointments", d.id), {
        doctorEmergency: true,
      });
    }

    navigate("/doctor-dashboard");
  };

  return (
    <div className="doctor-glass">
      <h2>Emergency Surgery</h2>
      <button onClick={confirmEmergency}>
        I need to go for emergency surgery
      </button>
    </div>
  );
}