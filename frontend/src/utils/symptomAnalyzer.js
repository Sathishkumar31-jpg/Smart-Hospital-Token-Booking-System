// src/utils/symptomAnalyzer.js

export function analyzeSymptoms(text = "") {
  const symptoms = text.toLowerCase();

  // Emergency rules
  if (
    symptoms.includes("chest pain") ||
    symptoms.includes("left arm pain") ||
    symptoms.includes("heart pain")
  ) {
    return {
      doctor: "Cardiologist",
      isEmergency: true,
      priorityLevel: "E1"
    };
  }

  if (
    symptoms.includes("severe headache") &&
    symptoms.includes("vomiting")
  ) {
    return {
      doctor: "Neurologist",
      isEmergency: true,
      priorityLevel: "E1"
    };
  }

  if (symptoms.includes("breath") || symptoms.includes("severe cough")) {
    return {
      doctor: "Pulmonologist",
      isEmergency: false,
      priorityLevel: "OPD-HIGH"
    };
  }

  if (symptoms.includes("ear pain") || symptoms.includes("hearing")) {
    return {
      doctor: "ENT",
      isEmergency: false,
      priorityLevel: "OPD"
    };
  }

  if (symptoms.includes("joint") || symptoms.includes("swelling")) {
    return {
      doctor: "Orthopedic",
      isEmergency: false,
      priorityLevel: "OPD"
    };
  }

  return {
    doctor: "General Physician",
    isEmergency: false,
    priorityLevel: "OPD"
  };
}
