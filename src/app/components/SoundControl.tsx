import { useRef, useState, useEffect } from 'react';
import { hapticSounds } from '@/app/hooks/useHapticSound';
import svgPaths from "@/imports/svg-4pi4cjtd6l";

interface SoundControlProps {
  isPlaying: boolean;
  volume: number;
  onVolumeChange: (volume: number) => void;
  onLongPress?: () => void;
  themeMode?: 'light' | 'dark' | 'color';
}

export function SoundControl({
  isPlaying,
  volume,
  onVolumeChange,
  onLongPress,
  themeMode = 'light'
}: SoundControlProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasMoved = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  // Volume arc from 225° (bottom-left) to 315° (bottom-right) - matching Figma
  const startAngle = 225;
  const totalAngle = 90;
  const currentAngle = startAngle + (volume * totalAngle);

  // Volume wheel positioning - outer circle 213px diameter as per Figma
  const volumeWheelRadius = 106.5; // 213 / 2
  const volumeWheelCenterX = volumeWheelRadius; // Center of the wheel
  const volumeWheelCenterY = 36 + volumeWheelRadius; // 36px top offset + radius

  // Calculate dot position on the volume wheel
  const dotAngle = (currentAngle * Math.PI) / 180;
  const dotX = volumeWheelCenterX + volumeWheelRadius * Math.cos(dotAngle);
  const dotY = volumeWheelCenterY + volumeWheelRadius * Math.sin(dotAngle);

  // Create SVG paths for the volume arcs
  const createArcPath = (startDeg: number, endDeg: number) => {
    const cx = 106.5;
    const cy = 106.5;
    const r = 106.5;
    
    const startRad = (startDeg * Math.PI) / 180;
    const endRad = (endDeg * Math.PI) / 180;
    
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  const fullArcPath = createArcPath(225, 315); // Grey outline (full range)
  const volumeArcPath = createArcPath(225, currentAngle); // Black filled arc

  const calculateVolumeFromPoint = (clientX: number, clientY: number): number => {
    if (!containerRef.current) return volume;

    const rect = containerRef.current.getBoundingClientRect();
    const centerXPx = rect.left + volumeWheelCenterX;
    const centerYPx = rect.top + volumeWheelCenterY;

    const dx = clientX - centerXPx;
    const dy = clientY - centerYPx;

    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    if (angle < 0) angle += 360;

    // Convert angle to volume (225° to 315° range)
    if (angle >= 225 && angle <= 315) {
      return (angle - 225) / 90;
    } else if (angle >= 315 || angle < 45) {
      return angle >= 315 ? (angle - 225) / 90 : 1;
    } else if (angle >= 180 && angle < 225) {
      return 0;
    }

    return angle < 180 ? 1 : 0;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    hasMoved.current = false;
    startPos.current = { x: e.clientX, y: e.clientY };

    // Check if click is on the knob
    // Knob is centered at approximately left: 23px + 64px = 87px, top: 54px + 29px + 63.5px = 146.5px
    const knobCenterX = rect.left + 23 + 64;
    const knobCenterY = rect.top + 54 + 29 + 63.5;
    const dxKnob = e.clientX - knobCenterX;
    const dyKnob = e.clientY - knobCenterY;
    const distanceToKnob = Math.sqrt(dxKnob * dxKnob + dyKnob * dyKnob);

    if (distanceToKnob <= 64) {
      // Click on knob - start long press timer
      if (onLongPress) {
        longPressTimerRef.current = setTimeout(() => {
          if (!hasMoved.current) {
            onLongPress();
          }
        }, 600);
      }
      return;
    }

    // Click on volume ring
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    hapticSounds.resetVolumeTick();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    
    const newVolume = calculateVolumeFromPoint(e.clientX, e.clientY);
    hapticSounds.volumeTick(newVolume);
    onVolumeChange(Math.max(0, Math.min(1, newVolume)));
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 5) {
      hasMoved.current = true;
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }

    if (!isDragging) return;

    e.preventDefault();
    const newVolume = calculateVolumeFromPoint(e.clientX, e.clientY);
    hapticSounds.volumeTick(newVolume);
    onVolumeChange(Math.max(0, Math.min(1, newVolume)));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      hapticSounds.resetVolumeTick();
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
  };


  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-[213px] h-[249px]"
      data-name="Audio"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ touchAction: 'none' }}
    >
      {/* Volume Outline - OUTER CIRCLE - positioned at top: 36px */}
      <div className="absolute left-0 size-[213px] top-[36px]" data-name="Volume Outline">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 213 213">
          {/* Grey outline arc (full range) */}
          <path 
            d={fullArcPath}
            fill="none" 
            stroke={themeMode === 'light' ? "#B5B5B5" : "rgba(255, 255, 255, 0.2)"}
            strokeWidth="2"
            strokeDasharray="1 16"
            className="transition-all duration-500"
          />
          {/* Black filled arc (current volume) */}
          <path 
            d={volumeArcPath}
            fill="none" 
            stroke={themeMode === 'light' ? "black" : "rgba(255, 255, 255, 0.4)"}
            strokeWidth="2"
            strokeDasharray="1 16"
            className="transition-all duration-500"
          />
        </svg>
        
        {/* Volume position dot */}
        <div
          className={`absolute w-[6px] h-[6px] rounded-full pointer-events-none transition-colors duration-500 ${
            themeMode === 'light' ? 'bg-black' : 'bg-white/60'
          }`}
          style={{
            left: `${dotX}px`,
            top: `${dotY - 36}px`,
            transform: 'translate(-50%, -50%)',
            transition: isDragging ? 'none' : 'left 0.2s ease, top 0.2s ease',
          }}
        />
      </div>

      {/* Audio Component - INNER KNOB AND BACKGROUND */}
      <div className="absolute h-[179px] left-[23px] top-[54px] w-[174px]" data-name="Audio">
        {/* Background ellipse with gradient and inner shadow */}
        <div className="absolute h-[180px] left-0 top-[2px] w-[174px]">
          <div className="absolute inset-[-0.56%_-0.57%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 176 182">
              <g id="Ellipse 52">
                <g filter="url(#filter0_ii_sound_control)">
                  <ellipse 
                    cx="88" 
                    cy="91" 
                    fill={themeMode === 'light' ? "url(#paint0_linear_sound_control)" : "url(#paint0_linear_sound_control_dark)"}
                    fillOpacity="0.4" 
                    rx="87" 
                    ry="90" 
                  />
                </g>
                <path d={svgPaths.p5f01380} stroke="url(#paint1_linear_sound_control)" strokeOpacity="0.6" />
              </g>
              <defs>
                <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="184" id="filter0_ii_sound_control" width="176" x="0" y="0">
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                  <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                  <feMorphology in="SourceAlpha" operator="erode" radius="1" result="effect1_innerShadow" />
                  <feOffset dy="2" />
                  <feGaussianBlur stdDeviation="1" />
                  <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
                  <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0" />
                  <feBlend in2="shape" mode="normal" result="effect1_innerShadow" />
                  <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                  <feOffset dy="2" />
                  <feGaussianBlur stdDeviation="0.5" />
                  <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
                  <feColorMatrix type="matrix" values="0 0 0 0 0.929167 0 0 0 0 0.937667 0 0 0 0 1 0 0 0 0.8 0" />
                  <feBlend in2="effect1_innerShadow" mode="normal" result="effect2_innerShadow" />
                </filter>
                <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_sound_control" x1="88" x2="88" y1="1" y2="181">
                  <stop stopColor="#CECECE" />
                  <stop offset="1" stopColor="#EFEFEF" />
                </linearGradient>
                <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_sound_control_dark" x1="88" x2="88" y1="1" y2="181">
                  <stop stopColor="#404040" />
                  <stop offset="1" stopColor="#2a2a2a" />
                </linearGradient>
                <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_sound_control" x1="29.8765" x2="151.784" y1="22.311" y2="153.766">
                  <stop stopColor="white" />
                  <stop offset="1" stopColor="#BDBDBD" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Empty Button - Placeholder for future functionality */}
        <div 
          className={`absolute h-[127px] left-[23px] rounded-[88px] top-[29.01px] w-[128px] z-10 transition-colors duration-500 ${
            themeMode === 'light' ? 'bg-white' : 'bg-[#3a3a3a]'
          }`}
          data-name="EmptyButton"
        >
          <div className="content-stretch flex items-center justify-center overflow-clip px-[22px] py-[25px] relative rounded-[inherit] size-full">
            {/* Empty - no icon */}
          </div>
          <div 
            aria-hidden="true" 
            className={`absolute border-2 border-solid inset-0 pointer-events-none rounded-[88px] shadow-[0px_4px_8px_-3px_rgba(0,0,0,0.54),3px_12px_27px_5px_rgba(0,0,0,0.22)] transition-colors duration-500 ${
              themeMode === 'light' ? 'border-white' : 'border-[#4a4a4a]'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
