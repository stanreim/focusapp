// Home component with 3-mode theme system (light/dark/color)
import { useState, useEffect, useRef } from 'react';
import { User, Music } from 'lucide-react';
import svgPaths from "./svg-e0ybop1bd5";
import { LiveClock } from "@/app/components/LiveClock";
import { TodoList } from "@/app/components/TodoList";
import { AudioPlayerUI } from "@/app/components/AudioPlayerUI";
import { AudioPlayerRef } from "@/app/components/AudioPlayer";
import { Avatar, AvatarImage, AvatarFallback } from "@/app/components/ui/avatar";

function ProfileAvatar({ profileImageUrl, themeMode }: { profileImageUrl?: string | null; themeMode?: 'light' | 'dark' | 'color' }) {
  return (
    <div className="content-stretch flex items-center p-4 sm:p-5 lg:p-6 relative shrink-0 min-w-0 flex-1 max-w-[321px]" data-name="Greeting">
      <Avatar className="size-10 sm:size-12 lg:size-14 rounded-full border-2 border-white/20 shadow-md">
        {profileImageUrl ? (
          <AvatarImage src={profileImageUrl} alt="Profile" className="object-cover" />
        ) : null}
        <AvatarFallback
          className={`rounded-full flex items-center justify-center transition-colors duration-500 ${
            themeMode === 'dark' ? 'bg-[#3a3a3a] text-[#aaa]' : 'bg-[#e0e0e0] text-[#6d6d6d]'
          }`}
        >
          <User className="size-5 sm:size-6 lg:size-7" strokeWidth={1.5} />
        </AvatarFallback>
      </Avatar>
    </div>
  );
}

// Focus toggle — spec: docs/focus-toggle-design.md
function FocusToggle({
  isOn,
  showSelector,
  themeMode,
  timeRemaining,
}: {
  isOn?: boolean;
  showSelector?: boolean;
  themeMode?: 'light' | 'dark' | 'color';
  timeRemaining?: number | null;
}) {
  const minutesRemaining = timeRemaining && timeRemaining > 0
    ? Math.ceil(timeRemaining / 60000)
    : null;
  const isLight = themeMode === 'light' || themeMode === 'color';
  const knobRight = isOn || showSelector;

  return (
    <div
      className={`relative flex h-12 min-w-[98px] items-center overflow-hidden rounded-full p-1 transition-all duration-500 ${
        themeMode === 'dark'
          ? 'bg-white/20 shadow-[inset_0_8px_9px_-7px_rgba(0,0,0,0.08),inset_2px_0_12px_-3px_rgba(0,0,0,0.12)]'
          : 'bg-[#e5e5e5] shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]'
      } hover:opacity-95 active:scale-[0.98] transition-[opacity,transform] duration-200`}
      data-name="Toggle"
    >
      {/* Knob — 40px circle, right when on; dark: white + Figma drop shadow */}
      <div
        className={`absolute top-1 size-10 rounded-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isLight
            ? 'bg-white shadow-[0_2px_6px_-2px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.08)]'
            : 'bg-white shadow-[0_4px_8px_-3px_rgba(0,0,0,0.54)]'
        }`}
        style={{
          left: knobRight ? 'calc(100% - 44px)' : '4px',
        }}
        data-name="Knob"
      />
      <div className="w-[46px] shrink-0" aria-hidden />
      <div className="flex min-w-0 flex-1 items-center gap-2 pr-2">
        <p
          className={`font-['SF_Pro:Medium',sans-serif] font-medium text-[13px] tracking-tight transition-colors duration-500 ${
            isLight ? 'text-[#5a5a5a]' : 'text-[#6d6d6d]'
          }`}
          style={{ fontVariationSettings: "'wdth' 100" }}
        >
          Focus
        </p>
        {isOn && minutesRemaining !== null && (
          <p
            className={`font-['SF_Pro:Medium',sans-serif] font-medium text-[15px] transition-colors duration-500 ${
              isLight ? 'text-[#5a5a5a]' : 'text-[#a0a0a0]'
            }`}
            data-name="Countdown"
          >
            {minutesRemaining}m
          </p>
        )}
      </div>
    </div>
  );
}

