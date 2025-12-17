export enum ShapeType {
  HEART = 'Heart',
  FLOWER = 'Flower',
  SATURN = 'Saturn',
  ZEN = 'Zen',
  FIREWORKS = 'Fireworks'
}

export enum GestureMode {
  IDLE = 'IDLE',
  ZOOM = 'ZOOM',       // 5 Fingers / Fist
  ROTATE = 'ROTATE',   // Index Finger
  ROLL = 'ROLL'        // Index + Middle (Victory)
}

export interface HandInteraction {
  active: boolean;
  mode: GestureMode;
  zoomFactor: number; // 0 (closed) to 1 (open)
  rotationDelta: { x: number; y: number }; // For XY Orbit
  rollAngle: number; // For Z rotation
}

export interface ParticleState {
  shape: ShapeType;
  color: string;
  particleCount: number;
}
