export default function MetricsPanel({
  steps,
  currentStepIndex,
  accuracy,
  angles,
  requiredParts,
  feedback
}) {
  const currentStep = steps[currentStepIndex];

  // feedback logic
  const getFeedback = (value, min, max) => {
    if (value < min) {
      const diff = min - value;
      if (diff > 40) return "🔼 Extend your arm more";
      return "🔼 Extend slightly more";
    }

    if (value > max) {
      return "🔽 Reduce angle";
    }

    return "✅ Good";
  };

  return (
    <div
      style={{
        width: "30%",
        background: "#1c1f26",
        padding: "20px",
        color: "white",
        borderLeft: "1px solid #222"
      }}
    >
      <h2>Performance</h2>

      <h1 style={{ color: "#00ff88" }}>{accuracy}%</h1>
      <p style={{ color: "#aaa" }}>Accuracy</p>

      <hr />

      <h3>Current Step</h3>
      <p>{currentStep?.step_name}</p>

      <hr />

      <h3>Angles</h3>

      {requiredParts.length === 0 && <p>No angle data</p>}

      {requiredParts.map((part, index) => {
        const rawValue = angles?.[part.body_part];
        const value = rawValue ? Math.round(rawValue) : 0;

        const isCorrect = value >= part.min && value <= part.max;
        const dynamicFeedback = getFeedback(value, part.min, part.max);

        return (
          <div
            key={index}
            style={{
              marginBottom: "12px",
              padding: "12px",
              borderRadius: "8px",
              background: isCorrect
                ? "rgba(27, 94, 32, 0.6)"
                : "rgba(127, 0, 0, 0.6)",
              border: isCorrect
                ? "1px solid #2e7d32"
                : "1px solid #c62828"
            }}
          >
            <strong>{part.body_part}</strong>

            <p>Value: {value}°</p>

            <p>
              Target: {part.min}° - {part.max}°
            </p>

            <p>{dynamicFeedback}</p>
          </div>
        );
      })}

      <hr />

      <h3>Steps</h3>

      {steps.map((step, index) => (
        <div
          key={step.id}
          style={{
            padding: "10px",
            margin: "6px 0",
            borderRadius: "6px",
            background:
              index === currentStepIndex
                ? "#00ff88"
                : "#2a2d35",
            color: index === currentStepIndex ? "black" : "white",
            fontWeight:
              index === currentStepIndex ? "bold" : "normal"
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