// Time selection buttons that roll out left-to-right (Figma 61-5913)
function FocusTimeSelection({
  onSelect,
  themeMode,
  isVisible,
}: {
  onSelect: (minutes: number) => void;
  themeMode?: 'light' | 'dark' | 'color';
  isVisible: boolean;
}) {
  const isLight = themeMode === 'light' || themeMode === 'color';
  const minutes = [15, 30, 45] as const;

  return (
    <div
      className="flex items-center gap-2 overflow-hidden transition-[max-width,opacity] duration-300 ease-out"
      style={{
        maxWidth: isVisible ? 200 : 0,
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
      data-name="FocusTimeSelection"
    >
      {minutes.map((m, i) => (
        <button
          key={m}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(m);
          }}
          className={`flex flex-col items-center justify-center rounded-full border transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 shrink-0 ${
            isLight
              ? 'size-11 border-[#b0b0b0] bg-[#e0e0e0] text-[#1a1a1a] focus-visible:ring-[#888]'
              : 'size-11 border-[#555] bg-[#3a3a3a] text-[#e0e0e0] focus-visible:ring-white/40'
          }`}
          style={{
            animation: isVisible ? `focusRollOut 0.35s ease-out ${i * 0.06}s both` : 'none',
          }}
          data-name={`TimeButton-${m}`}
        >
          <span className="font-['SF_Pro:Medium',sans-serif] text-[13px] font-medium leading-tight">
            {m}
          </span>
          <span className="font-['SF_Pro:Regular',sans-serif] text-[10px] font-normal leading-tight opacity-80">
            min
          </span>
        </button>
      ))}
    </div>
  );
}

function TimerSwitch({
  isTimerActive,
  showTimerSelector,
  themeMode,
  timeRemaining,
  onTimeButtonClick,
}: {
  isTimerActive?: boolean;
  showTimerSelector?: boolean;
  themeMode?: 'light' | 'dark' | 'color';
  timeRemaining?: number | null;
  onTimeButtonClick?: (minutes: number) => void;
}) {
  return (
    <div className="content-stretch flex min-h-[120px] sm:min-h-[168px] lg:min-h-[208px] lg:w-[342px] items-start justify-center gap-2 p-4 sm:p-5 lg:p-6 relative shrink-0 min-w-0 flex-1 max-w-[342px]" data-name="Timer">
      <div className="cursor-pointer shrink-0" data-name="ToggleWrapper">
        <FocusToggle
          isOn={isTimerActive}
          showSelector={showTimerSelector}
          themeMode={themeMode}
          timeRemaining={timeRemaining}
        />
      </div>
      <FocusTimeSelection
        isVisible={!!showTimerSelector && !isTimerActive}
        onSelect={(m) => onTimeButtonClick?.(m)}
        themeMode={themeMode}
      />
    </div>
  );
}

function Push({ themeMode }: { themeMode?: 'light' | 'dark' | 'color' }) {
  // Neomorphic push button with centered inner knob
  return (
    <div 
      className={`overflow-clip relative rounded-[112px] shrink-0 size-[48px] transition-all duration-500 ${
        themeMode === 'dark' ? 'bg-[#272727]' : 'bg-[#dcdcdc]'
      }`}
      data-name="Push"
    >
      {/* Inner white button with elevated shadow */}
      <div 
        className={`-translate-x-1/2 -translate-y-1/2 absolute content-stretch flex items-center justify-center left-1/2 overflow-clip rounded-[88px] size-[44px] top-1/2 border border-solid transition-all duration-500 ${
          themeMode === 'light' 
            ? 'bg-white border-white shadow-[0px_4px_8px_-3px_rgba(0,0,0,0.54),3px_28px_27px_5px_rgba(0,0,0,0.22)]' 
            : themeMode === 'color'
            ? 'bg-[#a079ed] border-[#c4a8ff] shadow-[0px_4px_8px_-3px_rgba(0,0,0,0.54),3px_28px_27px_5px_rgba(0,0,0,0.22)]'
            : 'bg-[#4f4f4f] border-[#6a6a6a] shadow-[0px_4px_8px_-3px_rgba(0,0,0,0.54),3px_28px_27px_5px_rgba(0,0,0,0.22)]'
        }`}
        data-name="Inner"
      >
        {/* Empty center - no icon for theme toggle */}
      </div>
      {/* Inset shadow overlay */}
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_2px_0px_12px_-3px_rgba(0,0,0,0.12),inset_0px_8px_9px_-7px_rgba(0,0,0,0.08)]" />
    </div>
  );
}

