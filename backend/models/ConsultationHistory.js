import mongoose from "mongoose";

const ConsultationHistorySchema = new mongoose.Schema({
  patientId: String,
  patientName: String,
  patientAge: Number,
  patientProblem: String,

  doctorId: String,
  doctorName: String,

  priorityType: String,
  session: String,
  medicines: [String],

  completedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model(
  "ConsultationHistory",
  ConsultationHistorySchema
);