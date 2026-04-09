import { useEffect, useRef, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import HospitalMap from "../components/HospitalMap";
import "./QueuePage.css";

const API = "http://localhost:5000";
const AVG = 5 * 60;
const socket = io(API);

const JUNIOR_DOCTORS = [
  { id: "10", name: "Dr. Arun (GP)" },
  { id: "11", name: "Dr. Divya (GP)" },
  { id: "12", name: "Dr. Sanjay (GP)" },
];

export default function QueuePage() {
  const nav = useNavigate();
  const redirected = useRef(false);

  const [user, setUser] = useState(null);
  const [appt, setAppt] = useState(null);
  const [queue, setQueue] = useState([]);
  const [showThanks, setShowThanks] = useState(false);
  const [emergency, setEmergency] = useState(false);
  const [showGP, setShowGP] = useState(false);
  const [showMap, setShowMap] = useState(false);
  
  // 💊 PHARMACY ADDITIONS
  const [pharmacyOrder, setPharmacyOrder] = useState(null);
  const [isPaying, setIsPaying] = useState(false);

  // 🔐 AUTH
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (!u) nav("/login");
      else setUser(u);
    });
  }, []);

  // 🔄 LOAD DATA
  const load = async (uid) => {
    const p = await fetch(`${API}/queue/patient/${uid}`);
    const pd = await p.json();
    if (!pd.appointment) return;

    const appointment = pd.appointment;
    setAppt(appointment);

    // 🔥 COMPLETED HANDLING
    if (appointment.status === "COMPLETED") {
      setQueue([]);
      // Check for Pharmacy Order when completed
      const pRes = await fetch(`${API}/pharmacy/orders`);
      const pData = await pRes.json();
      if (pData.success && pData.orders.length > 0) {
        const myOrd = pData.orders.find(o => o.patientId === uid);
        setPharmacyOrder(myOrd || null);
      }
      return;
    }

    // 🧠 LOAD QUEUE
    const q = await fetch(
      `${API}/queue/doctor/${appointment.doctorId}?session=${appointment.session}`
    );
    const qd = await q.json();
    setQueue(qd.queue || []);
  };

  // 🔔 SOCKET LISTENERS
  useEffect(() => {
    if (!user) return;

    load(user.uid);

    socket.on("QUEUE_UPDATE", () => load(user.uid));
    socket.on("DOCTOR_EMERGENCY", () => setEmergency(true));
    
    socket.on("PATIENT_PHARMACY_UPDATE", (data) => {
      if (user && data.patientId === user.uid) {
         setPharmacyOrder(data.order);
      }
    });

    return () => {
      socket.off("QUEUE_UPDATE");
      socket.off("DOCTOR_EMERGENCY");
      socket.off("PATIENT_PHARMACY_UPDATE");
    };
  }, [user]);



  if (!appt) return <p>Loading...</p>;

  // QUEUE MATH
  const idx = queue.findIndex((q) => q._id === appt._id);
  const myToken = appt.tokenNumber || idx + 1;
  const inProgress = queue.find(q => q.status === "IN_PROGRESS");
  const nowServingToken = inProgress ? inProgress.tokenNumber : (
      queue.length > 0 && queue[0]._id !== appt._id ? queue[0].tokenNumber : "--"
  );
  const waitingTime = idx > 0 ? idx * AVG : 0;
  const etaMinutes = Math.floor(waitingTime / 60);



  // 🔁 TRANSFER TO GP
  const transfer = async (gp) => {
    await fetch(`${API}/appointment/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: appt._id,
        doctorId: gp.id,
        doctorName: gp.name,
      }),
    });

    setEmergency(false);
    setShowGP(false);
  };

  // 🏥 CHECK IN
  const handleCheckIn = async () => {
    await fetch(`${API}/appointment/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: appt._id }),
    });
    // Immediately optimistic update
    setAppt({ ...appt, isInsideHospital: true });
  };

  // 💊 PAYMENT LOGIC
  const processPayment = async () => {
    if (!pharmacyOrder) return;
    setIsPaying(true);
    // Simulate UPI/Gateway delay
    setTimeout(async () => {
       await fetch(`${API}/payment/pay`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ orderId: pharmacyOrder._id })
       });
       setIsPaying(false);
    }, 2000);
  };

  const downloadBill = () => {
    const printContent = `
      <html>
        <head>
          <title>Pharmacy Bill - ${pharmacyOrder?._id}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #1e293b; }
            .receipt-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
            .receipt-header h2 { margin: 0 0 10px 0; color: #0f172a; }
            .receipt-header p { margin: 0; color: #64748b; }
            .receipt-details { margin-bottom: 20px; font-size: 16px; }
            .receipt-details p { margin: 8px 0; }
            hr { border-top: 1px dashed #cbd5e1; margin: 20px 0; border-bottom: none; border-left: none; border-right: none; }
            .total-amt { font-size: 20px; font-weight: bold; color: #0f172a; border-top: 1px solid #cbd5e1; padding-top: 15px;}
            ul { margin-top: 5px; }
            li { padding: 4px 0; }
          </style>
        </head>
        <body>
          <div class="receipt-header">
            <h2>🏥 Smart Hospital Pharmacy</h2>
            <p>Official Order Receipt</p>
          </div>
          <div class="receipt-details">
            <p><strong>Order ID:</strong> ${pharmacyOrder?._id}</p>
            <p><strong>Patient Name:</strong> ${pharmacyOrder?.patientName}</p>
            ${appt?.patientProblem ? `<p><strong>Description:</strong> ${appt.patientProblem}</p>` : ''}
            <hr />
            <p><strong>Medicines Prescribed:</strong></p>
            <ul>
              ${pharmacyOrder?.medicines?.map(m => `<li>${m}</li>`).join('') || ''}
            </ul>
            <hr />
            <p class="total-amt"><strong>Total Paid:</strong> ₹${pharmacyOrder?.billAmount}</p>
            <p style="color: #16a34a; font-weight: bold;">Status: PAID ONLINE ✅</p>
            <p style="color: #475569; font-size: 14px; margin-top: 20px;"><strong>Delivery Method:</strong> ${pharmacyOrder?.deliveryMethod || 'Room Delivery'}</p>
          </div>
        </body>
      </html>
    `;
    const windowPrint = window.open('', '', 'width=800,height=600');
    windowPrint.document.write(printContent);
    windowPrint.document.close();
    windowPrint.focus();
    setTimeout(() => {
      windowPrint.print();
      windowPrint.close();
    }, 500);
  };



  return (
    <div className="queue-container">
      {/* SMART INDOOR NAVIGATION MODAL */}
      {showMap && (
        <HospitalMap 
          doctorFloor={appt.doctorFloor} 
          doctorRoom={appt.doctorRoom} 
          doctorName={appt.doctorName} 
          onClose={() => setShowMap(false)} 
        />
      )}

      {/* LEFT */}
      <div className="queue-card">
        <h2>Queue Tracker</h2>

        {appt.status !== "COMPLETED" && (
          <div className="patient-info">
             <p><strong>Name:</strong> {appt.patientName} (Age: {appt.patientAge})</p>
             <p><strong>Problem:</strong> {appt.patientProblem}</p>
          </div>
        )}

        {/* LOCATION INFO */}
        {appt.status !== "COMPLETED" && (
          <div className="doc-location-box">
             <h4>Doctor Location Live Update</h4>
             <p><strong>Doctor:</strong> {appt.doctorName}</p>
             <p><strong>Location:</strong> {appt.doctorRoom} — {appt.doctorFloor} Floor</p>
             <div className="simple-dir">
                <p>Go to {appt.doctorFloor} Floor ⬆️</p>
                <p>{appt.doctorRoom} → Left side</p>
             </div>
             <button className="open-map-btn" onClick={() => setShowMap(true)}>
               Show Hospital Map 📍
             </button>
          </div>
        )}

        {/* ✅ COMPLETED → PHARMACY TRACKER */}
        {appt.status === "COMPLETED" && (
          <div className="pharmacy-tracker-inline">
             <hr style={{opacity:"0.1", margin:"20px 0"}}/>
             <h2 style={{color:"#3b82f6", display:"flex", alignItems:"center", gap:"10px", justifyContent:"center"}}>
               💊 Pharmacy Tracker
             </h2>
             <p style={{color:"#94a3b8", textAlign:"center", fontSize:"13px", marginBottom:"25px"}}>Live Medicine Delivery Status</p>

             {!pharmacyOrder ? (
               <div className="loading-pharmacy">
                 <div className="spinner">⌛</div>
                 <p>Waiting for Doctor's Prescription to reach Pharmacy...</p>
               </div>
             ) : (
                <div className="active-tracker-view">
                   {/* 4-Step Stepper */}
                   <div className="stepper-ui">
                      <div className={`step ${['Requested','Processing','Ready','Delivered'].includes(pharmacyOrder.status) ? 'active' : ''}`}>Requested</div>
                      <div className={`step-line ${['Processing','Ready','Delivered'].includes(pharmacyOrder.status) ? 'active' : ''}`}></div>
                      <div className={`step ${['Processing','Ready','Delivered'].includes(pharmacyOrder.status) ? 'active' : ''}`}>Bill & Pay</div>
                      <div className={`step-line ${['Ready','Delivered'].includes(pharmacyOrder.status) ? 'active' : ''}`}></div>
                      <div className={`step ${['Ready','Delivered'].includes(pharmacyOrder.status) ? 'active' : ''}`}>Packing</div>
                      <div className={`step-line ${['Delivered'].includes(pharmacyOrder.status) ? 'active' : ''}`}></div>
                      <div className={`step ${pharmacyOrder.status === 'Delivered' ? 'active' : ''}`}>Delivered</div>
                   </div>

                   <div className="tracker-status-box">
                      {pharmacyOrder.status === "Delivered" ? (
                        <div className="status-msg">
                           <div className="box-icon-mini">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color: '#f59e0b', width:'100%', height:'100%'}}>
                                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
                                <path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
                              </svg>
                           </div>
                           <h3>Medication Delivered!</h3>
                           <p>Your medicines have reached your room.</p>
                        </div>
                      ) : (
                        <div className="status-msg">
                           <div className="spinner">⌛</div>
                           <h3 style={{color: '#38bdf8'}}>{pharmacyOrder.status === "Requested" ? "Processing..." : "Ready for Payment"}</h3>
                        </div>
                      )}

                      {/* Digital Receipt Overlay */}
                      <div className="digital-receipt">
                         <h4>📜 DIGITAL RECEIPT</h4>
                         <div className="receipt-row"><strong>Patient:</strong> <span>{pharmacyOrder.patientName}</span></div>
                         <div className="receipt-row"><strong>Order:</strong> <span>#{pharmacyOrder._id.slice(-6).toUpperCase()}</span></div>
                         <div className="receipt-divider"></div>
                         <div className="receipt-total">Paid: <span>₹{pharmacyOrder.billAmount}</span></div>
                         <div className="receipt-status">Status: SUCCESS ✅</div>
                      </div>

                      {pharmacyOrder.status === "Delivered" && (
                        <button onClick={downloadBill} className="download-bill-inline pulse-btn">
                          Download Medical Bill 📥
                        </button>
                      )}
                      
                      {pharmacyOrder.status === "Processing" && pharmacyOrder.paymentStatus === "Pending" && (
                        <button onClick={processPayment} disabled={isPaying} className="download-bill-inline" style={{background: '#3b82f6'}}>
                           {isPaying ? "Processing..." : `Pay ₹${pharmacyOrder.billAmount} UPI`}
                        </button>
                      )}
                   </div>
                </div>
             )}
          </div>
        )}

        {/* 🟠 IN PROGRESS */}
        {!showThanks && appt.status === "IN_PROGRESS" && (
          <div className="status warning pulse">
            <h2>Now Consulting</h2>
            <p>Please enter the doctor's room immediately.</p>
          </div>
        )}

        {/* 🟡 WAITING */}
        {!showThanks && appt.status === "WAITING" && idx >= 0 && (
          <>
            <div className="tokens-display">
               <div className="token-box">
                  <span className="label">Now Serving</span>
                  <span className="value">{nowServingToken}</span>
               </div>
               <div className="token-box highlight">
                  <span className="label">Your Token</span>
                  <span className="value">{myToken}</span>
               </div>
            </div>
            {idx === 0 && appt.status === "WAITING" && (
               <p style={{textAlign:"center", color:"#38bdf8", marginTop:"-10px", marginBottom:"20px", fontWeight:"600"}}>
                 (Doctor will call you shortly!)
               </p>
            )}

            {/* SMART ARRIVAL ALERT */}
            <div className="smart-arrival">
                {etaMinutes > 10 && (
                   <div className="alert info">
                     ⏳ You should reach hospital in ~{etaMinutes} minutes. 
                     ({idx} patients ahead)
                   </div>
                )}
                {etaMinutes <= 10 && etaMinutes > 5 && (
                   <div className="alert warning pulse">
                     🚶‍♂️ Please start now. You should reach in ~{etaMinutes} mins.
                   </div>
                )}
                {etaMinutes <= 5 && (
                   <div className="alert danger pulse">
                     ⏰ You will be called soon! Please be at the waiting area.
                   </div>
                )}
            </div>

            {/* CHECK-IN */}
            <div className="checkin-section">
               {appt.isInsideHospital ? (
                 <div className="checked-in-badge">✔ You are inside hospital</div>
               ) : (
                 <button className="checkin-btn" onClick={handleCheckIn}>
                    I have reached the hospital 🏥
                 </button>
               )}
            </div>

          </>
        )}
      </div>

      {/* RIGHT – LIVE QUEUE */}
      <div className="live-queue">
        <h3>Live Queue ({queue.length} left)</h3>

        {queue.length === 0 && <p>No active patients</p>}

        {queue.map((p, i) => (
          <div key={p._id} className={`queue-row ${p._id === appt._id ? "my-row" : ""}`}>
            <b>T-{p.tokenNumber || i + 1} {p._id === appt._id ? "(You)" : p.patientName}</b>
            <div className="sub">
              Age: {p.patientAge} | {p.patientProblem}
            </div>
            <span className="tag">{p.priorityType}</span>
          </div>
        ))}
      </div>

      {/* 🚨 EMERGENCY SLIDE */}
      {emergency && !showGP && (
        <div className="right-slide">
          <h3>🚨 Doctor went to emergency surgery</h3>
          <button onClick={() => setShowGP(true)}>
            Consult Junior Doctor
          </button>
          <button onClick={() => setEmergency(false)}>Wait</button>
        </div>
      )}

      {showGP && (
        <div className="right-slide">
          <h3>Select Junior Doctor</h3>
          {JUNIOR_DOCTORS.map((gp) => (
            <button key={gp.id} onClick={() => transfer(gp)}>
              {gp.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}