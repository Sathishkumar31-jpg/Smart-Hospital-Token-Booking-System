import React, { useState, useEffect, useRef, useMemo } from "react";
import "./HospitalMap.css";

export default function HospitalMap({ doctorFloor, doctorRoom, doctorName, onClose }) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [waitingConfirm, setWaitingConfirm] = useState(true);
  const [isListening, setIsListening] = useState(false);

  // Calculate dynamic paths based on Doctor's Room (e.g. 101 vs 102)
  const routeData = useMemo(() => {
    const roomNum = parseInt(doctorRoom.replace(/\D/g, '')) || 102;
    const isLeftSide = roomNum % 2 !== 0; // Odd rooms on left, Even on right

    if (isLeftSide) {
      return {
        pathD: "M 230 280 L 230 180 L 60 180 L 60 280 M 60 280 L 60 140 L 80 140 L 80 100",
        roomX: 20, labelX: 45, cx: 80, cy: 100,
        turnText: `Turn left from the elevator towards ${doctorRoom}.`,
        turnVoice: `Exit the elevator and turn left.`
      };
    } else {
      return {
        pathD: "M 230 280 L 230 180 L 60 180 L 60 280 M 60 280 L 60 140 L 220 140 L 220 100",
        roomX: 160, labelX: 185, cx: 220, cy: 100,
        turnText: `Turn right from the elevator towards ${doctorRoom}.`,
        turnVoice: `Exit the elevator and turn right.`
      };
    }
  }, [doctorRoom]);

  const steps = [
    { 
       question: "Are you at the hospital entrance? Say 'Yes' to start.",
       voiceAction: "Walk straight from the entrance towards the main elevator."
    },
    { 
       question: "Have you reached the elevator? Say 'Yes' to continue.",
       voiceAction: `Take the elevator to the ${doctorFloor} floor.` 
    },
    { 
       question: `Have you reached the ${doctorFloor} floor? Say 'Yes' when there.`,
       voiceAction: `${routeData.turnVoice} Walk down the corridor towards ${doctorRoom}.`
    },
    { 
       question: `Have you arrived at ${doctorRoom}? Say 'Yes' if you are there.`,
       voiceAction: `You have successfully arrived at ${doctorRoom}. You are next in line. Please be seated.` 
    }
  ];

  // Primary movement interval
  useEffect(() => {
    if (waitingConfirm || progress >= 100 || currentStep >= 3) return;

    const interval = setInterval(() => {
      setProgress((p) => {
        let nextP = p + 0.5;
        
        // Calculate the specific target for the current step (33.3%, 66.6%, 100%)
        let target = (currentStep + 1) * 33.4; 
        if (target > 100) target = 100;

        if (nextP >= target) {
          clearInterval(interval);
          setWaitingConfirm(true);
          setCurrentStep(currentStep + 1); // Move to next interaction point
          return target > 100 ? 100 : target;
        }
        return nextP;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [waitingConfirm, progress, currentStep]);

  // Voice Interaction Logic
  useEffect(() => {
    if (progress === 0 && currentStep === 0 && !waitingConfirm) {
      speak(steps[0].voiceAction);
    }
  }, []); // Initial load

  // Trigger Questions when path pauses
  useEffect(() => {
    if (waitingConfirm && currentStep < steps.length) {
      const askQuestion = async () => {
        await speakWithPromise(steps[currentStep].question);
        startListening();
      };
      askQuestion();
    }
    // eslint-disable-next-line
  }, [waitingConfirm, currentStep]);

  // Trigger next Voice Action when resuming
  useEffect(() => {
    if (!waitingConfirm && currentStep < 3 && progress < 100) {
      speak(steps[currentStep].voiceAction);
    } else if (!waitingConfirm && currentStep === 3) {
      speak(steps[currentStep].voiceAction);
    }
    // eslint-disable-next-line
  }, [waitingConfirm, currentStep]);

  // Handle Speech Recognition
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      const command = event.results[0][0].transcript.toLowerCase();
      console.log("Patient said:", command);

      if (command.includes('yes') || command.includes('yeah') || command.includes('ok') || command.includes('done') || command.includes('reached') || command.includes('here')) {
        handleConfirm();
      } else {
        speak("I didn't catch that. Please say Yes if you have reached.");
        setTimeout(startListening, 3000);
      }
    };

    recognition.onerror = (e) => {
      console.error(e);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (e) {
      console.log("Mic error", e);
    }
  };

  const speak = (msg) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(msg);
      utterance.rate = 0.95;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const speakWithPromise = (msg) => {
    return new Promise(resolve => {
      if (!("speechSynthesis" in window)) return resolve();
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(msg);
      utterance.rate = 0.95;
      utterance.pitch = 1.1;
      utterance.onend = resolve;
      utterance.onerror = resolve;
      window.speechSynthesis.speak(utterance);
    });
  }

  const handleConfirm = () => {
    window.speechSynthesis.cancel();
    setIsListening(false);
    if (waitingConfirm) {
      setWaitingConfirm(false);
    }
  };

  return (
    <div className="smart-map-overlay" onClick={onClose}>
      <div className="smart-map-container" onClick={(e) => e.stopPropagation()}>
        <button className="close-map-btn" onClick={onClose}>✖</button>

        <div className="map-header">
          <div className="pulse-dot"></div>
          <h2>Live Indoor GPS Tracker</h2>
        </div>

        <div className="svg-map-wrapper">
          <svg viewBox="0 0 300 400" className="indoor-map-svg">
            <defs>
              <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>

            {/* Base Floorplan Mocks */}
            <rect x="10" y="10" width="280" height="380" rx="16" fill="#0f172a" stroke="#1e293b" strokeWidth="3" />

            {/* Rooms */}
            <rect x={routeData.roomX} y="20" width="120" height="80" rx="8" fill="#1e293b" />
            <text x={routeData.labelX} y="65" fill="#64748b" fontSize="14" fontWeight="600">{doctorRoom}</text>

            {/* Elevator */}
            <rect x="20" y="280" width="80" height="80" rx="8" fill="#1e293b" />
            <text x="35" y="325" fill="#38bdf8" fontSize="12" fontWeight="600">Elevator</text>

            {/* Entrance */}
            <rect x="180" y="280" width="100" height="80" rx="8" fill="#1e293b" />
            <text x="195" y="325" fill="#facc15" fontSize="12" fontWeight="600">Entrance</text>

            {/* Background Path */}
            <path
              d={routeData.pathD}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="4 8"
            />

            {/* Active Progress Path */}
            <path
              d={routeData.pathD}
              fill="none"
              stroke="url(#pathGradient)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="600"
              strokeDashoffset={600 - (progress / 100) * 600}
              style={{ transition: "stroke-dashoffset 0.1s linear" }}
            />

            {/* Arrived Dot */}
            {progress >= 100 && (
              <circle cx={routeData.cx} cy={routeData.cy} r="10" fill="#10b981">
                <animate attributeName="r" values="8;14;8" dur="1s" repeatCount="indefinite" />
              </circle>
            )}
        {/* Current Location Highlight */}
        {progress < 100 && waitingConfirm && (
            <circle cx={progress < 30 ? "230" : progress < 60 ? "60" : "60"} cy={progress < 30 ? "280" : progress < 60 ? "280" : "140"} r="8" fill="#38bdf8">
               <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />
            </circle>
        )}
          </svg>
        </div>

        <div className="navigation-status">
          <div className="status-badge">Step {currentStep + 1}</div>
          <h3>{waitingConfirm ? steps[currentStep].question : "Moving to next checkpoint..."}</h3>

          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>

          <p className="dist-text">Distance remaining: <b>{Math.max(0, Math.floor(100 - progress))} meters</b></p>
        </div>

        {waitingConfirm ? (
          <div className="interactive-controls">
            {isListening ? (
              <div className="mic-listening pulse-red">
                🎙️ Listening for "Yes"...
              </div>
            ) : (
              <div className="mic-off" onClick={startListening}>
                🎙️ Tap to Speak
              </div>
            )}

            <button className="confirm-step-btn" onClick={handleConfirm}>
              Yes, I'm here! ✅
            </button>
          </div>
        ) : (
          <div className="audio-indicator">
            <span className="audio-waves">
              <i></i><i></i><i></i><i></i>
            </span>
            Live Voice Navigation Active
          </div>
        )}

      </div>
    </div>
  );
}
