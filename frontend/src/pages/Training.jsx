import { useEffect, useState } from "react";
import SkeletonCanvas from "../components/SkeletonCanvas";
import MetricsPanel from "../components/MetricsPanel";

export default function Training() {
  const [techniques, setTechniques] = useState([]);
  const [selectedTechnique, setSelectedTechnique] = useState(null);

  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const [requiredParts, setRequiredParts] = useState([]);

  const [angles, setAngles] = useState({});
  const [accuracy, setAccuracy] = useState(0);
  const [feedback, setFeedback] = useState("");

  const sendToCoach = async () => {
  const res = await fetch("http://localhost:3001/feedback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      angles: currentAngles,
      step: currentStep
    })
  });

  const data = await res.json();
  speak(data.message);
};

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  speechSynthesis.speak(utterance);
}


  

  // -----------------------------
  // Load techniques
  // -----------------------------
  useEffect(() => {
    fetch("http://127.0.0.1:8000/techniques")
      .then(res => res.json())
      .then(data => {
        setTechniques(data);
        if (data.length > 0) {
          setSelectedTechnique(data[0].id);
        }
      });
  }, []);

  // -----------------------------
  // Load steps
  // -----------------------------
  useEffect(() => {
    if (!selectedTechnique) return;

    fetch(`http://127.0.0.1:8000/techniques/${selectedTechnique}/steps`)
      .then(res => res.json())
      .then(data => {
        setSteps(data);
        setCurrentStepIndex(0);
      });
  }, [selectedTechnique]);

  // -----------------------------
  // Load required angles for step
  // -----------------------------
  useEffect(() => {
    if (!steps[currentStepIndex]) return;

    fetch(
      `http://127.0.0.1:8000/steps/${steps[currentStepIndex].id}/angles`
    )
      .then(res => res.json())
      .then(data => {
        setRequiredParts(data);
      });
  }, [currentStepIndex, steps]);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>

      {/* TOP BAR */}
      <div style={{
        background: "#111",
        color: "white",
        padding: "10px",
        textAlign: "center"
      }}>
        {feedback || "Start Training"}
      </div>

      {/* TECHNIQUE SELECT */}
      <div style={{ textAlign: "center", margin: "10px" }}>
        <select
          onChange={(e) => setSelectedTechnique(Number(e.target.value))}
        >
          {techniques.map(t => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* MAIN LAYOUT */}
      <div style={{ flex: 1, display: "flex" }}>

        {/* 🔥 THIS IS THE IMPORTANT CALL */}
        <SkeletonCanvas
          currentStepId={steps[currentStepIndex]?.id}
          requiredParts={requiredParts}
          onAngleUpdate={setAngles}
          onAccuracyUpdate={setAccuracy}
          onFeedbackUpdate={setFeedback}
        />

        <MetricsPanel
          steps={steps}
          currentStepIndex={currentStepIndex}
          accuracy={accuracy}
          angles={angles}
          requiredParts={requiredParts}
          feedback={feedback}
        />

      </div>
    </div>
  );
}