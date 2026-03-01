// Home component with 3-mode theme system (light/dark/color)
import { useState } from 'react';
import svgPaths from "./svg-e0ybop1bd5";
import { LiveClock } from "@/app/components/LiveClock";
import { DynamicGreeting } from "@/app/components/DynamicGreeting";
import { TodoList } from "@/app/components/TodoList";
import { AudioPlayerUI } from "@/app/components/AudioPlayerUI";
import { AudioPlayerRef } from "@/app/components/AudioPlayer";

function Greeting({ themeMode }: { themeMode?: 'light' | 'dark' | 'color' }) {
  return (
    <div className="content-stretch flex items-start p-[24px] relative shrink-0 w-[321px]" data-name="Greeting">
      <div className="relative shrink-0 w-[273px]">
        <DynamicGreeting themeMode={themeMode} />
      </div>
    </div>
  );
}

function FocusToggle({ isOn, themeMode, timeRemaining }: { isOn?: boolean; themeMode?: 'light' | 'dark' | 'color'; timeRemaining?: number | null }) {
  // New design: Toggle with "Focus" label on the right
  // Container with inset shadow, white knob slides, and "Focus" label
  // When timer is active, show minutes remaining countdown next to toggle
  
  const minutesRemaining = timeRemaining && timeRemaining > 0 
    ? Math.ceil(timeRemaining / 60000) 
    : null;
  
  return (
    <div 
      className={`content-stretch flex items-center overflow-clip p-[4px] relative rounded-[112px] shrink-0 transition-colors duration-500 ${
        themeMode === 'dark' ? 'bg-[#272727]' : 'bg-[#dcdcdc]'
      }`}
      data-name="Toggle"
    >
      {/* Sliding knob - absolutely positioned, slides from left to right when active */}
      <div 
        className={`absolute rounded-[88px] shrink-0 size-[40px] transition-all duration-300 ease-[cubic-bezier(0.4,0.0,0.2,1)] ${
          themeMode === 'light' 
            ? 'bg-white shadow-[0px_4px_8px_-3px_rgba(0,0,0,0.54)]' 
            : 'bg-[#4f4f4f] shadow-[0px_4px_8px_-3px_rgba(0,0,0,0.54)]'
        }`}
        style={{
          left: isOn ? 'calc(100% - 44px)' : '4px',
          top: '4px',
        }}
        data-name="Knob"
      />
      
      {/* Focus label - positioned to the right */}
      <div className="content-stretch flex items-center px-[8px] relative shrink-0 ml-auto" data-name="Label">
        <p 
          className={`font-['SF_Pro:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[12px] text-center transition-colors duration-500 ${
            themeMode === 'light' ? 'text-[#6d6d6d]' : 'text-[#888]'
          }`}
          style={{ fontVariationSettings: "'wdth' 100" }}
        >
          Focus
        </p>
      </div>
      
      {/* Minutes remaining countdown - shown when timer is active */}
      {isOn && minutesRemaining !== null && (
        <div className="content-stretch flex items-center px-[12px] relative shrink-0 ml-[8px]" data-name="Countdown">
          <p 
            className={`font-body-cue font-normal leading-[normal] relative shrink-0 text-[16px] text-center transition-colors duration-500 ${
              themeMode === 'light' ? 'text-[#6d6d6d]' : 'text-[#888]'
            }`}
          >
            {minutesRemaining}m
          </p>
        </div>
      )}
      
      {/* Inset shadow overlay */}
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_2px_0px_12px_-3px_rgba(0,0,0,0.12),inset_0px_8px_9px_-7px_rgba(0,0,0,0.08)]" />
    </div>
  );
}

