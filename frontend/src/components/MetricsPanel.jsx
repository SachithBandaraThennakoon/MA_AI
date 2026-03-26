export default function MetricsPanel({
  steps,
  currentStepIndex,
  accuracy,
  angles,
  requiredParts,
  feedback
}) {
  const currentStep = steps[currentStepIndex];

  // 🔥 Feedback logic
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
    <div style={styles.panel}>

      {/* PERFORMANCE */}
      <div style={styles.accuracyBox}>
        <h2 style={{ marginBottom: "5px" }}>Performance</h2>

        <div style={styles.accuracyCircle}>
          {accuracy}%
        </div>

        <p style={{ color: "#aaa" }}>Accuracy</p>
      </div>

      {/* CURRENT STEP */}
      <div style={styles.section}>
        <h3>Current Step</h3>
        <p style={styles.highlight}>
          {currentStep?.step_name || "—"}
        </p>
      </div>

      {/* ANGLES */}
      <div style={styles.section}>
        <h3>Angles</h3>

        {requiredParts.length === 0 && (
          <p style={{ color: "#777" }}>No angle data</p>
        )}

        {requiredParts.map((part, index) => {
          const rawValue = angles?.[part.body_part];
          const value = rawValue ? Math.round(rawValue) : 0;

          const isCorrect = value >= part.min && value <= part.max;
          const dynamicFeedback = getFeedback(value, part.min, part.max);

          return (
            <div
              key={index}
              style={{
                ...styles.metricBox,
                ...(isCorrect ? styles.good : styles.bad)
              }}
            >
              <strong>{part.body_part}</strong>

              <p>📐 {value}°</p>

              <p style={{ color: "#aaa" }}>
                Target: {part.min}° - {part.max}°
              </p>

              <p>{dynamicFeedback}</p>
            </div>
          );
        })}
      </div>

      {/* STEPS */}
      <div style={styles.section}>
        <h3>Steps</h3>

        {steps.map((step, index) => (
          <div
            key={step.id}
            style={{
              ...styles.stepItem,
              ...(index === currentStepIndex && styles.stepActive)
            }}
          >
            {step.step_name}
          </div>
        ))}
      </div>

      {/* AI FEEDBACK */}
      {feedback && feedback.trim() !== "" ? (
  <ul style={styles.feedbackList}>
    {feedback
      .split("-")
      .filter(item => item.trim() !== "")
      .map((item, index) => (
        <li key={index} style={styles.feedbackItem}>
          {item.trim()}
        </li>
      ))}
  </ul>
) : (
  <p style={{ color: "#777" }}>
    Waiting for AI feedback...
  </p>
)}

    </div>
  );
}

/* =========================
   🎨 STYLES
========================= */
const styles = {
  panel: {
    width: "40%",
    background: "rgba(28, 31, 38, 0.6)",
    backdropFilter: "blur(15px)",
    padding: "20px",
    color: "white",
    borderLeft: "1px solid #222",
    overflowY: "auto"
  },

  accuracyBox: {
    textAlign: "center",
    marginBottom: "20px"
  },

  accuracyCircle: {
    fontSize: "42px",
    fontWeight: "bold",
    color: "#00ff88",
    textShadow: "0 0 12px rgba(0,255,136,0.6)"
  },

  section: {
    marginBottom: "20px"
  },

  highlight: {
    color: "#00ff88",
    fontWeight: "bold"
  },

  metricBox: {
    marginBottom: "10px",
    padding: "12px",
    borderRadius: "10px",
    transition: "0.3s"
  },

  good: {
    background: "rgba(27, 94, 32, 0.6)",
    border: "1px solid #2e7d32"
  },

  bad: {
    background: "rgba(127, 0, 0, 0.6)",
    border: "1px solid #c62828"
  },

  stepItem: {
    padding: "10px",
    margin: "6px 0",
    borderRadius: "8px",
    background: "#2a2d35",
    transition: "0.3s"
  },

  stepActive: {
    background: "#00ff88",
    color: "#000",
    fontWeight: "bold",
    boxShadow: "0 0 10px #00ff88"
  },

  feedbackBox: {
    marginTop: "10px",
    padding: "12px",
    borderRadius: "10px",
    background: "#111",
    border: "1px solid #333",
    minHeight: "60px"
  },

  feedbackList: {
  paddingLeft: "20px",
  margin: 0
},

feedbackItem: {
  marginBottom: "8px",
  lineHeight: "1.5"
},

  feedbackText: {
    color: "#00ff88",
    fontWeight: "500"
  }
};