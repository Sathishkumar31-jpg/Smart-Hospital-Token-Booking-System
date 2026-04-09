import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./PharmacyDashboard.css";

const API = "https://smart-hospital-token-booking-system.onrender.com";
const socket = io(API);

export default function PharmacyDashboard() {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API}/pharmacy/orders`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrders();
    socket.on("PHARMACY_UPDATE", fetchOrders);
    return () => socket.off("PHARMACY_UPDATE", fetchOrders);
  }, []);

  const handleUpdateStatus = async (id, status, billAmount = undefined) => {
    const payload = { status };
    if (billAmount !== undefined) payload.billAmount = billAmount;
    
    await fetch(`${API}/pharmacy/order/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  };

  const handleBillSubmit = async (e, id) => {
    e.preventDefault();
    const amount = e.target.elements.billAmount.value;
    if (amount) {
      handleUpdateStatus(id, "Processing", amount);
    }
  };

  return (
    <div className="pharmacy-dash">
      <div className="pharmacy-header">
        <h1>💊 Smart Pharmacy Center</h1>
        <p>Zero-Queue Medicine Dispatch System</p>
      </div>

      <div className="orders-grid">
        {orders.length === 0 ? <p>No active orders.</p> : orders.map(order => (
          <div key={order._id} className={`order-card status-${order.status.toLowerCase()}`}>
            <div className="order-head">
              <h3>{order.patientName}</h3>
              <span className={`badge ${order.deliveryMethod === 'Pickup' ? 'badge-warn' : 'badge-info'}`}>
                 {order.deliveryMethod}
              </span>
            </div>
            
            <div className="medicines-list">
              <strong>Prescription:</strong>
              <ul>
                {order.medicines.map((m, i) => (
                  <li key={i} style={{display: "flex", justifyContent: "space-between"}}>
                    <span>{m.name || m}</span>
                    <span>₹{m.amount || 0}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="billing-section">
              {order.status === "Requested" ? (
                <form className="bill-form" onSubmit={(e) => handleBillSubmit(e, order._id)}>
                   <input type="number" name="billAmount" placeholder="Enter Bill Amount (₹)" required />
                   <button type="submit" className="btn btn-primary">Push Bill & Process</button>
                </form>
              ) : (
                <div className="bill-status">
                   <span>Bill: <b>₹{order.billAmount}</b></span>
                   <span className={`pay-status ${order.paymentStatus.toLowerCase()}`}>
                     {order.paymentStatus === "Paid" ? "✅ PAID ONLINE" : "⏳ Pending Payment"}
                   </span>
                </div>
              )}
            </div>

            <div className="actions">
               {order.status === "Ready" && order.paymentStatus === "Paid" && (
                 <button className="btn btn-success" onClick={() => handleUpdateStatus(order._id, "Delivered")}>
                    Confirm Delivered / Picked Up
                 </button>
               )}
               {order.status === "Processing" && order.paymentStatus === "Paid" && (
                 <button className="btn btn-success" onClick={() => handleUpdateStatus(order._id, "Ready")}>
                    Mark Ready for {order.deliveryMethod}
                 </button>
               )}
            </div>
            
            <div className={`status-footer status-${order.status.toLowerCase()}`}>
               Current Status: {order.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