function ChangeTheme({ themeMode, onToggle, onOpenWatchfacePicker }: { themeMode?: 'light' | 'dark' | 'color'; onToggle?: () => void; onOpenWatchfacePicker?: () => void }) {
  return (
    <div 
      onClick={onOpenWatchfacePicker ?? onToggle}
      className="cursor-pointer hover:opacity-80 transition-opacity"
      data-name="Change Theme"
    >
      <Push themeMode={themeMode} />
    </div>
  );
}

function ThemeToggle({ themeMode, onToggle, onOpenWatchfacePicker }: { themeMode?: 'light' | 'dark' | 'color'; onToggle?: () => void; onOpenWatchfacePicker?: () => void }) {
  return (
    <div className="content-stretch flex items-start justify-end p-4 sm:p-5 lg:p-6 relative shrink-0 min-w-0 flex-1 max-w-[321px]" data-name="Toggle">
      <ChangeTheme themeMode={themeMode} onToggle={onToggle} onOpenWatchfacePicker={onOpenWatchfacePicker} />
    </div>
  );
}

function Top({
  isTimerActive,
  showTimerSelector,
  themeMode,
  timeRemaining,
  onToggleDarkMode,
  onTimeButtonClick,
  onOpenWatchfacePicker,
  profileImageUrl,
}: {
  isTimerActive?: boolean;
  showTimerSelector?: boolean;
  themeMode?: 'light' | 'dark' | 'color';
  timeRemaining?: number | null;
  onToggleDarkMode?: () => void;
  onTimeButtonClick?: (minutes: number) => void;
  onOpenWatchfacePicker?: () => void;
  profileImageUrl?: string | null;
}) {
  const faded = isTimerActive;
  return (
    <div
      className="absolute content-stretch flex items-start justify-between left-0 top-0 w-full gap-2 sm:gap-4 min-h-0 overflow-hidden pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] transition-opacity duration-500 ease-in-out"
      data-name="Top"
      style={{
        opacity: faded ? 0 : 1,
        pointerEvents: faded ? 'none' : 'auto',
      }}
    >
      <ProfileAvatar profileImageUrl={profileImageUrl} themeMode={themeMode} />

      <TimerSwitch
        isTimerActive={isTimerActive}
        showTimerSelector={showTimerSelector}
        themeMode={themeMode}
        timeRemaining={timeRemaining}
        onTimeButtonClick={onTimeButtonClick}
      />

      <ThemeToggle themeMode={themeMode} onToggle={onToggleDarkMode} onOpenWatchfacePicker={onOpenWatchfacePicker} />
    </div>
  );
}

function MusicPickerButton({ onClick, themeMode }: { onClick?: () => void; themeMode?: 'light' | 'dark' | 'color' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Pick music or sound"
      className={`flex items-center justify-center rounded-full size-12 sm:size-14 transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        themeMode === 'light' 
          ? 'bg-white/90 shadow-[0_2px_8px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.8)] text-[#5a5a5a] focus-visible:ring-[#888]' 
          : 'bg-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.2)] text-[#c0c0c0] focus-visible:ring-white/40'
      }`}
      data-name="MusicPicker"
    >
      <Music className="size-6 sm:size-7" strokeWidth={1.5} />
    </button>
  );
}

