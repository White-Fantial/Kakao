'use client';

import { useState } from 'react';

const PRESET_COLORS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#ec4899',
  '#f43f5e',
  '#6b7280',
  '#374151',
  '#1f2937',
];

type ColorPaletteInputProps = {
  name: string;
  defaultValue?: string;
  label?: string;
};

export function ColorPaletteInput({ name, defaultValue = '', label }: ColorPaletteInputProps) {
  const [color, setColor] = useState(defaultValue);

  return (
    <div className="space-y-1.5">
      {label ? <p className="text-xs font-medium text-[#555]">{label}</p> : null}
      <div className="flex flex-wrap gap-1">
        {PRESET_COLORS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setColor(preset)}
            className={`h-5 w-5 rounded-full border-2 transition-transform hover:scale-110 ${
              color === preset ? 'border-[#3c1e1e] scale-110' : 'border-transparent'
            }`}
            style={{ backgroundColor: preset }}
            title={preset}
          />
        ))}
        <button
          type="button"
          onClick={() => setColor('')}
          className={`flex h-5 w-5 items-center justify-center rounded-full border-2 bg-white text-[9px] text-[#999] transition-transform hover:scale-110 ${
            color === '' ? 'border-[#3c1e1e]' : 'border-[#e8e8e8]'
          }`}
          title="색상 없음"
        >
          ✕
        </button>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={color || '#ffffff'}
          onChange={(e) => setColor(e.target.value)}
          className="h-6 w-6 cursor-pointer rounded border border-[#e8e8e8] p-px"
          title="직접 선택"
        />
        {color ? (
          <>
            <span
              className="inline-block h-4 w-4 rounded-full border border-[#e8e8e8]"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-[#666]">{color}</span>
          </>
        ) : (
          <span className="text-xs text-[#aaa]">색상 없음</span>
        )}
      </div>
      <input type="hidden" name={name} value={color} />
    </div>
  );
}
