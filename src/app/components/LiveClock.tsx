import { useState, useEffect } from 'react';

interface LiveClockProps {
  isTimerActive?: boolean;
  timeRemaining?: number | null;
  draggedMinutes?: number | null;
  themeMode?: 'light' | 'dark' | 'color';
}

// Figma 61-3739 Ticker: Line 6 (hour) 114.9px, Line 5 (minute) 153.9px, strokeWeight 2, black. Clock height 509px.
const HOUR_LENGTH_PCT = (114.9 / 509) * 100;   // ~22.57%
const MINUTE_LENGTH_PCT = (153.9 / 509) * 100; // ~30.24%
const HAND_STROKE_PX = 2;

export function LiveClock({ isTimerActive, timeRemaining, draggedMinutes, themeMode }: LiveClockProps) {
  const [time, setTime] = useState(() => new Date());

  // Update every second to show current time when not in timer mode or dragging
  useEffect(() => {
    if (isTimerActive || draggedMinutes != null) return;
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, [isTimerActive, draggedMinutes]);

  let hourAngle: number;
  let minuteAngle: number;

  if (isTimerActive && timeRemaining != null) {
    const totalSeconds = Math.ceil(timeRemaining / 1000);
    const now = new Date();
    const wallH = now.getHours() % 12;
    const wallM = now.getMinutes();
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    // Keep hour hand pinned to real clock time during focus countdown.
    hourAngle = wallH * 30 + wallM * 0.5 - 90;
    minuteAngle = (minutes * 6) + (seconds * 0.1) - 90;
  } else if (draggedMinutes != null) {
    // Minute hand = focus duration (0–59); hour hand stays on real time so it never leaves the current hour.
    const now = new Date();
    const wallH = now.getHours() % 12;
    const wallM = now.getMinutes();
    hourAngle = wallH * 30 + wallM * 0.5 - 90;
    minuteAngle = draggedMinutes * 6 - 90;
  } else {
    const hours = time.getHours() % 12;
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();
    hourAngle = (hours * 30) + (minutes * 0.5) - 90;
    minuteAngle = (minutes * 6) + (seconds * 0.1) - 90;
  }

  const isDragging = draggedMinutes != null;

  // Figma 61-1208 (watchphases 1–5): Line 5 & 6 solid white; light = black
  const handColor = themeMode === 'dark' || themeMode === 'color' ? 'rgb(255,255,255)' : 'rgb(0,0,0)';

  return (
    <div className="absolute inset-0 z-[2]" aria-hidden>
      {/* Hour hand — Figma 61-3746: 114.9px ≈ 45% radius, strokeWeight 2, black */}
      <div
        className="absolute left-1/2 top-1/2 origin-left -translate-y-1/2"
        style={{
          width: `${HOUR_LENGTH_PCT}%`,
          height: HAND_STROKE_PX,
          transform: `translateX(0) translateY(-50%) rotate(${hourAngle}deg)`,
          transition: isDragging ? 'none' : 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div
          className="h-full w-full rounded-full"
          style={{ background: handColor }}
        />
      </div>
      {/* Minute hand — Figma 61-3745: 153.9px ≈ 60.5% radius, strokeWeight 2, black */}
      <div
        className="absolute left-1/2 top-1/2 origin-left -translate-y-1/2"
        style={{
          width: `${MINUTE_LENGTH_PCT}%`,
          height: HAND_STROKE_PX,
          transform: `translateX(0) translateY(-50%) rotate(${minuteAngle}deg)`,
          transition: isDragging ? 'none' : 'transform 1s linear',
        }}
      >
        <div
          className="h-full w-full rounded-full"
          style={{ background: handColor }}
        />
      </div>
    </div>
  );
}
