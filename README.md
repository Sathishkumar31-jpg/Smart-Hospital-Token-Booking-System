# 🏥 Smart Hospital Queue & Appointment Management System

A smart, real-time hospital appointment and queue management system designed to reduce patient waiting time, avoid manual queues, and improve doctor workflow using modern Google cloud technologies.

---

##  Problem Statement

Traditional hospital appointment systems face several issues:
- Manual token systems cause confusion
- Multiple patients arrive for the same time slot
- No real-time queue visibility
- Doctors approve patients randomly
- Patients don’t know actual waiting time

This results in overcrowding, long waits, and poor patient experience.

---

## 💡 Solution Overview

This project introduces a **Smart Appointment & Live Queue System** that:
- Allows multiple patients to book the same session
- Assigns queue numbers dynamically using cloud transactions
- Ensures first-arrived patients get priority
- Provides real-time queue position and countdown timer
- Gives doctors full control over patient flow

The system mimics real-world hospital operations.

---

## 🔄 Application Flow

### 🧑‍⚕️ Patient Flow
1. Login / Register
2. Fill patient profile
3. Select doctor
4. Select session (Morning / Afternoon / Evening / Night)
5. Queue number assigned automatically
6. View:
   - Queue number
   - Patients before you
   - Live waiting time countdown
7. Consultation starts only after doctor approval

---

### 👨‍⚕️ Doctor Flow
1. Doctor logs in
2. Views only arrived patients
3. Approves patients one-by-one
4. Marks consultation as completed
5. Queue automatically moves forward

---

## ⏱️ Queue Logic (Core Feature)

- Multiple patients can book the same session
- Queue number is assigned using Firestore transactions
- No duplicate queue numbers
- Queue order depends on booking/arrival time
- Doctor can approve only one patient at a time

This avoids queue conflicts and duplicate tokens.

---

## 🧠 Smart & AI Features

- AI-based waiting time estimation
- Real-time countdown timer
- Live queue updates using Firestore listeners
- Predictive wait time display
- Intelligent session-based queue handling

---

## 🧱 Tech Stack

### Frontend
- React (Vite)
- CSS3 (custom UI)
- Framer Motion (animations)

### Backend & Cloud (Google Technologies)
- Firebase Authentication
- Cloud Firestore
- Firestore Transactions
- Firebase Hosting

---

## 🤖 Google AI Tools Used

- Gemini AI (conceptual integration)
  - Intelligent waiting time estimation
  - Smart queue prediction logic
  - Future AI health assistant scope

---

## 🗂️ Firestore Database Structure

### appointments
- patientId
- patientName
- doctorId
- doctorName
- session
- queueNumber
- status (WAITING / APPROVED / COMPLETED)
- isActive
- createdAt

### queueCounters
- doctorId_session
- current

---

## ✨ Key Features

- Real-time queue number allocation
- Multiple patients per session
- No duplicate queue positions
- Doctor-controlled approvals
- Live waiting time countdown
- Clean and responsive UI
- Scalable cloud architecture

---

## 🚀 Future Enhancements

- Google Calendar integration
- Push notifications & reminders
- AI-based symptom analysis
- Voice assistant for patients
- Admin analytics dashboard
- Multi-hospital support
- future app development
---

