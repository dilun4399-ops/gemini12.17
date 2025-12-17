import React from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Stars } from '@react-three/drei';
import Particles from './Particles';
import { ShapeType, HandInteraction } from '../types';
import * as THREE from 'three';

interface SceneProps {
  shape: ShapeType;
  color: string;
  interactionRef: React.MutableRefObject<HandInteraction>;
}

const Rig = () => {
    useFrame((state) => {
        // Subtle mouse parallax
        state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, 1 + state.mouse.x / 2, 0.05);
        state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, 1 + state.mouse.y / 2, 0.05);
        state.camera.lookAt(0, 0, 0);
    });
    return null;
}

const Scene: React.FC<SceneProps> = ({ shape, color, interactionRef }) => {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 60 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={['#050505']} />
      <fog attach="fog" args={['#050505', 5, 15]} />
      
      <Rig />
      {/* Disable OrbitControls interaction if we want full hand control, or keep it as fallback */}
      <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={0.5} autoRotate={false} />
      
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      
      <Particles shape={shape} color={color} interactionRef={interactionRef} />
      
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Environment preset="city" />
    </Canvas>
  );
};

export default Scene;