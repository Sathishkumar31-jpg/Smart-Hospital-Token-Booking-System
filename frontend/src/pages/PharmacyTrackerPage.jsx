import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./PharmacyTrackerPage.css";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

const API = "https://smart-hospital-token-booking-system.onrender.com";
const socket = io(API);

export default function PharmacyTrackerPage() {
  const [user, setUser] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);

  const fetchMyData = async (uid) => {
    try {
      const res = await fetch(`${API}/pharmacy/orders`);
      const data = await res.json();
      if (data.success && data.orders.length > 0) {
        const myOrd = data.orders.find(o => o.patientId === uid);
        setOrder(myOrd || null);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        fetchMyData(u.uid);
      } else {
        setLoading(false);
      }
    });

    socket.on("PATIENT_PHARMACY_UPDATE", (data) => {
      if (user && data.patientId === user.uid) {
         setOrder(data.order);
      }
    });

    return () => {
       unsub();
       socket.off("PATIENT_PHARMACY_UPDATE");
    };
  }, [user?.uid]);

  const processPayment = async () => {
    if (!order) return;
    setIsPaying(true);
    setTimeout(async () => {
       await fetch(`${API}/payment/pay`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ orderId: order._id })
       });
       setIsPaying(false);
    }, 2000);
  };

  const downloadBill = () => {
    const printContent = `
      <html>
        <head>
          <title>Medical Receipt - ${order?._id.slice(-6).toUpperCase()}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
            .header { text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 30px; }
            .content { max-width: 600px; margin: auto; }
            .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .total { font-size: 20px; font-weight: bold; border-top: 2px solid #f1f5f9; padding-top: 15px; margin-top: 20px; }
            .status { color: #16a34a; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="content">
            <div class="header">
              <h1>🏥 SMART HOSPITAL</h1>
              <p>Pharmacy Services - Official Receipt</p>
            </div>
            <div class="row"><strong>Patient:</strong> <span>${order?.patientName}</span></div>
            <div class="row"><strong>Order ID:</strong> <span>#${order?._id.slice(-6).toUpperCase()}</span></div>
            <div class="row"><strong>Doctor:</strong> <span>${order?.doctorName}</span></div>
            <div class="row"><strong>Problem:</strong> <span>${order?.patientProblem}</span></div>
            <hr style="border:0; border-top: 1px dashed #cbd5e1; margin: 20px 0;"/>
            <strong>Prescribed Medicines:</strong>
            <ul>${order?.medicines.map(m => `<li>${m}</li>`).join('')}</ul>
            <div class="total">Total Paid: ₹${order?.billAmount}</div>
            <p class="status">Payment Processed Successfully ✅</p>
          </div>
        </body>
      </html>
    `;
    const win = window.open('', '_blank');
    win.document.write(printContent);
    win.document.close();
    win.print();
  };

  if (loading) return <div className="pharmacy-tracker-wrapper">Loading Tracker...</div>;

  return (
    <div className="pharmacy-tracker-wrapper">
      <div className="tracker-card">
        <h2>💊 Pharmacy Tracker</h2>
        <p className="subtitle">Live Medicine Delivery Status</p>

        {order ? (
          <div className="active-view">
            {/* 4-Step Stepper */}
            <div className="stepper-ui">
              <div className={`step ${['Requested','Processing','Ready','Delivered'].includes(order.status) ? 'active' : ''}`}>Requested</div>
              <div className={`step-line ${['Processing','Ready','Delivered'].includes(order.status) ? 'active' : ''}`}></div>
              <div className={`step ${['Processing','Ready','Delivered'].includes(order.status) ? 'active' : ''}`}>Bill & Pay</div>
              <div className={`step-line ${['Ready','Delivered'].includes(order.status) ? 'active' : ''}`}></div>
              <div className={`step ${['Ready','Delivered'].includes(order.status) ? 'active' : ''}`}>Packing</div>
              <div className={`step-line ${['Delivered'].includes(order.status) ? 'active' : ''}`}></div>
              <div className={`step ${order.status === 'Delivered' ? 'active' : ''}`}>Delivered</div>
            </div>

            {/* Main Status Display */}
            <div className="status-container">
              {order.status === "Delivered" ? (
                <div className="status-msg">
                   <div className="box-icon-large">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color: '#f59e0b'}}>
                        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
                        <path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
                      </svg>
                   </div>
                   <h3>Medication Delivered!</h3>
                   <p>Your medicines have reached your room. Get well soon!</p>
                </div>
              ) : (
                <div className="status-msg">
                   <div className="box-icon-large spinner" style={{animation: 'spin 4s linear infinite'}}>
                      <span style={{fontSize: '60px'}}>⌛</span>
                   </div>
                   <h3>{order.status === "Requested" ? "Processing Order..." : order.status === "Processing" ? "Awaiting Payment" : "Packing Medicines..."}</h3>
                </div>
              )}
            </div>

            {/* Digital Receipt Container */}
            <div className="digital-receipt">
               <div className="receipt-header">📜 DIGITAL RECEIPT</div>
               <div className="receipt-row"><strong>Patient:</strong> <span>{order.patientName}</span></div>
               <div className="receipt-row"><strong>Order:</strong> <span>#{order._id.slice(-6).toUpperCase()}</span></div>
               <div className="receipt-divider"></div>
               <div className="receipt-total">Paid: <span>₹{order.billAmount}</span></div>
               <div className="receipt-status">Status: SUCCESS ✅</div>
            </div>

            {/* Download Button */}
            {order.status === "Delivered" && (
              <button className="btn-download-bill pulse-btn" onClick={downloadBill}>
                Download Medical Bill 📥
              </button>
            )}

            {order.status === "Processing" && order.paymentStatus === "Pending" && (
               <button className="btn-download-bill" onClick={processPayment} disabled={isPaying} style={{background: '#3b82f6'}}>
                 {isPaying ? "Processing UPI..." : `Pay ₹${order.billAmount} via UPI 🛡️`}
               </button>
            )}
          </div>
        ) : (
          <div className="no-order">
            <p>No active pharmacy orders found.</p>
            <p style={{fontSize:'12px', color:'#64748b'}}>Consult with a doctor to receive a digital prescription.</p>
          </div>
        )}
      </div>
    </div>
  );
}
