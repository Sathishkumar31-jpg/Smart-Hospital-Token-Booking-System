import mongoose from "mongoose";

const DoctorSchema = new mongoose.Schema({
  doctorId: String,
  name: String,
  department: String,
});

export default mongoose.model("Doctor", DoctorSchema);