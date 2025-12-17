import React, { useState, useRef, useCallback } from 'react';
import Scene from './components/Scene';
import UI from './components/UI';
import HandController from './components/HandController';
import { ShapeType, GestureMode, HandInteraction } from './types';

const App: React.FC = () => {
  const [shape, setShape] = useState<ShapeType>(ShapeType.HEART);
  const [color, setColor] = useState<string>('#ff4d4d');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // UI State (throttled updates)
  const [uiState, setUiState] = useState<{ active: boolean; mode: GestureMode; factor: number }>({
    active: false,
    mode: GestureMode.IDLE,
    factor: 0
  });

  // We use a ref for the interaction data to avoid re-rendering the Canvas on every frame update
  const interactionRef = useRef<HandInteraction>({
    active: false,
    mode: GestureMode.IDLE,
    zoomFactor: 0,
    rotationDelta: { x: 0, y: 0 },
    rollAngle: 0
  });

  const handleHandUpdate = useCallback((data: HandInteraction) => {
    // Update the ref for the 3D scene (high frequency)
    interactionRef.current = data;
    
    // Update state occasionally for UI feedback (comparisons prevent unnecessary renders)
    setUiState(prev => {
      if (prev.active !== data.active || prev.mode !== data.mode || Math.abs(prev.factor - data.zoomFactor) > 0.1) {
        return { active: data.active, mode: data.mode, factor: data.zoomFactor };
      }
      return prev;
    });
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div className="relative w-full h-full bg-black">
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Scene 
          shape={shape} 
          color={color} 
          interactionRef={interactionRef}
        />
      </div>

      {/* UI Overlay Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none">
         <UI
            currentShape={shape}
            onShapeChange={setShape}
            color={color}
            onColorChange={setColor}
            isFullscreen={isFullscreen}
            toggleFullscreen={toggleFullscreen}
            handActive={uiState.active}
            mode={uiState.mode}
            factor={uiState.factor}
         />
      </div>

      {/* Webcam / Logic Layer */}
      <HandController onUpdate={handleHandUpdate} />
    </div>
  );
};

export default App;