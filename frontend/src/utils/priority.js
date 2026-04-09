// src/utils/priority.js

export function calculatePriority(priorityLevel, waitingMinutes) {
  if (priorityLevel === "E1") {
    return 100 + waitingMinutes;
  }

  if (priorityLevel === "OPD-HIGH") {
    return 50 + waitingMinutes * 2;
  }

  return 30 + waitingMinutes * 2;
}
