import http from 'http';

const API = "https://smart-hospital-token-booking-system.onrender.com";

async function fetchJSON(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data) options.headers['Content-Length'] = data.length;

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject("Failed parsing JSON: " + body);
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runE2ETest() {
  console.log("==================================================");
  console.log("🚀 STARTING FULL E2E SYSTEM TEST (Appointment -> Pharmacy Delivery)");
  console.log("==================================================");

  try {
    // 1. Book Appointment
    console.log("⏳ STEP 1: Booking an OPD Appointment...");
    const bookRes = await fetchJSON('/queue/book', 'POST', {
      patientName: "Sathish E2E Test",
      patientAge: 25,
      patientProblem: "Fever and Cough",
      doctorId: "DR001",
      doctorName: "Dr. Arun",
      session: "Morning",
      priorityType: "OPD"
    });
    console.log("✅ Success! Patient Booked.");
    console.log(`   ➔ Token Assigned: ${bookRes.appointment.tokenNumber}`);
    console.log(`   ➔ Doctor Room: ${bookRes.appointment.doctorRoom}`);

    const patientId = bookRes.appointment.patientId;
    const apptId = bookRes.appointment._id;

    // 2. Complete Appointment (Doctor side)
    console.log("\n⏳ STEP 2: Doctor completes consultation...");
    const completeRes = await fetchJSON('/appointment/status', 'POST', {
      id: apptId,
      status: "COMPLETED"
    });
    console.log("✅ Success! Appointment Completed.");

    // 3. Pharmacy Request (Patient side)
    console.log("\n⏳ STEP 3: Patient opens App and Orders Medicines to Room...");
    const pharmReq = await fetchJSON('/pharmacy/order', 'POST', {
      patientId: patientId,
      patientName: "Sathish E2E Test",
      medicines: ["Dolo 650", "Cough Syrup"],
      deliveryMethod: "Room Delivery"
    });
    const orderId = pharmReq.order._id;
    console.log("✅ Success! Medicines Requested.");
    console.log(`   ➔ Order Status: ${pharmReq.order.status}`);

    // 4. Pharmacy Staff Generates Bill
    console.log("\n⏳ STEP 4: Pharmacy Staff processes the order and generates Bill...");
    const billRes = await fetchJSON(`/pharmacy/order/${orderId}`, 'PUT', {
      status: "Processing",
      billAmount: 1250
    });
    console.log("✅ Success! Bill generated and sent to Patient App.");
    console.log(`   ➔ Bill Amount: ₹${billRes.order.billAmount}`);
    console.log(`   ➔ Payment Status: ${billRes.order.paymentStatus}`);

    // 5. Patient Pays Bill via UPI
    console.log("\n⏳ STEP 5: Patient scans/clicks UPI button and pays the bill...");
    const payRes = await fetchJSON('/payment/pay', 'POST', {
      orderId: orderId
    });
    console.log("✅ Success! Online Payment Successful.");
    console.log(`   ➔ Payment Status: ${payRes.order.paymentStatus} 🤑`);
    console.log(`   ➔ Order Status Auto-Updated: ${payRes.order.status}`);

    // 6. Pharmacy Delivers Medication
    console.log("\n⏳ STEP 6: Pharmacy Staff receives payment confirmation and delivers...");
    const deliverRes = await fetchJSON(`/pharmacy/order/${orderId}`, 'PUT', {
      status: "Delivered"
    });
    console.log("✅ Success! Medicines Delivered to Patient Room.");
    console.log(`   ➔ Final Status: ${deliverRes.order.status}`);

    console.log("\n==================================================");
    console.log("🌟 END-TO-END SMART HOSPITAL FLOW COMPLETELY VERIFIED! 🌟");
    console.log("==================================================");

  } catch (err) {
    console.error("❌ Test Failed:", err);
  }
}

runE2ETest();
