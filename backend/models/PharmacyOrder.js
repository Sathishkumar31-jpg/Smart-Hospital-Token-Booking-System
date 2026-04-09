import mongoose from "mongoose";

const PharmacyOrderSchema = new mongoose.Schema({
  patientName: {
    type: String,
    required: true,
  },
  patientId: {
    type: String,
    required: true,
  },
  doctorName: {
    type: String,
    default: "Dr. Hospital",
  },
  patientProblem: {
    type: String,
    default: "Common Consultation",
  },
  medicines: [
    {
      name: String,
      amount: Number,
    },
  ],
  status: {
    type: String,
    enum: ["Requested", "Processing", "Ready", "Delivered"],
    default: "Requested",
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid"],
    default: "Pending",
  },
  billAmount: {
    type: Number,
    default: 0,
  },
  deliveryMethod: {
    type: String,
    enum: ["Room Delivery", "Pickup"],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("PharmacyOrder", PharmacyOrderSchema);