// Center hub — Watchface 0: original dark center + #EDEDED stroke (61-3747). Watchphases 1–5: white fill, no stroke (61-1216)
function Ticker2({ themeMode }: { themeMode?: 'light' | 'dark' | 'color' }) {
  const isDarkOrColor = themeMode === 'dark' || themeMode === 'color';
  const fillColor = isDarkOrColor ? '#FFFFFF' : 'rgb(17, 17, 17)';
  const strokeColor = isDarkOrColor ? 'transparent' : '#EDEDED';
  return (
    <div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none z-10 transition-colors duration-500"
      style={{
        width: 24,
        height: 24,
        background: fillColor,
        border: isDarkOrColor ? 'none' : '4px solid',
        borderColor: strokeColor,
      }}
      data-name="TickerCenter"
    />
  );
}

function useTimeButtonRadius() {
  const [radius, setRadius] = useState(140);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const size = Math.min(w, h);
      setRadius(size < 400 ? 100 : size < 640 ? 130 : size < 1024 ? 160 : 180);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return radius;
}

function TimeButton({ minutes, onClick, themeMode, position }: { minutes: number; onClick: () => void; themeMode?: 'light' | 'dark' | 'color'; position: '15' | '30' | '45' }) {
  const angleMap = {
    '15': 90,
    '30': 180,
    '45': 270
  };
  const angle = angleMap[position];
  const radiusPx = useTimeButtonRadius();
  const cssAngle = angle - 90;
  const rad = cssAngle * (Math.PI / 180);
  const x = Math.cos(rad) * radiusPx;
  const y = Math.sin(rad) * radiusPx;
  
  return (
    <button
      onClick={onClick}
      className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-[112px] shrink-0 size-10 sm:size-11 lg:size-12 transition-all duration-300 hover:scale-110 flex items-center justify-center ${
        themeMode === 'light' 
          ? 'bg-white shadow-[0px_4px_8px_-3px_rgba(0,0,0,0.54)]' 
          : 'bg-[#4f4f4f] shadow-[0px_4px_8px_-3px_rgba(0,0,0,0.54)]'
      }`}
      style={{
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
      }}
      data-name={`TimeButton-${minutes}`}
    >
      <div className={`font-['SF_Pro:Regular',sans-serif] font-normal text-[12px] text-center transition-colors duration-500 ${
        themeMode === 'light' ? 'text-[#6d6d6d]' : 'text-[#888]'
      }`}>
        {minutes}
      </div>
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_2px_0px_12px_-3px_rgba(0,0,0,0.12),inset_0px_8px_9px_-7px_rgba(0,0,0,0.08)]" />
    </button>
  );
}

// Clock face — Watchface 0 (light): original Figma 61-3739 gray #EDEDED + neumorphic shadows. Watchphases 1–5: Figma 61-1209 gradient ring.
function ClockFace({ themeMode }: { themeMode?: 'light' | 'dark' | 'color' }) {
  const isWatchface0 = themeMode === 'light';
  const isDarkOrColor = themeMode === 'dark' || themeMode === 'color';
  const neumorphGray =
    'inset 5px 7px 10px -1px rgba(166, 166, 166, 0.12), inset -6px -1px 10px 2px rgba(255, 255, 255, 0.25), -6px -7px 20px 0 rgba(255, 255, 255, 0.5), 8px 8px 20px 0 rgba(170, 170, 170, 0.25)';

  if (isDarkOrColor) {
    return (
      <div className="absolute inset-0 rounded-full transition-all duration-500" data-name="ClockFace" aria-hidden>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient
              id="clockFaceRingGradient"
              x1="0"
              y1="0"
              x2="1"
              y2="1"
              gradientUnits="objectBoundingBox"
              gradientTransform="rotate(135 0.5 0.5)"
            >
              <stop offset="0%" stopColor="rgb(255,255,255)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="rgb(255,255,255)" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="49.5" fill="none" stroke="url(#clockFaceRingGradient)" strokeWidth="0.2" />
        </svg>
      </div>
    );
  }

  // Watchface 0 only: original gray dial + neumorphic shadows
  return (
    <div
      className="absolute inset-0 rounded-full transition-all duration-500"
      data-name="ClockFace"
      style={{
        backgroundColor: '#EDEDED',
        boxShadow: neumorphGray,
      }}
    />
  );
}

// Ticker lines — Figma 61-3739: 8 LINEs, 24px long, 12px side padding
const TICKER_COLOR_FIGMA = 'rgb(158, 159, 166)';
const CLOCK_SIZE_PX = 509;

function ClockMarkers({ themeMode }: { themeMode?: 'light' | 'dark' | 'color' }) {
  // Watchface 0: original gray markers (61-3739). Watchphases 1–5: solid white (61:1208)
  const strokeColor =
    themeMode === 'dark' || themeMode === 'color' ? 'rgb(255,255,255)' : TICKER_COLOR_FIGMA;
  const rotations = [-90, -45, 0, 45, 90, 135, 180, 225]; // 12, 1:30, 3, 4:30, 6, 7:30, 9, 10:30
  const radius = 50;
  const pxToView = (px: number) => (px / CLOCK_SIZE_PX) * 100;
  const tickLength = pxToView(24);
  const sidePadding = pxToView(12);
  const rOuter = radius - sidePadding;
  const rInner = rOuter - tickLength;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 5 }} data-name="ClockMarkers" aria-hidden>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        <g transform="translate(50, 50)">
          {rotations.map((deg, i) => {
            const rad = ((deg + 90) * Math.PI) / 180;
            const x1 = rInner * Math.sin(rad);
            const y1 = -rInner * Math.cos(rad);
            const x2 = rOuter * Math.sin(rad);
            const y2 = -rOuter * Math.cos(rad);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={strokeColor}
                strokeWidth={0.2}
                strokeLinecap="round"
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}

// Outer ring — Watchface 0: minimal edge (61-3739). Watchphases 1–5: omitted (gradient stroke is the ring)
function Time({ themeMode }: { themeMode?: 'light' | 'dark' | 'color' }) {
  const isDarkOrColor = themeMode === 'dark' || themeMode === 'color';
  if (isDarkOrColor) return null;
  const strokeColor = 'rgba(0,0,0,0.06)';
  return (
    <div className="absolute inset-0 pointer-events-none" data-name="TimeRing">
      <div className="absolute inset-[-0.79%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 517 517">
          <path d={svgPaths.p1a77dd80} stroke={strokeColor} strokeWidth="1" className="transition-colors duration-500" />
        </svg>
      </div>
    </div>
  );
}

// Clock — Figma 61-3739. Order: face → markers → ring → hands → center.
const DRAG_THRESHOLD_PX = 8;

function Clock({
  themeMode,
  isTimerActive,
  timeRemaining,
  onClockClick,
  draggedMinutes,
  onMinuteHandDrag,
  onMinuteHandDragEnd,
  onTimeButtonClick,
  showTimerSelector,
}: {
  themeMode?: 'light' | 'dark' | 'color';
  isTimerActive?: boolean;
  timeRemaining?: number | null;
  onClockClick?: () => void;
  draggedMinutes?: number | null;
  onMinuteHandDrag?: (minutes: number) => void;
  onMinuteHandDragEnd?: (minutes: number) => void;
  onTimeButtonClick?: (minutes: number) => void;
  showTimerSelector?: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  const calculateMinutes = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360;
    return Math.round((angle / 360) * 60);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isTimerActive) return;
    e.preventDefault();
    e.stopPropagation();
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    onMinuteHandDrag?.(calculateMinutes(e));
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || isTimerActive) return;
    e.preventDefault();
    onMinuteHandDrag?.(calculateMinutes(e));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const start = pointerStartRef.current;
    const didMove =
      start &&
      (Math.abs(e.clientX - start.x) > DRAG_THRESHOLD_PX ||
        Math.abs(e.clientY - start.y) > DRAG_THRESHOLD_PX);
    pointerStartRef.current = null;

    if (isDragging) {
      e.preventDefault();
      setIsDragging(false);
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      if (didMove) {
        onMinuteHandDragEnd?.(calculateMinutes(e));
      }
    }
  };

  return (
    <div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 p-2 sm:p-[10px]"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ touchAction: 'none', cursor: isTimerActive ? 'default' : 'grab' }}
    >
      <div className="relative shrink-0 w-[260px] h-[260px] min-[400px]:w-[300px] min-[400px]:h-[300px] sm:w-[340px] sm:h-[340px] md:w-[400px] md:h-[400px] lg:size-[509px]">
        {/* 1. Face (back) */}
        <ClockFace themeMode={themeMode} />
        {/* 2. Markers */}
        <ClockMarkers themeMode={themeMode} />
        {/* 3. Ring */}
        <Time themeMode={themeMode} />
        {/* 4. Hands + center (front) */}
        <div
          onClick={(e) => {
            if (isTimerActive && onClockClick) {
              e.stopPropagation();
              onClockClick();
            }
          }}
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 pointer-events-none ${isTimerActive ? 'cursor-pointer' : ''}`}
          style={{ pointerEvents: isTimerActive ? 'auto' : 'none' }}
          data-name="Ticker"
        >
          <LiveClock
            isTimerActive={isTimerActive}
            timeRemaining={timeRemaining}
            draggedMinutes={draggedMinutes}
            themeMode={themeMode}
          />
          <Ticker2 themeMode={themeMode} />
        </div>
        {/* Time selection buttons — same size wrapper so 50% = clock center */}
        {showTimerSelector && !isTimerActive && (
          <>
            <TimeButton minutes={15} onClick={() => onTimeButtonClick?.(15)} themeMode={themeMode} position="15" />
            <TimeButton minutes={30} onClick={() => onTimeButtonClick?.(30)} themeMode={themeMode} position="30" />
            <TimeButton minutes={45} onClick={() => onTimeButtonClick?.(45)} themeMode={themeMode} position="45" />
          </>
        )}
      </div>
    </div>
  );
}