function TimerSwitch({ isTimerActive, themeMode, timeRemaining }: { isTimerActive?: boolean; themeMode?: 'light' | 'dark' | 'color'; timeRemaining?: number | null }) {
  // data-name="Timer" allows HomeWrapper to capture clicks and trigger the timer
  return (
    <div className="content-stretch flex h-[208px] items-start justify-center p-[24px] relative shrink-0 w-[342px] cursor-pointer" data-name="Timer">
      <FocusToggle isOn={isTimerActive} themeMode={themeMode} timeRemaining={timeRemaining} />
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

function ChangeTheme({ themeMode, onToggle }: { themeMode?: 'light' | 'dark' | 'color'; onToggle?: () => void }) {
  return (
    <div 
      onClick={onToggle}
      className="cursor-pointer hover:opacity-80 transition-opacity"
      data-name="Change Theme"
    >
      <Push themeMode={themeMode} />
    </div>
  );
}

function ThemeToggle({ themeMode, onToggle }: { themeMode?: 'light' | 'dark' | 'color'; onToggle?: () => void }) {
  return (
    <div className="content-stretch flex items-start justify-end p-[24px] relative shrink-0 w-[321px]" data-name="Toggle">
      <ChangeTheme themeMode={themeMode} onToggle={onToggle} />
    </div>
  );
}

function Top({ isTimerActive, themeMode, timeRemaining, onToggleDarkMode }: { isTimerActive?: boolean; themeMode?: 'light' | 'dark' | 'color'; timeRemaining?: number | null; onToggleDarkMode?: () => void }) {
  return (
    <div className="absolute content-stretch flex items-start justify-between left-0 top-0 w-full" data-name="Top">
      {/* Greeting - Left - fades away when focus mode is on */}
      <div 
        style={{ 
          opacity: isTimerActive ? 0 : 1, 
          transition: 'opacity 0.8s ease-in-out',
          pointerEvents: isTimerActive ? 'none' : 'auto'
        }}
      >
        <Greeting themeMode={themeMode} />
      </div>
      
      {/* Timer Switch - Center */}
      <TimerSwitch isTimerActive={isTimerActive} themeMode={themeMode} timeRemaining={timeRemaining} />
      
      {/* Theme Toggle - Right - fades away when focus mode is on */}
      <div 
        style={{ 
          opacity: isTimerActive ? 0 : 1, 
          transition: 'opacity 0.8s ease-in-out',
          pointerEvents: isTimerActive ? 'none' : 'auto'
        }}
      >
        <ThemeToggle themeMode={themeMode} onToggle={onToggleDarkMode} />
      </div>
    </div>
  );
}

function Ticker2({ themeMode }: { themeMode?: 'light' | 'dark' | 'color' }) {
  return <div className={`-translate-x-1/2 -translate-y-1/2 absolute left-1/2 rounded-[88px] shadow-[0px_4px_8px_0px_rgba(0,0,0,0.54),3px_12px_27px_0px_rgba(0,0,0,0.22)] w-[30px] h-[30px] sm:size-[42.793px] top-1/2 transition-colors duration-500 ${themeMode === 'light' ? 'bg-gradient-to-b from-[#666] to-black' : 'bg-gradient-to-b from-[#888] to-[#555]'}`} data-name="Ticker" />;
}

function Ticker1({ 
  isTimerActive, 
  timeRemaining, 
  onClockClick, 
  draggedMinutes,
  themeMode 
}: { 
  isTimerActive?: boolean; 
  timeRemaining?: number | null; 
  onClockClick?: () => void;
  draggedMinutes?: number | null;
  themeMode?: 'light' | 'dark' | 'color' 
}) {
  return (
    <div 
      onClick={(e) => {
        if (isTimerActive && onClockClick) {
          e.stopPropagation(); // Prevent toggling play/pause from global click
          onClockClick();
        }
      }}
      className={`-translate-x-1/2 -translate-y-1/2 absolute left-[calc(50%+3px)] sm:left-[calc(50%+4.37px)] rounded-[88px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] w-[30px] h-[30px] sm:size-[42.793px] top-[calc(50%+3.5px)] sm:top-[calc(50%+5.03px)] transition-colors duration-500 ${isTimerActive ? 'cursor-pointer hover:scale-110 transition-transform' : ''} ${themeMode === 'light' ? 'bg-gradient-to-b from-[#666] to-black' : 'bg-gradient-to-b from-[#888] to-[#555]'}`} 
      data-name="Ticker"
    >
      <LiveClock 
        isTimerActive={isTimerActive} 
        timeRemaining={timeRemaining}
        draggedMinutes={draggedMinutes}
      />
      <Ticker2 themeMode={themeMode} />
    </div>
  );
}

function TimeButton({ minutes, onClick, themeMode, position }: { minutes: number; onClick: () => void; themeMode?: 'light' | 'dark' | 'color'; position: '15' | '30' | '45' }) {
  // Position buttons around the clock at 15, 30, and 45 minute marks
  // On a clock face: 15min = 3 o'clock (right), 30min = 6 o'clock (bottom), 45min = 9 o'clock (left)
  // CSS: 0deg = right, 90deg = down, 180deg = left, 270deg = up
  // Clock: 0deg = up (12 o'clock), 90deg = right (3 o'clock), 180deg = down (6 o'clock), 270deg = left (9 o'clock)
  const angleMap = {
    '15': 90,   // 3 o'clock (right)
    '30': 180,  // 6 o'clock (bottom)
    '45': 270   // 9 o'clock (left)
  };
  
  const angle = angleMap[position];
  const radius = 180; // Distance from center (adjust based on clock size)
  
  // Convert angle to x, y position relative to center
  // CSS uses: 0deg = right, 90deg = down
  // Clock uses: 0deg = up (12 o'clock), 90deg = right (3 o'clock)
  // So we need: CSS angle = clock angle - 90
  const cssAngle = angle - 90;
  const rad = cssAngle * (Math.PI / 180);
  const x = Math.cos(rad) * radius;
  const y = Math.sin(rad) * radius;
  
  return (
    <button
      onClick={onClick}
      className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-[112px] shrink-0 size-[48px] transition-all duration-300 hover:scale-110 flex items-center justify-center ${
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

function Ticker({ 
  isTimerActive, 
  timeRemaining, 
  onClockClick, 
  draggedMinutes,
  onTimeButtonClick,
  showTimerSelector,
  themeMode 
}: { 
  isTimerActive?: boolean; 
  timeRemaining?: number | null; 
  onClockClick?: () => void;
  draggedMinutes?: number | null;
  onTimeButtonClick?: (minutes: number) => void;
  showTimerSelector?: boolean;
  themeMode?: 'light' | 'dark' | 'color' 
}) {
  return (
    <div className="absolute h-[250px] sm:h-[350px] lg:h-[411px] left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-[300px] sm:w-[400px] lg:w-[434px]" data-name="Ticker">
      <Ticker1 
        isTimerActive={isTimerActive} 
        timeRemaining={timeRemaining} 
        onClockClick={onClockClick}
        draggedMinutes={draggedMinutes}
        themeMode={themeMode} 
      />
      {/* Time selection buttons - only show when selector is visible and timer is not active */}
      {showTimerSelector && !isTimerActive && (
        <>
          <TimeButton minutes={15} onClick={() => onTimeButtonClick?.(15)} themeMode={themeMode} position="15" />
          <TimeButton minutes={30} onClick={() => onTimeButtonClick?.(30)} themeMode={themeMode} position="30" />
          <TimeButton minutes={45} onClick={() => onTimeButtonClick?.(45)} themeMode={themeMode} position="45" />
        </>
      )}
    </div>
  );
}

function Time({ themeMode }: { themeMode?: 'light' | 'dark' | 'color' }) {
  return (
    <div className="relative shrink-0 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] lg:size-[509px]" data-name="Time">
      <div className="absolute inset-[-0.79%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 517 517">
          <g id="Time">
            <path 
              d={svgPaths.p1a77dd80} 
              id="Ellipse 57" 
              stroke={themeMode === 'light' ? "black" : "rgba(255, 255, 255, 0.3)"} 
              strokeDasharray="1 48" 
              strokeWidth="8"
              className="transition-all duration-500"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Frame({ 
  themeMode, 
  onMinuteHandDrag, 
  onMinuteHandDragEnd, 
  isTimerActive 
}: { 
  themeMode?: 'light' | 'dark' | 'color';
  onMinuteHandDrag?: (minutes: number) => void;
  onMinuteHandDragEnd?: (minutes: number) => void;
  isTimerActive?: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const calculateMinutes = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    // Calculate angle: atan2 gives angle from positive x-axis
    // We want 0deg = up (12 o'clock), so we add 90 and normalize
    const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360;
    // Convert to minutes (0-60)
    const minutes = Math.round((angle / 360) * 60);
    return minutes;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isTimerActive) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const minutes = calculateMinutes(e);
    onMinuteHandDrag?.(minutes);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || isTimerActive) return;
    e.preventDefault();
    const minutes = calculateMinutes(e);
    onMinuteHandDrag?.(minutes);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    const minutes = calculateMinutes(e);
    onMinuteHandDragEnd?.(minutes);
  };

  return (
    <div 
      className="absolute content-stretch flex items-center justify-center left-1/2 -translate-x-1/2 p-2 sm:p-[10px] top-1/2 -translate-y-1/2 w-auto"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ touchAction: 'none', cursor: isTimerActive ? 'default' : 'grab' }}
    >
      <Time themeMode={themeMode} />
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
  return (
    <div 
      className={className || "bg-[#e9e9e9] border border-[#e0e0e0] border-solid content-stretch flex items-end p-[16px] relative rounded-[24px] w-[265px] transition-all duration-500"} 
      data-name="Tasks" 
      style={{ 
        backgroundImage: themeMode === 'light'
          ? "linear-gradient(137.459deg, rgb(255, 255, 255) 1.842%, rgb(237, 237, 237) 96.132%)"
          : "linear-gradient(137.459deg, rgba(255, 255, 255, 0.1) 1.842%, rgba(237, 237, 237, 0.1) 96.132%)"
      }}
    >
      <div 
        aria-hidden="true" 
        className={`absolute border border-solid inset-0 pointer-events-none rounded-[24px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.04),0px_4px_8px_0px_rgba(0,0,0,0.16)] transition-colors duration-500 ${themeMode === 'light' ? 'border-[#e0e0e0]' : 'border-[#333]'}`}
      />
      <div className="content-stretch flex flex-col gap-[16px] items-start justify-center relative shrink-0 w-full" data-name="Table">
        <p 
          className={`font-['SF_Pro:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[12px] text-center transition-colors duration-500 ${
            themeMode === 'light' ? 'text-[#6d6d6d]' : 'text-[#888]'
          }`}
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
    <div className="content-stretch flex flex-col items-start p-[10px] relative shrink-0 w-[285px]" data-name="TasksContainer">
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
    <div className="content-stretch flex gap-[10px] h-[121px] items-center justify-center p-[24px] relative shrink-0" data-name="Player">
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
  audioPlayerRef
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
}) {
  return (
    <div className="absolute bottom-0 content-stretch flex items-end justify-start left-0 w-full" data-name="Bottom Bar">
      {/* Tasks - Left - fades away when focus mode is on */}
      <div 
        style={{ 
          opacity: isTimerActive ? 0 : 1, 
          transition: 'opacity 0.8s ease-in-out',
          pointerEvents: isTimerActive ? 'none' : 'auto'
        }}
      >
        <TasksContainer themeMode={themeMode} />
      </div>
      
      {/* Audio Player - Center - Absolutely positioned to always stay centered */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-0">
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
  onMinuteHandDrag,
  onMinuteHandDragEnd,
  onTimeButtonClick,
  draggedMinutes,
  showTimerSelector,
  themeMode,
  onToggleDarkMode,
  songName,
  currentTime,
  duration,
  onSeek,
  albumArtUrl,
  audioPlayerRef
}: { 
  isTimerActive?: boolean;
  isPlaying?: boolean;
  volume?: number;
  onVolumePlayPause?: () => void;
  onVolumeChange?: (volume: number) => void;
  onVolumeLongPress?: () => void;
  timeRemaining?: number | null;
  onClockClick?: () => void;
  onMinuteHandDrag?: (minutes: number) => void;
  onMinuteHandDragEnd?: (minutes: number) => void;
  onTimeButtonClick?: (minutes: number) => void;
  draggedMinutes?: number | null;
  showTimerSelector?: boolean;
  themeMode?: 'light' | 'dark' | 'color';
  onToggleDarkMode?: () => void;
  songName?: string;
  currentTime?: number;
  duration?: number;
  onSeek?: (progress: number) => void;
  albumArtUrl?: string;
  audioPlayerRef?: React.RefObject<AudioPlayerRef>;
}) {
  return (
    <div className="bg-transparent overflow-clip relative w-full h-full min-h-screen" data-name="Home">
      <Top 
        isTimerActive={isTimerActive} 
        themeMode={themeMode} 
        timeRemaining={timeRemaining}
        onToggleDarkMode={onToggleDarkMode}
      />
      <Ticker 
        isTimerActive={isTimerActive} 
        timeRemaining={timeRemaining} 
        onClockClick={onClockClick}
        draggedMinutes={draggedMinutes}
        onTimeButtonClick={onTimeButtonClick}
        showTimerSelector={showTimerSelector}
        themeMode={themeMode} 
      />
      <Frame 
        themeMode={themeMode}
        onMinuteHandDrag={onMinuteHandDrag}
        onMinuteHandDragEnd={onMinuteHandDragEnd}
        isTimerActive={isTimerActive}
      />
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
      />
    </div>
  );
}
