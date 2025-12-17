import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ShapeType, HandInteraction, GestureMode } from '../types';
import { generateParticles } from '../utils/geometry';

interface ParticlesProps {
  shape: ShapeType;
  color: string;
  interactionRef: React.MutableRefObject<HandInteraction>;
}

const COUNT = 8000;

const Particles: React.FC<ParticlesProps> = ({ shape, color, interactionRef }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  // Store target positions for the current shape
  const targetPositions = useMemo(() => generateParticles(shape, COUNT), [shape]);
  
  // Current positions buffer
  const currentPositions = useMemo(() => new Float32Array(COUNT * 3), []);
  
  // Internal physics state for smoothing
  const currentZoomFactor = useRef(0);
  const targetRotation = useRef(new THREE.Quaternion());
  
  // Initialize current positions
  useEffect(() => {
    for (let i = 0; i < targetPositions.length; i++) {
      currentPositions[i] = targetPositions[i];
    }
    if (pointsRef.current) {
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
    // Reset rotation on shape change? Optional.
    if (groupRef.current) {
      targetRotation.current.copy(groupRef.current.quaternion);
    }
  }, [targetPositions, currentPositions]);

  useFrame((state) => {
    if (!pointsRef.current || !groupRef.current) return;

    const { active, mode, zoomFactor, rotationDelta, rollAngle } = interactionRef.current;
    const time = state.clock.getElapsedTime();
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;

    // --- GROUP TRANSFORMATIONS (Rotation/Roll) ---
    
    if (active && mode === GestureMode.ROTATE) {
       // Apply delta rotation to the group
       // We rotate around world axes
       const qx = new THREE.Quaternion();
       qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotationDelta.x);
       const qy = new THREE.Quaternion();
       qy.setFromAxisAngle(new THREE.Vector3(1, 0, 0), rotationDelta.y);
       
       targetRotation.current.multiplyQuaternions(qx, targetRotation.current);
       targetRotation.current.multiplyQuaternions(qy, targetRotation.current); // Apply both
    } else if (active && mode === GestureMode.ROLL) {
       // Set Z rotation directly based on finger angle
       const qz = new THREE.Quaternion();
       // Add offset so vertical fingers = upright
       const angle = rollAngle + Math.PI / 2; 
       qz.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -angle); // Negative to match visual roll
       
       // Slerp towards this Z orientation while keeping existing XY orientation? 
       // For simplicity in Roll Mode, we primarily affect Z, but let's just rotate the whole group Z.
       // A cleaner way for "Planar Flip" is to rotate the group relative to the camera view.
       groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, -angle, 0.1);
    } else {
       // Idle Auto Rotate
       const autoRot = new THREE.Quaternion();
       autoRot.setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.002);
       targetRotation.current.multiply(autoRot);
    }

    // Smoothly interpolate group rotation (except roll which is handled directly above for 1:1 feel)
    if (mode !== GestureMode.ROLL) {
        groupRef.current.quaternion.slerp(targetRotation.current, 0.1);
    }


    // --- PARTICLE DYNAMICS (Zoom/Diffusion) ---

    // Smooth the zoom factor
    const targetZoom = (active && mode === GestureMode.ZOOM) ? zoomFactor : 0;
    currentZoomFactor.current = THREE.MathUtils.lerp(currentZoomFactor.current, targetZoom, 0.1);
    
    const explosion = currentZoomFactor.current;

    for (let i = 0; i < COUNT; i++) {
      const idx = i * 3;
      
      const tx = targetPositions[idx];
      const ty = targetPositions[idx + 1];
      const tz = targetPositions[idx + 2];

      // "Breathing" animation
      const floatX = Math.sin(time * 0.5 + ty) * 0.05;
      const floatY = Math.cos(time * 0.3 + tx) * 0.05;
      
      // Burst / Expansion Logic
      // When fist is closed (0), particles are tight. When open (1), they fly out.
      // Logic: 0 -> normal shape. 1 -> Expanded.
      
      // Calculate expansion direction (normalized vector from center)
      const dist = Math.sqrt(tx*tx + ty*ty + tz*tz) + 0.001;
      const nx = tx / dist;
      const ny = ty / dist;
      const nz = tz / dist;

      const ex = tx + nx * (explosion * 5); 
      const ey = ty + ny * (explosion * 5);
      const ez = tz + nz * (explosion * 5);

      // Noise
      const noise = explosion * 0.5; 
      const rx = (Math.random() - 0.5) * noise;
      const ry = (Math.random() - 0.5) * noise;
      const rz = (Math.random() - 0.5) * noise;

      positions[idx] += (ex + floatX + rx - positions[idx]) * 0.1;
      positions[idx + 1] += (ey + floatY + ry - positions[idx + 1]) * 0.1;
      positions[idx + 2] += (ez + rz - positions[idx + 2]) * 0.1;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    
    // Dynamic Color Burst
    if (pointsRef.current.material instanceof THREE.PointsMaterial) {
       // Pulse size slightly
       pointsRef.current.material.size = 0.035 + explosion * 0.02;
       
       // Shift color towards white on burst
       const baseColor = new THREE.Color(color);
       const burstColor = new THREE.Color('#ffffff');
       pointsRef.current.material.color.lerpColors(baseColor, burstColor, explosion * 0.5);
    }
  });

  return (
    <group ref={groupRef}>
        <points ref={pointsRef}>
        <bufferGeometry>
            <bufferAttribute
            attach="attributes-position"
            count={COUNT}
            array={currentPositions}
            itemSize={3}
            />
        </bufferGeometry>
        <pointsMaterial
            size={0.035}
            color={color}
            transparent
            opacity={0.8}
            sizeAttenuation
            blending={THREE.AdditiveBlending}
            depthWrite={false}
        />
        </points>
    </group>
  );
};

export default Particles;