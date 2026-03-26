import { useEffect, useRef } from "react";
import {
  PoseLandmarker,
  HandLandmarker,
  FilesetResolver
} from "@mediapipe/tasks-vision";

import { drawSkeleton } from "../utils/drawSkeleton";

// BODY PART MAP
const BODY_PART_MAP = {
  knee_right: [24, 26, 28],
  knee_left: [23, 25, 27],
  elbow_right: [12, 14, 16],
  elbow_left: [11, 13, 15],
  shoulder_right: [14, 12, 24],
  shoulder_left: [13, 11, 23]
};

function calculateAngle(a, b, c) {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) -
    Math.atan2(a.y - b.y, a.x - b.x);

  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180) angle = 360 - angle;

  return angle;
}

export default function SkeletonCanvas({
  currentStepId,
  requiredParts,
  onAngleUpdate,
  onAccuracyUpdate,
  onFeedbackUpdate
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const poseRef = useRef(null);
  const handRef = useRef(null);
  const wsRef = useRef(null);

  const previousPoseRef = useRef(null);
  const previousHandsRef = useRef(null);
  const lastFrameTimeRef = useRef(0);

  const SMOOTHING = 0.6;
  const FPS_LIMIT = 25;

  // 🔥 THIS IS WHERE YOUR CODE GOES
  useEffect(() => {
    let animationFrameId;

    const init = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      poseRef.current = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task"
        },
        runningMode: "VIDEO",
        numPoses: 1
      });

      handRef.current = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task"
        },
        runningMode: "VIDEO",
        numHands: 2
      });

      const token = localStorage.getItem("token");

      wsRef.current = new WebSocket(
        `ws://127.0.0.1:8000/ws/train?token=${token}`
      );

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        onAccuracyUpdate(data.accuracy);
        onFeedbackUpdate(data.feedback.join(", "));
      };

      startCamera();
    };

    const startCamera = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 640, height: 480 }
  });

  videoRef.current.srcObject = stream;

  await new Promise((resolve) => {
    videoRef.current.onloadedmetadata = () => {
      resolve();
    };
  });

  await videoRef.current.play();

  // ✅ NOW SAFE
  canvasRef.current.width = videoRef.current.videoWidth;
  canvasRef.current.height = videoRef.current.videoHeight;

  detect();
};

    const smoothLandmarks = (current, previous) => {
      if (!previous) return current;

      return current.map((point, i) => ({
        x: previous[i].x * (1 - SMOOTHING) + point.x * SMOOTHING,
        y: previous[i].y * (1 - SMOOTHING) + point.y * SMOOTHING,
        z: previous[i].z * (1 - SMOOTHING) + point.z * SMOOTHING
      }));
    };

    const detect = () => {
      const now = performance.now();

      if (
  !videoRef.current ||
  videoRef.current.videoWidth === 0 ||
  videoRef.current.videoHeight === 0
) {
  animationFrameId = requestAnimationFrame(detect);
  return;
}

      if (now - lastFrameTimeRef.current < 1000 / FPS_LIMIT) {
        animationFrameId = requestAnimationFrame(detect);
        return;
      }

      lastFrameTimeRef.current = now;

      let poseLandmarks = null;
      let handLandmarksList = null;

      if (poseRef.current) {
        
        const result = poseRef.current.detectForVideo(videoRef.current, now);

        if (result.landmarks.length > 0) {
          poseLandmarks = smoothLandmarks(
            result.landmarks[0],
            previousPoseRef.current
          );

          previousPoseRef.current = poseLandmarks;
        }
      }

      if (handRef.current && Math.random() > 0.6) {
        const result = handRef.current.detectForVideo(videoRef.current, now);

        if (result.landmarks.length > 0) {
          handLandmarksList = result.landmarks.map((hand, index) =>
            smoothLandmarks(
              hand,
              previousHandsRef.current?.[index]
            )
          );

          previousHandsRef.current = handLandmarksList;
        }
      }

      if (poseLandmarks) {
        drawSkeleton(canvasRef.current, poseLandmarks, handLandmarksList);

        let anglesPayload = {};

        requiredParts?.forEach(part => {
          const mapping = BODY_PART_MAP[part.body_part];

          if (mapping) {
            const [a, b, c] = mapping;

            const angle = calculateAngle(
              poseLandmarks[a],
              poseLandmarks[b],
              poseLandmarks[c]
            );

            anglesPayload[part.body_part] = angle;
          }
        });

        onAngleUpdate(anglesPayload);

        if (wsRef.current?.readyState === 1 && currentStepId) {
          wsRef.current.send(
            JSON.stringify({
              step_id: currentStepId,
              angles: anglesPayload
            })
          );
        }
      }

      animationFrameId = requestAnimationFrame(detect);
    };

    init();

    return () => {
      cancelAnimationFrame(animationFrameId);
      wsRef.current?.close();
    };
  }, [currentStepId, requiredParts]);

return (
  <div style={styles.wrapper}>
    
    {/* AI LABEL */}
    <div style={styles.header}>
       AI Pose Tracking
    </div>

    {/* CANVAS CONTAINER */}
    <div style={styles.canvasContainer}>
      <canvas
        ref={canvasRef}
        style={styles.canvas}
      />

      {/* overlay glow */}
      <div style={styles.overlay}></div>
    </div>

    <video ref={videoRef} style={{ display: "none" }} autoPlay muted />
  </div>
);
}


const styles = {
  wrapper: {
    width: "60%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: "radial-gradient(circle, #0a0c10, #000)",
    padding: "15px"
  },

  header: {
    color: "#00ff88",
    fontWeight: "bold",
    marginBottom: "10px",
    letterSpacing: "1px",
    textShadow: "0 0 10px rgba(0,255,136,0.6)"
  },

  canvasContainer: {
    position: "relative",
    width: "100%",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 0 30px rgba(0,255,136,0.15)",
    border: "1px solid rgba(255,255,255,0.05)"
  },

  canvas: {
    width: "100%",
    display: "block",
    background: "#244632"
  },

  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    background: "radial-gradient(circle at center, transparent, rgba(0,0,0,0.6))"
  }
};