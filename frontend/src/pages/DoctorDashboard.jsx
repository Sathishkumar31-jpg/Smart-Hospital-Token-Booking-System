import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { OPD_LIMIT_PER_DOCTOR } from "../config/queueLimits";
import "./DoctorDashboard.css";
import "./PharmacyTrackerPage.css";

const API = "https://smart-hospital-token-booking-system.onrender.com";
const socket = io(API);

export default function DoctorDashboard() {
  const doctor = JSON.parse(sessionStorage.getItem("doctorSession"));
  const [session, setSession] = useState("morning");
  const [patients, setPatients] = useState([]);
  const [opdCount, setOpdCount] = useState(0);
  const [endedPatient, setEndedPatient] = useState(null); 
  const [trackingOrder, setTrackingOrder] = useState(null); // Active tracking view
  const [prescribedMeds, setPrescribedMeds] = useState([{ name: "", amount: "" }]);

  const addMedRow = () => setPrescribedMeds([...prescribedMeds, { name: "", amount: "" }]);
  const updateMedRow = (i, field, val) => {
    const list = [...prescribedMeds];
    list[i][field] = val;
    setPrescribedMeds(list);
  };
  const removeMedRow = (i) => {
    if (prescribedMeds.length > 1) {
      setPrescribedMeds(prescribedMeds.filter((_, idx) => idx !== i));
    }
  };
  const totalBill = prescribedMeds.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

  // 🔹 Load queue
  const load = async () => {
    const r = await fetch(
      `${API}/queue/doctor/${doctor.doctorId}?session=${session}`
    );
    const d = await r.json();
    setPatients(d.queue || []);
  };

  // 🔹 Load OPD count
  const loadOpdCount = async () => {
    const today = new Date().toISOString().split("T")[0];

    const r = await fetch(
      `${API}/queue/opd-count?doctorId=${doctor.doctorId}&session=${session}&date=${today}`
    );
    const d = await r.json();
    if (d.success) setOpdCount(d.count);
  };

  useEffect(() => {
    load();
    loadOpdCount();

    socket.on("QUEUE_UPDATE", () => {
      load();
      loadOpdCount();
    });

    socket.on("PHARMACY_UPDATE", (data) => {
      // If we are tracking an order, and a general pharmacy update happens, 
      // we might want to refresh. But usually PATIENT_PHARMACY_UPDATE is better.
    });

    socket.on("PATIENT_PHARMACY_UPDATE", (data) => {
      if (trackingOrder && data.order._id === trackingOrder._id) {
         setTrackingOrder(data.order);
      }
    });

    return () => {
       socket.off("QUEUE_UPDATE");
       socket.off("PHARMACY_UPDATE");
       socket.off("PATIENT_PHARMACY_UPDATE");
    };
  }, [session, trackingOrder?._id]);

  const update = async (id, status) => {
    await fetch(`${API}/appointment/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
  };

  const emergency = async () => {
    await fetch(`${API}/doctor/emergency`, { method: "POST" });
  };

  const handleEndCall = async (p) => {
    // Just set this patient as ended to show Pharmacy button
    // It will be completed AFTER saving prescription
    setEndedPatient(p);
  };

  const sendPrescription = async () => {
    const validMeds = prescribedMeds.filter(m => m.name.trim() !== "");
    if (validMeds.length === 0) {
      alert("Please enter at least one medicine name.");
      return;
    }
    
    // 1. Complete the call and save medicines (flatten names for history)
    await fetch(`${API}/appointment/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: endedPatient._id,
        status: "COMPLETED",
        medicines: validMeds.map(m => `${m.name} (₹${m.amount || 0})`)
      }),
    });

    // 2. Automatically create Pharmacy Order for the patient
    const res = await fetch(`${API}/pharmacy/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
         patientId: endedPatient.patientId,
         patientName: endedPatient.patientName,
         doctorName: doctor.doctorName,
         patientProblem: endedPatient.patientProblem,
         medicines: validMeds,
         deliveryMethod: "Room Delivery"
      })
    });
    const data = await res.json();

    if (data.success) {
      setTrackingOrder(data.order); // Switch to tracking view
    }

    setEndedPatient(null);
    setPrescribedMeds([{ name: "", amount: "" }]); // Reset for next use
  };

  return (
    <div className="doctor-bg">
      <div className="doctor-glass">
        <h2>Doctor Dashboard</h2>

        <button className="emergency-btn" onClick={emergency}>
          🚨 Emergency Surgery
        </button>

        {/* 🔹 PHARMACY ACTION AFTER ENDING CALL */}
        {endedPatient && (
          <div style={{
            background: "#1e293b", margin: "15px 0", padding: "20px", 
            borderRadius: "15px", border: "1px solid #334155", textAlign: "left",
            boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
          }}>
            <h3 style={{color:"#38bdf8", marginTop:0, display: "flex", justifyContent: "space-between"}}>
               <span>Prescription for {endedPatient.patientName}</span>
               <span style={{fontSize: "14px", color: "#94a3b8"}}>Total: ₹{totalBill}</span>
            </h3>
            
            <div className="med-entry-list" style={{marginBottom: "15px"}}>
               {prescribedMeds.map((med, i) => (
                 <div key={i} style={{display: "flex", gap: "10px", marginBottom: "8px"}}>
                    <input 
                      type="text" 
                      placeholder="Tablet Name" 
                      value={med.name}
                      onChange={(e) => updateMedRow(i, 'name', e.target.value)}
                      style={{flex: 2, padding:"10px", borderRadius:"8px", border:"1px solid #334155", background: "#0f172a", color: "#fff"}}
                    />
                    <input 
                      type="number" 
                      placeholder="Amt" 
                      value={med.amount}
                      onChange={(e) => updateMedRow(i, 'amount', e.target.value)}
                      style={{flex: 1, padding:"10px", borderRadius:"8px", border:"1px solid #334155", background: "#0f172a", color: "#fff"}}
                    />
                    {prescribedMeds.length > 1 && (
                      <button 
                        onClick={() => removeMedRow(i)}
                        style={{background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "none", borderRadius: "8px", width: "40px", cursor: "pointer"}}
                      >✕</button>
                    )}
                 </div>
               ))}
               <button 
                 onClick={addMedRow}
                 style={{background: "rgba(56, 189, 248, 0.1)", color: "#38bdf8", border: "1px dashed #38bdf8", padding: "8px", borderRadius: "8px", width: "100%", cursor: "pointer", fontWeight: "bold", marginTop: "5px"}}
               >
                 + Add Medicine
               </button>
            </div>

            <div style={{display: "flex", gap: "10px", marginTop: "20px"}}>
              <button 
                onClick={sendPrescription}
                style={{flex: 1, background:"linear-gradient(135deg, #38bdf8, #2563eb)", border:"none", padding:"14px", color:"#fff", borderRadius:"12px", cursor:"pointer", fontWeight:"bold", boxShadow:"0 4px 15px rgba(37, 99, 235, 0.3)"}}
              >
                ✅ Confirm & Generate Bill
              </button>
              <button 
                onClick={async () => {
                   await fetch(`${API}/appointment/status`, {
                     method: "POST", headers: { "Content-Type": "application/json" },
                     body: JSON.stringify({ id: endedPatient._id, status: "COMPLETED" })
                   });
                   setEndedPatient(null);
                   setPrescribedMeds([{ name: "", amount: "" }]);
                }}
                style={{padding:"14px 20px", background:"#334155", color:"#94a3b8", border:"none", borderRadius:"12px", cursor:"pointer"}}
              >
                ✕ Skip
              </button>
            </div>
          </div>
        )}

        {/* 🔹 OPD LOAD INDICATOR */}
        <div style={{ marginBottom: "20px" }}>
          <b>OPD Load</b>
          <p>
            {opdCount} / {OPD_LIMIT_PER_DOCTOR} patients
          </p>

          <progress
            value={opdCount}
            max={OPD_LIMIT_PER_DOCTOR}
            style={{ width: "100%" }}
          />

          {opdCount >= OPD_LIMIT_PER_DOCTOR && (
            <p style={{ color: "red", fontWeight: "bold" }}>
              ⚠ OPD LIMIT REACHED — New OPD patients redirected to Junior Doctor
            </p>
          )}
        </div>

        {/* 🔹 PHARMACY TRACKER VIEW (WHEN TRACKING) */}
        {trackingOrder ? (
          <div className="pharmacy-tracker-wrapper" style={{background: "none", padding: 0, minHeight: "auto"}}>
            <div className="tracker-card" style={{marginTop: 0, width: "100%", maxWidth: "none"}}>
              <button 
                onClick={() => setTrackingOrder(null)}
                style={{
                  position: "absolute", top: "20px", right: "20px", padding: "8px 15px", 
                  background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", 
                  borderRadius: "8px", cursor: "pointer", fontSize: "12px"
                }}
              >
                ✕ Close Tracker
              </button>
              <h2>💊 Pharmacy Tracker</h2>
              <p className="subtitle">Live Medicine Delivery Status for {trackingOrder.patientName}</p>

              <div className="active-view">
                {/* 4-Step Stepper */}
                <div className="stepper-ui">
                  <div className={`step ${['Processing','Delivered'].includes(trackingOrder.status) ? 'active' : ''}`}>Bill Ready</div>
                  <div className={`step-line ${['Delivered'].includes(trackingOrder.status) ? 'active' : ''}`}></div>
                  <div className={`step ${trackingOrder.status === 'Delivered' ? 'active' : ''}`}>Paid & Delivered</div>
                </div>

                {/* Main Status Display */}
                <div className="status-container">
                  {trackingOrder.status === "Requested" && (
                    <div className="status-msg">
                       <div className="box-icon-large" style={{fontSize: '60px', animation: 'spin 4s linear infinite', display: "inline-block"}}>⌛</div>
                       <h3>Processing prescription...</h3>
                       <p>Pharmacy staff is preparing your digital bill.</p>
                       <button 
                         onClick={() => fetch(`${API}/pharmacy/simulate-process/${trackingOrder._id}`)}
                         style={{marginTop: "15px", padding: "8px 12px", background: "#334155", border: "none", color: "#94a3b8", borderRadius: "6px", cursor: "pointer", fontSize: "11px"}}
                       >
                         (Demo) Sim: Push Bill ₹450
                       </button>
                    </div>
                  )}

                  {trackingOrder.status === "Processing" && trackingOrder.paymentStatus === "Pending" && (
                    <div className="status-msg">
                       <h3 style={{color: "#38bdf8", marginBottom: "15px"}}>Bill Ready: ₹{trackingOrder.billAmount}</h3>
                       <div style={{background: "white", padding: "10px", borderRadius: "12px", marginBottom: "15px", display: "inline-block"}}>
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=hospital@upi&pn=SmartHospital&am=${trackingOrder.billAmount}`} 
                            alt="Payment QR" 
                            style={{width: "140px", height: "140px"}}
                          />
                       </div>
                       <p style={{fontSize: "14px", opacity: 0.8}}>Scan QR to Pay using UPI</p>
                       <button 
                         onClick={() => fetch(`${API}/payment/pay`, {
                           method: "POST", headers: {"Content-Type": "application/json"},
                           body: JSON.stringify({orderId: trackingOrder._id})
                         })}
                         style={{marginTop: "15px", padding: "12px 25px", background: "#38bdf8", border: "none", color: "#fff", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", fontSize: "16px"}}
                       >
                         Pay Now ₹{trackingOrder.billAmount} 💳
                       </button>
                    </div>
                   )}

                  {trackingOrder.status === "Ready" && (
                    <div className="status-msg">
                       <div className="box-icon-large" style={{fontSize: '60px', animation: 'spin 4s linear infinite', display: "inline-block"}}>📦</div>
                       <h3 style={{color: "#f59e0b"}}>Packing Medicines...</h3>
                       <p>Order paid! Staff is packing your medicines now.</p>
                       <button 
                         onClick={() => fetch(`${API}/pharmacy/order/${trackingOrder._id}`, {
                           method: "PUT", headers: {"Content-Type": "application/json"},
                           body: JSON.stringify({status: "Delivered"})
                         })}
                         style={{marginTop: "15px", opacity: 0.5, fontSize: "11px", background: "none", border: "none", color: "#fff", cursor: "pointer"}}
                       >
                         (Sim: Complete Packing)
                       </button>
                    </div>
                  )}

                  {trackingOrder.status === "Delivered" && (
                    <div className="status-msg">
                       <div className="box-icon-large" style={{fontSize: "60px"}}>✅</div>
                       <h3 style={{color: "#22c55e"}}>Amount Paid & Delivered!</h3>
                       <p>Medicines have been handed over to {trackingOrder.patientName}.</p>
                    </div>
                   )}
                </div>

                {/* Digital Receipt Container */}
                <div className="digital-receipt" style={{maxWidth: "500px", margin: "20px auto"}}>
                   <div className="receipt-header">📜 DIGITAL RECEIPT</div>
                   <div className="receipt-row"><strong>Patient:</strong> <span>{trackingOrder.patientName}</span></div>
                   <div className="receipt-row"><strong>Doctor:</strong> <span>{trackingOrder.doctorName}</span></div>
                   <div className="receipt-row"><strong>Problem:</strong> <span>{trackingOrder.patientProblem}</span></div>
                   <div className="receipt-divider"></div>
                    <div className="receipt-row" style={{display: "block"}}>
                      <strong>Bill Details:</strong>
                      <div style={{marginTop: "10px", background: "rgba(0,0,0,0.2)", borderRadius: "8px", overflow: "hidden"}}>
                        <table style={{width: "100%", borderCollapse: "collapse", fontSize: "13px"}}>
                          <thead>
                            <tr style={{background: "rgba(255,255,255,0.05)"}}>
                              <th style={{padding: "8px", textAlign: "left"}}>Item</th>
                              <th style={{padding: "8px", textAlign: "right"}}>Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            {trackingOrder.medicines.map((m, i) => (
                              <tr key={i} style={{borderTop: "1px solid rgba(255,255,255,0.05)"}}>
                                <td style={{padding: "8px"}}>{m.name}</td>
                                <td style={{padding: "8px", textAlign: "right"}}>₹{m.amount || 0}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                   </div>
                   <div className="receipt-divider"></div>
                   <div className="receipt-total">Paid: <span>₹{trackingOrder.billAmount}</span></div>
                   <div className="receipt-status">Status: {trackingOrder.paymentStatus === 'Paid' ? 'PAID ✅' : 'PENDING ⌛'}</div>
                </div>

                {trackingOrder.status === "Delivered" && (
                  <button 
                    className="btn-download-bill pulse-btn" 
                    onClick={() => {
                        const content = `
                          <html>
                          <head>
                            <style>
                              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
                              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #38bdf8; padding-bottom: 20px; }
                              .h-title { color: #2563eb; margin: 0; font-size: 28px; }
                              .details { margin-bottom: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                              .item-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                              .item-table th { background: #f8fafc; padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0; }
                              .item-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
                              .total-section { text-align: right; font-size: 20px; font-weight: bold; color: #2563eb; }
                              .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #64748b; }
                              .status-badge { display: inline-block; padding: 5px 12px; background: #dcfce7; color: #166534; borderRadius: 20px; fontWeight: bold; fontSize: 14px; }
                            </style>
                          </head>
                          <body>
                            <div class="header">
                              <h1 class="h-title">🏥 SMART HOSPITAL RECEIPT</h1>
                              <p>Health Management System | Digital Billing</p>
                            </div>
                            
                            <div class="details">
                              <div>
                                <p><strong>Patient Name:</strong> ${trackingOrder.patientName}</p>
                                <p><strong>Patient ID:</strong> ${trackingOrder.patientId}</p>
                                <p><strong>Diagnosis:</strong> ${trackingOrder.patientProblem}</p>
                              </div>
                              <div style="text-align: right;">
                                <p><strong>Receipt Date:</strong> ${new Date().toLocaleDateString()}</p>
                                <p><strong>Doctor:</strong> ${trackingOrder.doctorName}</p>
                                <p><span class="status-badge">PAID ✅</span></p>
                              </div>
                            </div>

                            <table class="item-table">
                              <thead>
                                <tr>
                                  <th>Medicine Name</th>
                                  <th style="text-align: right;">Amount (₹)</th>
                                </tr>
                              </thead>
                              <tbody>
                                ${trackingOrder.medicines.map(m => `
                                  <tr>
                                    <td>${m.name}</td>
                                    <td style="text-align: right;">${m.amount || 0}.00</td>
                                  </tr>
                                `).join("")}
                              </tbody>
                            </table>

                            <div class="total-section">
                              Total Paid: ₹${trackingOrder.billAmount}.00
                            </div>

                            <div class="footer">
                              <p>This is a computer-generated digital receipt and requires no signature.</p>
                              <p>Thank you for choosing Smart Hospital!</p>
                            </div>
                          </body>
                          </html>
                        `;
                        const win = window.open("", "_blank");
                        win.document.write(content);
                        win.document.close();
                        // Delay print slightly to ensure content is loaded
                        setTimeout(() => win.print(), 500);
                    }}
                  >
                    Download Medical Bill 📥
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* SESSION TABS */}
            <div className="session-tabs">
              {["morning", "afternoon", "evening"].map((s) => (
                <button
                  key={s}
                  className={session === s ? "active" : ""}
                  onClick={() => setSession(s)}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* PATIENT LIST */}
            {patients.length === 0 ? (
               <div style={{textAlign: "center", padding: "40px", opacity: 0.5}}>
                  <p>No patients in queue for this session.</p>
               </div>
            ) : (
              patients.map((p, i) => (
                <div key={p._id} className="patient-card">
                  <b>
                    Q-{i + 1} {p.patientName}
                    {p.priorityType !== "OPD" && " 🚨"}
                  </b>
                  <p>Age: {p.patientAge}</p>
                  <p>
                    Priority:{" "}
                    <span style={{ color: p.priorityType === "OPD" ? "#38bdf8" : "#ef4444", fontWeight: "bold" }}>
                      {p.priorityType}
                    </span>
                  </p>
                  <p>Problem: {p.patientProblem}</p>
                  {p.arrivalWindow && (
                    <p style={{ fontSize: "12px", color: "#22c55e" }}>⏰ Expected Arrival: <b>{p.arrivalWindow}</b></p>
                  )}
                  {p.status === "WAITING" && <button onClick={() => update(p._id, "IN_PROGRESS")}>Call</button>}
                  {p.status === "IN_PROGRESS" && <button onClick={() => handleEndCall(p)}>End Call</button>}
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
