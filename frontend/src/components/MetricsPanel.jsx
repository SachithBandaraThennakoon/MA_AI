export default function MetricsPanel({
  steps,
  currentStepIndex,
  accuracy,
  kneeAngle,
  feedback
}) {
  return (
    <div style={{
      width: "30%",
      background: "#475561",
      padding: "20px"
    }}>
      <h2>Performance</h2>

      <h1>{accuracy}%</h1>
      <p>Accuracy</p>

      <p>Knee Angle: {Math.round(kneeAngle)}°</p>

      <hr />

      <h3>Current Step</h3>
      <p>{steps[currentStepIndex]?.step_name}</p>

      <hr />

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