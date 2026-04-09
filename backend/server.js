import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import http from "http";
import { Server } from "socket.io";
import Appointment from "./models/Appointment.js";
import ConsultationHistory from "./models/ConsultationHistory.js";
import PharmacyOrder from "./models/PharmacyOrder.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(cors());
app.use(express.json());

// ================= MONGODB =================
mongoose
  .connect(
    "mongodb+srv://smartqueue:smartqueue744@cluster0.0vqlsb9.mongodb.net/smartqueue"
  )
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ Mongo error", err));

// ================= SOCKET =================
io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);
});

const emitUpdate = () => io.emit("QUEUE_UPDATE");

// ================= BOOK =================
app.post("/queue/book", async (req, res) => {
  try {
    const existing = await Appointment.findOne({
      patientId: req.body.patientId,
      status: { $ne: "COMPLETED" },
    });

    if (existing) {
      return res.json({ success: true, appointment: existing });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date();
    endOfDay.setHours(23,59,59,999);

    const todayCount = await Appointment.countDocuments({
      doctorId: req.body.doctorId,
      session: req.body.session,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const tokenNumber = todayCount + 1;

    // Mocking Room and Floor based on simple mapping
    const docIdNum = parseInt(String(req.body.doctorId || "1").replace(/\D/g, '') || "1");
    const floors = ["Ground", "1st", "2nd", "3rd"];
    const docFloor = floors[docIdNum % floors.length] || "1st";
    const docRoom = `Room 10${(docIdNum % 9) + 1}`;

    const appt = await Appointment.create({
      ...req.body,
      status: "WAITING",
      tokenNumber,
      doctorRoom: docRoom,
      doctorFloor: docFloor
    });

    emitUpdate();
    res.json({ success: true, appointment: appt });
  } catch (error) {
    console.error("Booking Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ================= CHECK IN =================
app.post("/appointment/checkin", async (req, res) => {
  const { id } = req.body;
  const appt = await Appointment.findByIdAndUpdate(
    id,
    { isInsideHospital: true },
    { new: true }
  );
  emitUpdate();
  res.json({ success: true, appointment: appt });
});

// ================= PATIENT =================
app.get("/queue/patient/:uid", async (req, res) => {
  const appt = await Appointment.findOne({
    patientId: req.params.uid,
    status: { $in: ["WAITING", "IN_PROGRESS", "COMPLETED"] },
  }).sort({ createdAt: -1 });

  res.json({ appointment: appt });
});

// ================= DOCTOR QUEUE (PRIORITY ORDER) =================
app.get("/queue/doctor/:doctorId", async (req, res) => {
  const { session } = req.query;

  const queue = await Appointment.aggregate([
    {
      $match: {
        doctorId: req.params.doctorId,
        session,
        status: { $ne: "COMPLETED" },
      },
    },
    {
      $addFields: {
        priorityRank: {
          $switch: {
            branches: [
              { case: { $eq: ["$priorityType", "E1"] }, then: 1 },
              { case: { $eq: ["$priorityType", "E2"] }, then: 2 },
              { case: { $eq: ["$priorityType", "E3"] }, then: 3 },
            ],
            default: 4, // OPD
          },
        },
      },
    },
    {
      $sort: {
        priorityRank: 1,
        createdAt: 1,
      },
    },
  ]);

  res.json({ queue });
});

// ================= STATUS UPDATE =================
app.post("/appointment/status", async (req, res) => {
  const { id, status, medicines } = req.body;

  const appt = await Appointment.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );

  emitUpdate();

  // COPY TO HISTORY
  if (status === "COMPLETED" && appt) {
    await ConsultationHistory.create({
      patientId: appt.patientId,
      patientName: appt.patientName,
      patientAge: appt.patientAge,
      patientProblem: appt.patientProblem,
      doctorId: appt.doctorId,
      doctorName: appt.doctorName,
      priorityType: appt.priorityType,
      session: appt.session,
      medicines: medicines || [],
    });
  }

  res.json({ success: true });
});

// ================= EMERGENCY =================
app.post("/doctor/emergency", async (req, res) => {
  io.emit("DOCTOR_EMERGENCY");
  res.json({ success: true });
});

// ================= TRANSFER =================
app.post("/appointment/transfer", async (req, res) => {
  const { id, doctorId, doctorName } = req.body;

  await Appointment.findByIdAndUpdate(id, {
    doctorId,
    doctorName,
  });

  emitUpdate();
  res.json({ success: true });
});

// ================= OPD COUNT (NEW – SAFE ADDITION) =================
app.get("/queue/opd-count", async (req, res) => {
  try {
    const { doctorId, session, date } = req.query;

    if (!doctorId || !session || !date) {
      return res.status(400).json({
        success: false,
        message: "Missing parameters",
      });
    }

    const opdCount = await Appointment.countDocuments({
      doctorId,
      session,
      priorityType: "OPD",
      status: { $ne: "COMPLETED" },
      createdAt: {
        $gte: new Date(date + "T00:00:00.000Z"),
        $lte: new Date(date + "T23:59:59.999Z"),
      },
    });

    res.json({
      success: true,
      count: opdCount,
    });
  } catch (error) {
    console.error("❌ OPD count error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// ================= PHARMACY & SMART PAYMENT =================

// 1. Patient requests medicines
app.post("/pharmacy/order", async (req, res) => {
  try {
    const { patientId, patientName, medicines, deliveryMethod, doctorName, patientProblem, billAmount } = req.body;
    
    // If medicines are passed with amounts, calculate total billAmount if not provided
    let totalBill = billAmount;
    if (totalBill === undefined && medicines && Array.isArray(medicines)) {
      totalBill = medicines.reduce((sum, med) => sum + (Number(med.amount) || 0), 0);
    }

    const order = await PharmacyOrder.create({
      patientId,
      patientName,
      medicines: medicines || [],
      deliveryMethod,
      doctorName: doctorName || "Dr. Hospital",
      patientProblem: patientProblem || "Common Consultation",
      status: "Processing", // Move to Processing directly if bill is ready
      billAmount: totalBill || 0,
      paymentStatus: "Pending",
    });
    io.emit("PHARMACY_UPDATE"); // Alert pharmacy staff
    io.emit("PATIENT_PHARMACY_UPDATE", { patientId: order.patientId, order }); 
    res.json({ success: true, order });
  } catch (error) {
    console.error("Pharmacy Order Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Pharmacy staff fetches all orders
app.get("/pharmacy/orders", async (req, res) => {
  try {
    const orders = await PharmacyOrder.find().sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Status update / Bill creation (by Pharmacy)
app.put("/pharmacy/order/:id", async (req, res) => {
  try {
    const { status, billAmount } = req.body;
    const updates = {};
    if (status) updates.status = status;
    if (billAmount !== undefined) updates.billAmount = parseInt(billAmount, 10);

    const order = await PharmacyOrder.findByIdAndUpdate(req.params.id, updates, { new: true });
    io.emit("PHARMACY_UPDATE"); 
    io.emit("PATIENT_PHARMACY_UPDATE", { patientId: order.patientId, order }); // push to patient app
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Online Payment Simulation (by Patient)
app.post("/payment/pay", async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await PharmacyOrder.findByIdAndUpdate(orderId, {
      paymentStatus: "Paid",
      status: "Delivered" // User requested direct Delivered status after payment
    }, { new: true });
    
    io.emit("PHARMACY_UPDATE"); // Pharmacy sees "PAID ✅"
    io.emit("PATIENT_PHARMACY_UPDATE", { patientId: order.patientId, order });
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. Simulate Pharmacy processing (for Demo purposes)
app.get("/pharmacy/simulate-process/:id", async (req, res) => {
  try {
    const order = await PharmacyOrder.findByIdAndUpdate(req.params.id, {
      status: "Processing",
      billAmount: 450
    }, { new: true });
    io.emit("PHARMACY_UPDATE");
    io.emit("PATIENT_PHARMACY_UPDATE", { patientId: order.patientId, order });
    res.json({ success: true, order: order });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ================= PATIENT HISTORY =================
app.get("/patient/history/:uid", async (req, res) => {
  try {
    const history = await Appointment.find({
      patientId: req.params.uid,
      status: "COMPLETED",
    }).sort({ updatedAt: -1 });

    res.json({ history });
  } catch (err) {
    res.status(500).json({ history: [] });
  }
});

// ================= LATEST PRESCRIPTION =================
app.get("/patient/latest-prescription/:uid", async (req, res) => {
  try {
    const history = await ConsultationHistory.findOne({
      patientId: req.params.uid,
    }).sort({ completedAt: -1 });
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, history: null });
  }
});

// ================= SERVER =================
// server.listen(5000, () =>
//   console.log("🔥 Smart Queue backend + socket running on 5000")
// );


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🔥 Smart Queue backend + socket running on ${PORT}`);
});