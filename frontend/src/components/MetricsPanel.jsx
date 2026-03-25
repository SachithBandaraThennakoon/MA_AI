export default function MetricsPanel({
  steps,
  currentStepIndex,
  accuracy,
  angles,
  requiredParts,
  feedback
}) {
  const currentStep = steps[currentStepIndex];

  return (
    <div style={{
      width: "30%",
      background: "#475561",
      padding: "20px",
      color: "white"
    }}>
      <h2>Performance</h2>

      <h1>{accuracy}%</h1>
      <p>Accuracy</p>

      <hr />

      <h3>Current Step</h3>
      <p>{currentStep?.step_name}</p>

      <hr />

      <h3>Angles</h3>

      {requiredParts.length === 0 && <p>No angle data</p>}

      {requiredParts.map((part, index) => {
        const value = angles?.[part.body_part];

        const isCorrect =
          value >= part.min && value <= part.max;

        return (
          <div
            key={index}
            style={{
              marginBottom: "10px",
              padding: "8px",
              background: isCorrect ? "#2e7d32" : "#8b0000"
            }}
          >
            <strong>{part.body_part}</strong>

            <br />

            Value: {value ? Math.round(value) : 0}°

            <br />

            Target: {part.min}° - {part.max}°

            <br />

            Status: {isCorrect ? "✅ Good" : "❌ Adjust"}
          </div>
        );
      })}

      <hr />

      <h3>Steps</h3>

      {steps.map((step, index) => (
        <div
          key={step.id}
          style={{
            padding: "8px",
            margin: "5px",
            background:
              index === currentStepIndex
                ? "#4CAF50"
                : "#3f3737"
          }}
        >
          {step.step_name}
        </div>
      ))}

      <hr />

      <h4>Feedback</h4>
      <p>{feedback}</p>
    </div>
  );
}