function Table({ themeMode }: { themeMode?: 'light' | 'dark' | 'color' }) {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 w-full" data-name="Table">
      <TodoList themeMode={themeMode} />
    </div>
  );
}

function Tasks({ className, themeMode }: { className?: string; themeMode?: 'light' | 'dark' | 'color' }) {
  const isBright = themeMode === 'light';
  return (
    <div
      className={className || "content-stretch flex flex-col relative rounded-[24px] w-full max-w-[265px] min-h-[178px] min-w-0 transition-all duration-500"}
      data-name="Tasks"
      style={
        isBright
          ? undefined
          : { border: '1px solid rgba(255, 255, 255, 0.2)', boxSizing: 'border-box' }
      }
    >
      {/* Bright (watchface-0): solid gradient. Dark/color: frosted #E9E9E9 20%, blur 25px, outline #FFFFFF 20% */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-[23px] pointer-events-none"
        style={
          isBright
            ? {
                background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 50%, #ebebeb 100%)',
                boxShadow: '0px 2px 8px rgba(0,0,0,0.06), 0px 1px 2px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)',
              }
            : {
                background: 'rgba(233, 233, 233, 0.2)',
                backdropFilter: 'blur(25px)',
                WebkitBackdropFilter: 'blur(25px)',
              }
        }
      />
      {isBright && (
        <div aria-hidden className="absolute border border-solid inset-0 pointer-events-none rounded-[24px] border-[#e5e5e5]" />
      )}
      <div className="content-stretch flex flex-col gap-4 items-start justify-center relative z-10 shrink-0 w-full p-4 overflow-hidden rounded-[24px]" data-name="Table">
        <p
          className={`font-['SF_Pro:Medium',sans-serif] font-medium tracking-wide uppercase text-[11px] sm:text-[14px] relative shrink-0 transition-colors duration-500 ${isBright ? 'text-[#8a8a8a]' : 'text-[#FFFFFF]'}`}
          style={{ fontVariationSettings: "'wdth' 100" }}
        >
          Today
        </p>
        <Table themeMode={themeMode} />
      </div>
    </div>
  );
}

function TasksContainer({ themeMode }: { themeMode?: 'light' | 'dark' | 'color' }) {
  return (
    <div className="content-stretch flex flex-col items-start p-2.5 relative shrink-0 w-full max-w-[285px] min-w-0" data-name="TasksContainer">
      <Tasks themeMode={themeMode} />
    </div>
  );
}

function PlayerContainer({ 
  songName, 
  currentTime, 
  duration, 
  isPlaying, 
  onSeek, 
  onPlayPause, 
  albumArtUrl,
  themeMode,
  onLongPress,
  audioPlayerRef
}: {
  songName: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (progress: number) => void;
  onPlayPause: () => void;
  albumArtUrl?: string;
  themeMode?: 'light' | 'dark' | 'color';
  onLongPress?: () => void;
  audioPlayerRef?: React.RefObject<AudioPlayerRef>;
}) {
  return (
    <div className="content-stretch flex gap-2 sm:gap-2.5 min-h-[100px] sm:min-h-[121px] items-center justify-center p-4 sm:p-5 lg:p-6 relative shrink-0 w-full max-w-[500px] min-w-0" data-name="Player">
      <AudioPlayerUI
        songName={songName}
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        onSeek={onSeek}
        onPlayPause={onPlayPause}
        albumArtUrl={albumArtUrl}
        themeMode={themeMode}
        onLongPress={onLongPress}
        audioPlayerRef={audioPlayerRef}
      />
    </div>
  );
}


function BottomBar({
  isPlaying, 
  volume, 
  onVolumePlayPause, 
  onVolumeChange, 
  onVolumeLongPress, 
  isTimerActive, 
  themeMode,
  songName,
  currentTime,
  duration,
  onSeek,
  albumArtUrl,
  audioPlayerRef,
  onOpenSoundPicker
}: {
  isPlaying?: boolean;
  volume?: number;
  onVolumePlayPause?: () => void;
  onVolumeChange?: (volume: number) => void;
  onVolumeLongPress?: () => void;
  isTimerActive?: boolean;
  themeMode?: 'light' | 'dark' | 'color';
  songName?: string;
  currentTime?: number;
  duration?: number;
  onSeek?: (progress: number) => void;
  albumArtUrl?: string;
  audioPlayerRef?: React.RefObject<AudioPlayerRef>;
  onOpenSoundPicker?: () => void;
}) {
  const faded = isTimerActive;
  return (
    <div 
      className="absolute bottom-0 left-0 w-full flex flex-row items-end justify-between pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pointer-events-none transition-opacity duration-500 ease-in-out"
      style={{ 
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        opacity: faded ? 0 : 1,
        pointerEvents: faded ? 'none' : 'auto'
      }}
      data-name="Bottom Bar"
    >
      {/* Tasks - Left */}
      <div className="flex-1 min-w-0 flex justify-start pointer-events-auto">
        <TasksContainer themeMode={themeMode} />
      </div>
      
      {/* Audio Player - Center (absolute so it doesn't affect left/right balance) */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-0 flex justify-center pointer-events-auto" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        <PlayerContainer
          songName={songName || 'Song Name'}
          currentTime={currentTime || 0}
          duration={duration || 0}
          isPlaying={isPlaying || false}
          onSeek={onSeek || (() => {})}
          onPlayPause={onVolumePlayPause || (() => {})}
          albumArtUrl={albumArtUrl}
          themeMode={themeMode}
          onLongPress={onVolumeLongPress}
          audioPlayerRef={audioPlayerRef}
        />
      </div>
      
      {/* Music picker - Bottom right */}
      <div className="flex-1 min-w-0 flex justify-end items-end p-4 sm:p-5 lg:p-6 pointer-events-auto">
        <MusicPickerButton onClick={onOpenSoundPicker} themeMode={themeMode} />
      </div>
    </div>
  );
}

export default function Home({ 
  isTimerActive,
  isPlaying,
  volume,
  onVolumePlayPause,
  onVolumeChange,
  onVolumeLongPress,
  timeRemaining,
  onClockClick,
  onOpenWatchfacePicker,
  onMinuteHandDrag,
  onMinuteHandDragEnd,
  onTimeButtonClick,
  draggedMinutes,
  showTimerSelector,
  themeMode,
  uiTheme,
  onToggleDarkMode,
  songName,
  currentTime,
  duration,
  onSeek,
  albumArtUrl,
  audioPlayerRef,
  profileImageUrl,
  onOpenSoundPicker,
  showWatchfacePicker
}: { 
  isTimerActive?: boolean;
  isPlaying?: boolean;
  volume?: number;
  onVolumePlayPause?: () => void;
  onVolumeChange?: (volume: number) => void;
  onVolumeLongPress?: () => void;
  timeRemaining?: number | null;
  onClockClick?: () => void;
  onOpenWatchfacePicker?: () => void;
  onMinuteHandDrag?: (minutes: number) => void;
  onMinuteHandDragEnd?: (minutes: number) => void;
  onTimeButtonClick?: (minutes: number) => void;
  draggedMinutes?: number | null;
  showTimerSelector?: boolean;
  themeMode?: 'light' | 'dark' | 'color';
  /** UI theme: bright (light) for watchface 1–4, same as themeMode for watchface 0 */
  uiTheme?: 'light' | 'dark' | 'color';
  onToggleDarkMode?: () => void;
  songName?: string;
  currentTime?: number;
  duration?: number;
  onSeek?: (progress: number) => void;
  albumArtUrl?: string;
  audioPlayerRef?: React.RefObject<AudioPlayerRef>;
  profileImageUrl?: string | null;
  onOpenSoundPicker?: () => void;
  showWatchfacePicker?: boolean;
}) {
  const ui = uiTheme ?? themeMode;
  const panelOpen = !!showWatchfacePicker;
  const uiFaded = panelOpen
    ? 'opacity-0 pointer-events-none'
    : 'opacity-100 pointer-events-auto';
  const uiTransition = 'transition-opacity duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]';

  return (
    <div className="bg-transparent overflow-clip relative w-full h-full min-h-screen" data-name="Home">
      <div className={`absolute left-0 top-0 w-full ${uiFaded} ${uiTransition}`} aria-hidden={panelOpen}>
        <Top
          isTimerActive={isTimerActive}
          showTimerSelector={showTimerSelector}
          themeMode={ui}
          timeRemaining={timeRemaining}
          onToggleDarkMode={onToggleDarkMode}
          onTimeButtonClick={onTimeButtonClick}
          onOpenWatchfacePicker={onOpenWatchfacePicker}
          profileImageUrl={profileImageUrl}
        />
      </div>
      <Clock
        themeMode={themeMode}
        isTimerActive={isTimerActive}
        timeRemaining={timeRemaining}
        onClockClick={onClockClick}
        draggedMinutes={draggedMinutes}
        onMinuteHandDrag={onMinuteHandDrag}
        onMinuteHandDragEnd={onMinuteHandDragEnd}
        onTimeButtonClick={onTimeButtonClick}
        showTimerSelector={showTimerSelector}
      />
      <div className={`absolute bottom-0 left-0 w-full ${uiFaded} ${uiTransition}`} aria-hidden={panelOpen}>
        <BottomBar 
          isPlaying={isPlaying}
          volume={volume}
          onVolumePlayPause={onVolumePlayPause}
          onVolumeChange={onVolumeChange}
          onVolumeLongPress={onVolumeLongPress}
          isTimerActive={isTimerActive}
          themeMode={themeMode}
          songName={songName}
          currentTime={currentTime}
          duration={duration}
          onSeek={onSeek}
          albumArtUrl={albumArtUrl}
          audioPlayerRef={audioPlayerRef}
          onOpenSoundPicker={onOpenSoundPicker}
        />
      </div>
    </div>
  );
}
