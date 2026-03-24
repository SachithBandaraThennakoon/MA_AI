import { useEffect, useRef } from "react";
import {
  PoseLandmarker,
  HandLandmarker,
  FilesetResolver
} from "@mediapipe/tasks-vision";

import { drawSkeleton } from "../utils/drawSkeleton";

export default function SkeletonCanvas() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseRef = useRef(null);
  const handRef = useRef(null);

  const previousPoseRef = useRef(null);
  const previousHandsRef = useRef(null);

  const lastFrameTimeRef = useRef(0);

  const SMOOTHING = 0.5;
  const FPS_LIMIT = 30; // 🔥 important

  useEffect(() => {
    let animationFrameId;

    const init = async () => {
      console.log("Loading models...");

      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      // 🔥 Use lite model for speed
      poseRef.current = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task"
        },
        runningMode: "VIDEO",
        numPoses: 1
      });

      // 🔥 OPTIONAL: comment this if slow
      handRef.current = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task"
        },
        runningMode: "VIDEO",
        numHands: 2
      });

      console.log("Models loaded");

      startCamera();
    };

    const startCamera = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480
        }
      });

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      // ✅ FIXED CANVAS SIZE (DO NOT CHANGE EVERY FRAME)
      canvasRef.current.width = 640;
      canvasRef.current.height = 480;

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

      // 🔥 FPS CONTROL
      if (now - lastFrameTimeRef.current < 1000 / FPS_LIMIT) {
        animationFrameId = requestAnimationFrame(detect);
        return;
      }

      lastFrameTimeRef.current = now;

      let poseLandmarks = null;
      let handLandmarksList = null;

      if (poseRef.current) {
        const poseResult = poseRef.current.detectForVideo(
          videoRef.current,
          now
        );

        if (poseResult.landmarks.length > 0) {
          poseLandmarks = poseResult.landmarks[0];

          poseLandmarks = smoothLandmarks(
            poseLandmarks,
            previousPoseRef.current
          );

          previousPoseRef.current = poseLandmarks;
        }
      }

      // 🔥 RUN HANDS LESS FREQUENTLY
      if (handRef.current && Math.random() > 0.5) {
        const handResult = handRef.current.detectForVideo(
          videoRef.current,
          now
        );

        if (handResult.landmarks.length > 0) {
          handLandmarksList = handResult.landmarks.map((hand, index) =>
            smoothLandmarks(
              hand,
              previousHandsRef.current
                ? previousHandsRef.current[index]
                : null
            )
          );

          previousHandsRef.current = handLandmarksList;
        }
      }

      if (poseLandmarks) {
        drawSkeleton(
          canvasRef.current,
          poseLandmarks,
          handLandmarksList
        );
      }

      animationFrameId = requestAnimationFrame(detect);
    };

    init();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div style={{ width: "60%" }}>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "auto",
          background: "#945858" // 🔥 better contrast
        }}
      />
      <video
        ref={videoRef}
        style={{ display: "none" }}
        autoPlay
        muted
      />
    </div>
  );
}