import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import PatientAuth from "./pages/PatientAuth";
import PatientDetails from "./pages/PatientDetails";
import SmartAppointment from "./pages/SmartAppointment";
import QueuePage from "./pages/QueuePage";
import DoctorAuth from "./pages/DoctorAuth";
import DoctorDashboard from "./pages/DoctorDashboard";
import PatientProfile from "./pages/PatientProfile";
import DoctorProfile from "./pages/DoctorProfile";
import ProfileAuth from "./pages/ProfileAuth";
import BookAppointment from "./pages/BookAppointment";
import BookingSuccess from "./pages/BookingSuccess";
import SymptomChecker from "./pages/SymptomChecker";
import DoctorEmergency from "./pages/DoctorEmergency";
import DoctorConsult from "./pages/DoctorConsult";
import PharmacyDashboard from "./pages/PharmacyDashboard";
import PharmacyTrackerPage from "./pages/PharmacyTrackerPage";

export default function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><Landing /></PageWrapper>} />
        <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
        <Route path="/patient-auth" element={<PageWrapper><PatientAuth /></PageWrapper>} />
        <Route path="/patient-details" element={<PageWrapper><PatientDetails /></PageWrapper>} />
        <Route path="/smart-appointment" element={<PageWrapper><SmartAppointment /></PageWrapper>} />
        <Route path="/queue" element={<PageWrapper><QueuePage /></PageWrapper>} />
        <Route path="/doctor-auth" element={<PageWrapper><DoctorAuth /></PageWrapper>} />
        <Route path="/doctor-dashboard" element={<PageWrapper><DoctorDashboard /></PageWrapper>} />
        <Route path="/patient-profile" element={<PageWrapper><PatientProfile /></PageWrapper>} />
        <Route path="/doctor-profile" element={<PageWrapper><DoctorProfile /></PageWrapper>} />
         <Route path="/profile-auth" element={<PageWrapper><ProfileAuth /></PageWrapper>} />
         <Route path="/book-appointment" element={<PageWrapper><BookAppointment /></PageWrapper>} />
         <Route path="/booking-success" element={<PageWrapper><BookingSuccess /></PageWrapper>} />
        <Route path="/symptom-checker" element={<PageWrapper><SymptomChecker /></PageWrapper>} />
         <Route path="/doctor-consult" element={<PageWrapper><DoctorConsult /></PageWrapper>} />
          <Route path="/doctor-emergency" element={<PageWrapper><DoctorEmergency /></PageWrapper>} />
          <Route path="/pharmacy-dashboard" element={<PageWrapper><PharmacyDashboard /></PageWrapper>} />
          <Route path="/pharmacy-tracker" element={<PageWrapper><PharmacyTrackerPage /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
}

function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      style={{ minHeight: "100vh" }}
    >
      {children}
    </motion.div>
  );
}
