import { useEffect, useState } from "react";
import SkeletonCanvas from "../components/SkeletonCanvas";
import MetricsPanel from "../components/MetricsPanel";

export default function Training() {
  const [techniques, setTechniques] = useState([]);
  const [selectedTechnique, setSelectedTechnique] = useState(null);
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const [accuracy, setAccuracy] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [kneeAngle, setKneeAngle] = useState(0);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/techniques")
      .then(res => res.json())
      .then(data => {
        setTechniques(data);
        if (data.length > 0)
          setSelectedTechnique(data[0].id);
      });
  }, []);

  useEffect(() => {
    if (!selectedTechnique) return;

    fetch(
      `http://127.0.0.1:8000/techniques/${selectedTechnique}/steps`
    )
      .then(res => res.json())
      .then(data => {
        setSteps(data);
        setCurrentStepIndex(0);
      });
  }, [selectedTechnique]);

  return (
    <div>

      {/* Feedback Bar */}
      <div style={{
        background: "#111",
        color: "white",
        padding: "10px",
        textAlign: "center"
      }}>
        {feedback}
      </div>

      {/* Technique Selector */}
      <div style={{ textAlign: "center", margin: "10px" }}>
        <select
          onChange={(e) =>
            setSelectedTechnique(Number(e.target.value))
          }
        >
          {techniques.map(t => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex" }}>
        <SkeletonCanvas
          currentStepId={steps[currentStepIndex]?.id}
          onAngleUpdate={(angle) => setKneeAngle(angle)}
        />

        <MetricsPanel
          steps={steps}
          currentStepIndex={currentStepIndex}
          accuracy={accuracy}
          kneeAngle={kneeAngle}
          feedback={feedback}
        />
      </div>
    </div>
  );
}