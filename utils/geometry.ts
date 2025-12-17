import * as THREE from 'three';
import { ShapeType } from '../types';

export const generateParticles = (shape: ShapeType, count: number): Float32Array => {
  const positions = new Float32Array(count * 3);
  const tempVec = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    let x = 0, y = 0, z = 0;
    const idx = i * 3;

    switch (shape) {
      case ShapeType.HEART: {
        // Parametric Heart
        const t = Math.random() * Math.PI * 2;
        const u = Math.random() * Math.PI;
        // Basic 3D heart approximation
        x = 16 * Math.pow(Math.sin(t), 3);
        y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        z = 4 * Math.sin(t) * Math.cos(u) * 2; // Add thickness
        
        // Scale down
        x *= 0.1; y *= 0.1; z *= 0.1;
        break;
      }
      
      case ShapeType.FLOWER: {
        // Rose curve / Polar flower
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const r = 2 + Math.sin(5 * theta); // 5 petals
        
        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.cos(phi);
        z = r * Math.sin(phi) * Math.sin(theta);
        
        // Flatten slightly to look like a flower head
        y *= 0.3;
        break;
      }

      case ShapeType.SATURN: {
        // Sphere + Ring
        const isRing = Math.random() > 0.6;
        if (isRing) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 3 + Math.random() * 1.5;
          x = Math.cos(angle) * dist;
          z = Math.sin(angle) * dist;
          y = (Math.random() - 0.5) * 0.1;
        } else {
          // Planet body
          const u = Math.random();
          const v = Math.random();
          const theta = 2 * Math.PI * u;
          const phi = Math.acos(2 * v - 1);
          const r = 1.5;
          x = r * Math.sin(phi) * Math.cos(theta);
          y = r * Math.sin(phi) * Math.sin(theta);
          z = r * Math.cos(phi);
        }
        
        // Tilt Saturn
        const euler = new THREE.Euler(0.4, 0, 0.4);
        tempVec.set(x, y, z).applyEuler(euler);
        x = tempVec.x; y = tempVec.y; z = tempVec.z;
        break;
      }

      case ShapeType.ZEN: {
        // Torus Knot (Standard generic complex shape)
        const u = Math.random() * Math.PI * 2 * 3; // multiple loops
        const tube = 0.6;
        const p = 2;
        const q = 3;
        const r = 2 + Math.cos(q * u / p);
        
        x = r * Math.cos(u);
        y = r * Math.sin(u);
        z = Math.sin(q * u / p);
        
        // Add volume
        x += (Math.random() - 0.5) * tube;
        y += (Math.random() - 0.5) * tube;
        z += (Math.random() - 0.5) * tube;
        break;
      }

      case ShapeType.FIREWORKS: {
        // Sphere burst initial state
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const r = Math.random() * 4; // Solid ball but varying density
        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.sin(phi) * Math.sin(theta);
        z = r * Math.cos(phi);
        break;
      }
    }

    positions[idx] = x;
    positions[idx + 1] = y;
    positions[idx + 2] = z;
  }

  return positions;
};