import React, { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver, NormalizedLandmark } from '@mediapipe/tasks-vision';
import { GestureMode, HandInteraction } from '../types';

interface HandControllerProps {
  onUpdate: (data: HandInteraction) => void;
}

const HandController: React.FC<HandControllerProps> = ({ onUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const lastVideoTime = useRef(-1);
  const requestRef = useRef<number>();
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  
  // State tracking for smooth movement
  const prevIndexPos = useRef<{x: number, y: number} | null>(null);

  useEffect(() => {
    let active = true;

    const setupMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        if (!active) return;

        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1 // Single hand control is cleaner for state machine
        });

        startCamera();
      } catch (error) {
        console.error("Error initializing MediaPipe:", error);
        setLoading(false);
      }
    };

    setupMediaPipe();

    return () => {
      active = false;
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const startCamera = async () => {
    if (!videoRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" }
      });
      videoRef.current.srcObject = stream;
      videoRef.current.addEventListener('loadeddata', predict);
      setLoading(false);
    } catch (err) {
      console.error("Camera access denied:", err);
      setLoading(false);
    }
  };

  const isFingerExtended = (landmarks: NormalizedLandmark[], tipIdx: number, pipIdx: number) => {
    // Simple check: Tip is higher (smaller y) than PIP joint? 
    // Better: Distance from wrist (0) to tip > distance from wrist to PIP
    const wrist = landmarks[0];
    const tip = landmarks[tipIdx];
    const pip = landmarks[pipIdx];
    
    const distTip = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
    const distPip = Math.hypot(pip.x - wrist.x, pip.y - wrist.y);
    
    return distTip > distPip;
  };

  const predict = () => {
    if (!videoRef.current || !handLandmarkerRef.current) return;
    
    const nowInMs = Date.now();
    if (videoRef.current.currentTime !== lastVideoTime.current) {
      lastVideoTime.current = videoRef.current.currentTime;
      
      const results = handLandmarkerRef.current.detectForVideo(videoRef.current, nowInMs);
      
      let interactionData: HandInteraction = {
        active: false,
        mode: GestureMode.IDLE,
        zoomFactor: 0,
        rotationDelta: { x: 0, y: 0 },
        rollAngle: 0
      };

      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        interactionData.active = true;

        // Check fingers extended
        const indexExt = isFingerExtended(landmarks, 8, 6);
        const middleExt = isFingerExtended(landmarks, 12, 10);
        const ringExt = isFingerExtended(landmarks, 16, 14);
        const pinkyExt = isFingerExtended(landmarks, 20, 18);
        // Thumb is tricky, use simple x/y comparison relative to index knuckle (5)
        const thumbTip = landmarks[4];
        const indexMCP = landmarks[5];
        const thumbExt = Math.hypot(thumbTip.x - indexMCP.x, thumbTip.y - indexMCP.y) > 0.1;

        const extendedCount = [thumbExt, indexExt, middleExt, ringExt, pinkyExt].filter(Boolean).length;

        // --- STATE MACHINE ---

        // 1. ROLL MODE: Victory Sign (Index + Middle extended only)
        if (indexExt && middleExt && !ringExt && !pinkyExt) {
          interactionData.mode = GestureMode.ROLL;
          
          const iTip = landmarks[8];
          const mTip = landmarks[12];
          
          // Calculate angle
          const dx = mTip.x - iTip.x;
          const dy = mTip.y - iTip.y; 
          // Atan2 returns angle in radians. 
          // We normalize this so vertical is 0.
          interactionData.rollAngle = Math.atan2(dy, dx);
          
          prevIndexPos.current = null; // Reset rotation tracking
        }
        
        // 2. ROTATE MODE: Index Finger Only
        else if (indexExt && !middleExt && !ringExt && !pinkyExt) {
          interactionData.mode = GestureMode.ROTATE;
          
          const currentPos = { x: landmarks[8].x, y: landmarks[8].y };
          
          if (prevIndexPos.current) {
            // Calculate Delta
            // X movement rotates Scene Y
            // Y movement rotates Scene X
            interactionData.rotationDelta = {
              x: (currentPos.x - prevIndexPos.current.x) * 5, // Sensitivity multiplier
              y: (currentPos.y - prevIndexPos.current.y) * 5
            };
          }
          prevIndexPos.current = currentPos;
        }

        // 3. ZOOM / BURST MODE: Open Hand (>=4 fingers) or Fist (0-1 fingers)
        else {
          interactionData.mode = GestureMode.ZOOM;
          prevIndexPos.current = null;

          if (extendedCount >= 4) {
             // Fully Open
             interactionData.zoomFactor = 1;
          } else if (extendedCount <= 1) {
             // Fist
             interactionData.zoomFactor = 0;
          } else {
             // Transitioning... calculate average extension of fingers
             // Simple approximation
             interactionData.zoomFactor = extendedCount / 5;
          }
        }
      } else {
        prevIndexPos.current = null;
      }

      onUpdate(interactionData);
    }

    requestRef.current = requestAnimationFrame(predict);
  };

  return (
    <div className="absolute bottom-4 right-4 z-50 overflow-hidden rounded-lg border border-white/20 shadow-lg w-32 h-24 bg-black/50 backdrop-blur-md">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-white/70">
          Loading AI...
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full h-full object-cover transform -scale-x-100 opacity-80 hover:opacity-100 transition-opacity"
        autoPlay
        playsInline
        muted
      />
      <div className="absolute bottom-1 left-2 text-[10px] text-white/80 font-mono pointer-events-none">
        HAND TRACKING
      </div>
    </div>
  );
};

export default HandController;