import React from 'react';
import { ShapeType, GestureMode } from '../types';
import { Maximize2, Minimize2, Palette, Box, Hand, Move, RotateCcw, Expand } from 'lucide-react';

interface UIProps {
  currentShape: ShapeType;
  onShapeChange: (s: ShapeType) => void;
  color: string;
  onColorChange: (c: string) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  handActive: boolean;
  mode: GestureMode;
  factor: number;
}

const UI: React.FC<UIProps> = ({
  currentShape,
  onShapeChange,
  color,
  onColorChange,
  isFullscreen,
  toggleFullscreen,
  handActive,
  mode,
  factor
}) => {
  
  const colors = ['#ff4d4d', '#4dff88', '#4d94ff', '#ffeb3b', '#e056fd', '#ffffff'];

  const getModeIcon = () => {
    switch(mode) {
        case GestureMode.ROTATE: return <Move size={14} />;
        case GestureMode.ROLL: return <RotateCcw size={14} />;
        case GestureMode.ZOOM: return <Expand size={14} />;
        default: return <Hand size={14} />;
    }
  };

  const getModeText = () => {
      switch(mode) {
        case GestureMode.ROTATE: return 'ROTATION MODE (INDEX)';
        case GestureMode.ROLL: return 'ROLL MODE (V-SIGN)';
        case GestureMode.ZOOM: return 'BURST MODE (OPEN/FIST)';
        default: return 'IDLE';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
      
      {/* Header */}
      <header className="flex justify-between items-start pointer-events-auto">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-tighter">
            ZEN PARTICLES
          </h1>
          <p className="text-xs text-white/50 mt-1 max-w-[200px]">
            Index: Rotate | Victory: Roll | Open/Fist: Zoom
          </p>
        </div>
        
        <button 
          onClick={toggleFullscreen}
          className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all active:scale-95"
        >
          {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>
      </header>

      {/* Status Indicator */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-3">
         <div className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-bold tracking-widest backdrop-blur-md border transition-all duration-300 shadow-xl
            ${handActive 
              ? 'bg-blue-500/20 border-blue-400/50 text-blue-200' 
              : 'bg-zinc-900/60 border-white/10 text-zinc-500'
            }`}>
            {handActive && <span className="animate-pulse w-2 h-2 rounded-full bg-blue-400"></span>}
            {handActive ? getModeText() : 'NO HANDS DETECTED'}
         </div>
         
         {handActive && mode === GestureMode.ZOOM && (
            <div className="w-48 h-1.5 bg-gray-800/50 rounded-full overflow-hidden backdrop-blur">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  style={{ width: `${factor * 100}%` }}
                />
            </div>
         )}
         {handActive && mode !== GestureMode.ZOOM && (
            <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-widest">
               {getModeIcon()}
               <span>Active</span>
            </div>
         )}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 items-end pointer-events-auto">
        
        {/* Shape Selector */}
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl w-64 shadow-2xl">
          <div className="flex items-center gap-2 mb-3 text-white/80">
            <Box size={16} />
            <span className="text-sm font-semibold uppercase tracking-wider">Geometry</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(ShapeType).map((shape) => (
              <button
                key={shape}
                onClick={() => onShapeChange(shape)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 text-left
                  ${currentShape === shape 
                    ? 'bg-white text-black shadow-lg scale-105' 
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
              >
                {shape}
              </button>
            ))}
          </div>
        </div>

        {/* Color Selector */}
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl w-64 shadow-2xl">
           <div className="flex items-center gap-2 mb-3 text-white/80">
            <Palette size={16} />
            <span className="text-sm font-semibold uppercase tracking-wider">Essence</span>
          </div>
          <div className="flex gap-2 justify-between">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => onColorChange(c)}
                className={`w-8 h-8 rounded-full border-2 transition-transform duration-200 ${color === c ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'border-transparent hover:scale-110'}`}
                style={{ backgroundColor: c }}
              />
            ))}
             <div className="relative w-8 h-8">
                <input 
                    type="color" 
                    value={color}
                    onChange={(e) => onColorChange(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/20 flex items-center justify-center text-white/50 text-[10px]">
                    +
                </div>
             </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default UI;