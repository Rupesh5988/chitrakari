import React from 'react';

const DEFAULT_COLORS = [
  '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
  '#FF0000', '#FF6600', '#FFCC00', '#009900', '#0066FF', '#9900FF',
  '#FF99CC', '#FFCC99', '#FFFF99', '#CCFF99', '#99CCFF', '#CC99FF',
  '#800000', '#804000', '#808000', '#004000', '#000080', '#400040'
];

interface ColorPaletteProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

export function ColorPalette({ selectedColor, onColorSelect }: ColorPaletteProps) {
  return (
    <div className="flex flex-col gap-2 p-2 bg-slate-800 rounded-xl border border-slate-700/50 shadow-xl">
      <div className="grid grid-cols-6 gap-1">
        {DEFAULT_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => onColorSelect(color)}
            className={`w-5 h-5 rounded-md shadow-inner transition-transform hover:scale-110 active:scale-95 ${
              selectedColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110 z-10' : ''
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
      
      <div className="flex items-center gap-2 pt-2 border-t border-slate-700/50">
        <div className="flex-1 text-xs text-slate-400 font-medium">Custom</div>
        <div className="relative w-6 h-6 rounded-md overflow-hidden shadow-inner ring-1 ring-white/10 group cursor-pointer">
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => onColorSelect(e.target.value)}
            className="absolute inset-[-10px] w-[50px] h-[50px] cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
