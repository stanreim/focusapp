// Home component with 3-mode theme system (light/dark/color)
import { useState, useEffect, useRef } from 'react';
import svgPaths from "./svg-e0ybop1bd5";
import { LiveClock } from "@/app/components/LiveClock";
import { TodoList } from "@/app/components/TodoList";
import { AudioPlayerUI } from "@/app/components/AudioPlayerUI";
import { AudioPlayerRef } from "@/app/components/AudioPlayer";

/** Top-left greeting: Figma Zeno-Day node 61:3718 / 94:2856 — menu control + weekday + DD.MM */
function GreetingHeader({
  themeMode,
  watchfaceBackgroundIndex,
  onMenuClick,
}: {
  themeMode?: 'light' | 'dark' | 'color';
  /** 0 = default (flat) background; 1+ = photo backgrounds — weekday uses #FFF for contrast */
  watchfaceBackgroundIndex?: number;
  onMenuClick?: (menuButtonRect: DOMRect) => void;
}) {
  const [now, setNow] = useState(() => new Date());
  /** Increment on menu click so dots remount and the wave animation replays */
  const [menuDotWaveKey, setMenuDotWaveKey] = useState(0);
  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dateStr = `${dd}.${mm}`;

  const isLight = themeMode === 'light';
  const bgIndex = watchfaceBackgroundIndex ?? 0;
  const onPhotoWatchface = bgIndex > 0;
  const outerBg = themeMode === 'dark' ? 'bg-[#272727]' : 'bg-[#dcdcdc]';
  const innerKnob =
    themeMode === 'light'
      ? 'bg-white border-white shadow-[0px_4px_10px_-3px_rgba(179,179,179,0.25),3px_8px_15px_0px_rgba(0,0,0,0.25)]'
      : themeMode === 'color'
        ? 'bg-[#a079ed] border-[#c4a8ff] shadow-[0px_4px_10px_-3px_rgba(179,179,179,0.25),3px_8px_15px_0px_rgba(0,0,0,0.25)]'
        : 'bg-[#4f4f4f] border-[#6a6a6a] shadow-[0px_4px_10px_-3px_rgba(179,179,179,0.25),3px_8px_15px_0px_rgba(0,0,0,0.25)]';
  const iconColor =
    isLight ? 'text-[#bdbdbd]' : themeMode === 'color' ? 'text-white/85' : 'text-[#a0a0a0]';
  const dayColor = onPhotoWatchface
    ? 'text-[#FFFFFF]'
    : isLight
      ? 'text-[#111]'
      : themeMode === 'color'
        ? 'text-white'
        : 'text-[#e8e8e8]';
  const dateColor = onPhotoWatchface
    ? 'text-white/55'
    : isLight
      ? 'text-[#bdbdbd]'
      : themeMode === 'color'
        ? 'text-white/55'
        : 'text-[#888]';

  return (
    <div className="content-stretch flex items-center p-4 sm:p-5 lg:p-6 relative shrink-0 min-w-0 flex-1 max-w-[321px]" data-name="Greeting">
      <div className="content-stretch flex gap-4 items-center relative shrink-0 min-w-0">
        <button
          type="button"
          aria-label="Menu"
          onClick={(e) => {
            e.stopPropagation();
            setMenuDotWaveKey((k) => k + 1);
            onMenuClick?.(e.currentTarget.getBoundingClientRect());
          }}
          className={`cursor-pointer overflow-clip relative rounded-[112px] shrink-0 size-12 transition-transform duration-200 hover:opacity-90 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            isLight || themeMode === 'color'
              ? 'focus-visible:ring-[#888] focus-visible:ring-offset-2'
              : 'focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]'
          } ${outerBg}`}
          data-name="Menu"
        >
          <div
            className={`-translate-x-1/2 -translate-y-1/2 absolute content-stretch flex flex-col items-center justify-center left-1/2 top-1/2 overflow-clip rounded-[88px] border border-solid size-[44px] ${innerKnob}`}
            data-name="MenuInner"
          >
            <div
              key={menuDotWaveKey}
              className={`flex h-6 shrink-0 items-center justify-center gap-[3px] ${iconColor} ${menuDotWaveKey > 0 ? 'menu-dots-wave-run' : ''}`}
              aria-hidden
            >
              <span className="menu-dot block size-[3px] shrink-0 rounded-full bg-current" />
              <span className="menu-dot block size-[3px] shrink-0 rounded-full bg-current" />
              <span className="menu-dot block size-[3px] shrink-0 rounded-full bg-current" />
            </div>
          </div>
          <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_2px_0px_12px_-3px_rgba(0,0,0,0.12),inset_0px_8px_9px_-7px_rgba(0,0,0,0.08)]" />
        </button>
        <p
          className={`font-['SF_Pro:Medium',sans-serif] font-medium leading-none relative shrink-0 whitespace-nowrap text-2xl sm:text-3xl lg:text-[40px] ${dayColor}`}
          style={{ fontVariationSettings: "'wdth' 100" }}
        >
          {weekday}
        </p>
        <p
          className={`font-['SF_Pro:Medium',sans-serif] font-medium leading-none relative shrink-0 whitespace-nowrap text-2xl sm:text-3xl lg:text-[40px] ${dateColor}`}
          style={{ fontVariationSettings: "'wdth' 100" }}
        >
          {dateStr}
        </p>
      </div>
    </div>
  );
}

const focusToggleEase = 'cubic-bezier(0.33, 1, 0.68, 1)';

// Focus toggle — one track; knob slides left↔right; label/track styles cross-fade (Figma 61:5696)
function FocusToggle({
  isOn,
  showSelector,
  themeMode,
}: {
  isOn?: boolean;
  showSelector?: boolean;
  themeMode?: 'light' | 'dark' | 'color';
}) {
  const isLight = themeMode === 'light' || themeMode === 'color';
  const trackOn = isOn || showSelector;

  return (
    <div
      className="relative flex h-12 w-fit min-w-0 items-center overflow-hidden rounded-full p-1 transition-[opacity,transform] duration-200 hover:opacity-95 active:scale-[0.98]"
      data-name="Toggle"
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 rounded-[112px] transition-[background-color,box-shadow] duration-300 ${
          trackOn
            ? 'bg-[#4f4f4f] shadow-[inset_2px_0px_12px_-3px_rgba(0,0,0,0.12),inset_0px_8px_9px_-7px_rgba(0,0,0,0.08)]'
            : themeMode === 'dark'
              ? 'bg-white/20 shadow-[inset_0_8px_9px_-7px_rgba(0,0,0,0.08),inset_2px_0_12px_-3px_rgba(0,0,0,0.12)]'
              : 'bg-[#e5e5e5] shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]'
        }`}
        style={{
          transitionTimingFunction: focusToggleEase,
        }}
      />
      <div
        className={`pointer-events-none absolute top-1 z-[2] size-10 rounded-[88px] bg-white transition-[left,box-shadow] duration-300 ${
          trackOn
            ? 'shadow-[0px_4px_8px_-3px_rgba(0,0,0,0.54)]'
            : isLight
              ? 'shadow-[0_2px_6px_-2px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.08)]'
              : 'shadow-[0_4px_8px_-3px_rgba(0,0,0,0.54)]'
        }`}
        style={{
          left: trackOn ? 'calc(100% - 44px)' : '4px',
          transitionTimingFunction: focusToggleEase,
        }}
        data-name="Knob"
      />
      <div
        className="relative z-[1] flex min-w-0 items-center"
        data-name="Lable"
        style={{
          paddingLeft: trackOn ? 8 : 44,
          paddingRight: trackOn ? 44 : 8,
          transition: `padding 300ms ${focusToggleEase}`,
        }}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <p
            className={`shrink-0 whitespace-nowrap transition-[color,font-size,font-weight,letter-spacing] duration-300 ${
              trackOn
                ? "font-['SF_Pro:Regular',sans-serif] font-normal text-[12px] leading-normal text-[#bdbdbd]"
                : `px-[6px] font-['SF_Pro:Medium',sans-serif] font-medium text-[13px] tracking-tight ${isLight ? 'text-[#5a5a5a]' : 'text-[#6d6d6d]'}`
            }`}
            style={{ fontVariationSettings: "'wdth' 100", transitionTimingFunction: focusToggleEase }}
          >
            Focus
          </p>
        </div>
      </div>
    </div>
  );
}

// Duration pills — Figma Zeno-Day 61:5821 / 61:5898 / 61:5903 (48px, border #BDBDBD, stacked N + min)
function FocusTimeSelection({
  onSelect,
  themeMode,
}: {
  onSelect: (minutes: number) => void;
  themeMode?: 'light' | 'dark' | 'color';
}) {
  const isLight = themeMode === 'light' || themeMode === 'color';
  const minutes = [15, 30, 45] as const;

  return (
    <div
      className="flex items-center justify-center gap-[10px]"
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
          className={`relative flex size-12 shrink-0 flex-col items-center justify-center gap-[2px] overflow-visible rounded-[112px] border border-solid text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-transform duration-200 hover:scale-[1.06] active:scale-[0.98] ${
            isLight
              ? 'border-[#bdbdbd] bg-transparent focus-visible:ring-[#888] focus-visible:ring-offset-2'
              : 'border-white/35 bg-transparent focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]'
          }`}
          style={{
            animation: `focusTimeRollOut 0.52s cubic-bezier(0.25, 0.85, 0.3, 1) ${i * 0.075}s both`,
          }}
          data-name={`TimeButton-${m}`}
        >
          <span
            className={`font-['SF_Pro:Regular',sans-serif] font-normal leading-none ${
              isLight ? 'text-[#111]' : 'text-[#e8e8e8]'
            } text-[14px]`}
            style={{ fontVariationSettings: "'wdth' 100" }}
          >
            {m}
          </span>
          <span
            className={`font-['SF_Pro:Regular',sans-serif] font-normal leading-none ${
              isLight ? 'text-[#111]' : 'text-[#e8e8e8]'
            } text-[12px]`}
            style={{ fontVariationSettings: "'wdth' 100" }}
          >
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
    <div className="content-stretch flex min-h-[120px] sm:min-h-[168px] lg:min-h-[208px] lg:w-[342px] items-start justify-center p-4 sm:p-5 lg:p-6 relative shrink-0 min-w-0 flex-1 max-w-[342px]" data-name="Timer">
      {/* Keep toggle centered; rollout timer pills to the right only */}
      <div className="relative flex w-full justify-center overflow-visible pt-0" data-name="ToggleWrapper">
        <div className="cursor-pointer shrink-0">
          <FocusToggle
            isOn={isTimerActive}
            showSelector={showTimerSelector}
            themeMode={themeMode}
          />
        </div>
        {showTimerSelector && !isTimerActive && (
          <div className="absolute left-1/2 ml-[58px] sm:ml-[62px] top-1/2 -translate-y-1/2">
            <FocusTimeSelection
              onSelect={(m) => onTimeButtonClick?.(m)}
              themeMode={themeMode}
            />
          </div>
        )}
      </div>
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
    <div className="content-stretch flex items-center justify-end p-4 sm:p-5 lg:p-6 relative shrink-0 min-w-0 flex-1 max-w-[321px]" data-name="Toggle">
      <ChangeTheme themeMode={themeMode} onToggle={onToggle} onOpenWatchfacePicker={onOpenWatchfacePicker} />
    </div>
  );
}

// Focus mode: showTimerSelector (picking duration) or timer running — hide profile, theme; keep timer row + clock
function Top({
  isTimerActive,
  showTimerSelector,
  themeMode,
  timeRemaining,
  onToggleDarkMode,
  onTimeButtonClick,
  onOpenWatchfacePicker,
  onMenuClick,
  soundPickerOpen,
  watchfacePickerOpen,
  watchfaceBackgroundIndex,
}: {
  isTimerActive?: boolean;
  showTimerSelector?: boolean;
  themeMode?: 'light' | 'dark' | 'color';
  timeRemaining?: number | null;
  onToggleDarkMode?: () => void;
  onTimeButtonClick?: (minutes: number) => void;
  onOpenWatchfacePicker?: () => void;
  onMenuClick?: (menuButtonRect: DOMRect) => void;
  soundPickerOpen?: boolean;
  watchfacePickerOpen?: boolean;
  watchfaceBackgroundIndex?: number;
}) {
  const isFocusMode = !!showTimerSelector || !!isTimerActive;
  const durationPickerOpen = !!showTimerSelector && !isTimerActive;
  const fadeClass = 'transition-opacity duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)]';
  const pickerDimsChrome = !!watchfacePickerOpen;
  const greetingStyle =
    pickerDimsChrome || isFocusMode
      ? { opacity: 0, pointerEvents: 'none' as const }
      : { opacity: 1, pointerEvents: 'auto' as const };
  const timerStyle = pickerDimsChrome
    ? { opacity: 0, pointerEvents: 'none' as const }
    : { opacity: 1, pointerEvents: 'auto' as const };
  const themeColumnStyle = soundPickerOpen
    ? { opacity: 0, pointerEvents: 'none' as const, visibility: 'hidden' as const }
    : isFocusMode
      ? { opacity: 0, pointerEvents: 'none' as const }
      : { opacity: 1, pointerEvents: 'auto' as const };
  const themeAbovePickerBackdrop =
    watchfacePickerOpen && !soundPickerOpen ? 'z-[55]' : '';
  return (
    <div
      className={`absolute content-stretch flex items-start justify-between left-0 top-0 w-full gap-2 sm:gap-4 min-h-0 pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] ${durationPickerOpen ? 'overflow-visible' : 'overflow-hidden'}`}
      data-name="Top"
    >
      <div
        className={fadeClass}
        style={greetingStyle}
        aria-hidden={pickerDimsChrome || isFocusMode}
      >
        <GreetingHeader
          themeMode={themeMode}
          watchfaceBackgroundIndex={watchfaceBackgroundIndex}
          onMenuClick={onMenuClick}
        />
      </div>

      {/* Invisible spacer so left/right columns stay at edges */}
      <div className="flex-1 min-w-0 shrink-0" aria-hidden />

      {/* Focus toggle always centered at top of screen */}
      <div
        className={`absolute left-1/2 top-0 -translate-x-1/2 pt-[env(safe-area-inset-top)] ${fadeClass}`}
        style={timerStyle}
        data-name="TimerSwitchCenter"
        aria-hidden={pickerDimsChrome}
      >
        <TimerSwitch
          isTimerActive={isTimerActive}
          showTimerSelector={showTimerSelector}
          themeMode={themeMode}
          timeRemaining={timeRemaining}
          onTimeButtonClick={onTimeButtonClick}
        />
      </div>

      {/* Theme control: stays visible and above watchface backdrop (z-40) while picker open; hidden for sound sidebar / focus mode. */}
      <div
        className={`content-stretch flex items-center justify-end relative shrink-0 min-w-0 flex-1 max-w-[321px] ${fadeClass} ${themeAbovePickerBackdrop}`}
        style={themeColumnStyle}
        aria-hidden={isFocusMode}
      >
        <ThemeToggle themeMode={themeMode} onToggle={onToggleDarkMode} onOpenWatchfacePicker={onOpenWatchfacePicker} />
      </div>
    </div>
  );
}

function MusicPickerButton({
  onClick,
  themeMode,
}: {
  onClick?: (buttonRect: DOMRect) => void;
  /** Same token as Top / Push (watchface picker): use `ui` from Home so photo watchfaces match. */
  themeMode?: 'light' | 'dark' | 'color';
}) {
  // Pixel-identical stack to Push + ChangeTheme (watchface picker): 48 outer, 44 inner, same radii/shadows.
  const outerTrack =
    themeMode === 'dark' ? 'bg-[#272727]' : 'bg-[#dcdcdc]';
  const innerKnob =
    themeMode === 'light'
      ? 'bg-white border-white shadow-[0px_4px_8px_-3px_rgba(0,0,0,0.54),3px_28px_27px_5px_rgba(0,0,0,0.22)]'
      : themeMode === 'color'
        ? 'bg-[#a079ed] border-[#c4a8ff] shadow-[0px_4px_8px_-3px_rgba(0,0,0,0.54),3px_28px_27px_5px_rgba(0,0,0,0.22)]'
        : 'bg-[#4f4f4f] border-[#6a6a6a] shadow-[0px_4px_8px_-3px_rgba(0,0,0,0.54),3px_28px_27px_5px_rgba(0,0,0,0.22)]';
  const iconClass =
    themeMode === 'light'
      ? 'text-[#5a5a5a]'
      : themeMode === 'color'
        ? 'text-white/90'
        : 'text-[#c0c0c0]';
  const focusRing =
    themeMode === 'light'
      ? 'focus-visible:ring-[#888] focus-visible:ring-offset-2'
      : 'focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]';

  return (
    <button
      type="button"
      onClick={(e) => onClick?.(e.currentTarget.getBoundingClientRect())}
      aria-label="Pick music or sound"
      className={`cursor-pointer relative overflow-clip shrink-0 size-[48px] rounded-[112px] transition-all duration-500 hover:opacity-80 active:opacity-90 focus:outline-none focus-visible:ring-2 ${focusRing} ${outerTrack}`}
      data-name="MusicPicker"
    >
      <span
        className={`-translate-x-1/2 -translate-y-1/2 absolute left-1/2 top-1/2 flex size-[44px] items-center justify-center overflow-clip rounded-[88px] border border-solid transition-all duration-500 ${innerKnob}`}
        aria-hidden
      >
        {/* CD Out / Eject icon — sized for 44px inner knob (Push has no icon) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`size-[22px] ${iconClass}`}
        >
          <path d="M12 7l-6 7h12L12 7z" />
          <line x1="5" y1="18" x2="19" y2="18" />
        </svg>
      </span>
      <span
        className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_2px_0px_12px_-3px_rgba(0,0,0,0.12),inset_0px_8px_9px_-7px_rgba(0,0,0,0.08)]"
        aria-hidden
      />
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

// Ticker lines — Figma 61-3739 style, every 5 minutes (12 markers), 24px long, 12px side padding
const TICKER_COLOR_FIGMA = 'rgb(158, 159, 166)';
const CLOCK_SIZE_PX = 509;

function ClockMarkers({ themeMode }: { themeMode?: 'light' | 'dark' | 'color' }) {
  // Watchface 0: original gray markers (61-3739). Watchphases 1–5: solid white (61:1208)
  const strokeColor =
    themeMode === 'dark' || themeMode === 'color' ? 'rgb(255,255,255)' : TICKER_COLOR_FIGMA;
  const rotations = Array.from({ length: 12 }, (_, i) => -90 + i * 30); // 0, 5, 10 ... 55 min
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

function Clock({
  themeMode,
  isTimerActive,
  timeRemaining,
  onClockClick,
  draggedMinutes,
  onMinuteHandDrag,
  onMinuteHandDragEnd,
}: {
  themeMode?: 'light' | 'dark' | 'color';
  isTimerActive?: boolean;
  timeRemaining?: number | null;
  onClockClick?: () => void;
  draggedMinutes?: number | null;
  onMinuteHandDrag?: (minutes: number) => void;
  onMinuteHandDragEnd?: (minutes: number) => void;
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
    pointerStartRef.current = null;

    if (isDragging) {
      e.preventDefault();
      setIsDragging(false);
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      onMinuteHandDragEnd?.(calculateMinutes(e));
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
      </div>
    </div>
  );
}

// Digital countdown shown below clock in focus mode (e.g. 00:42)
function FocusDigitalTimer({ timeRemaining, themeMode }: { timeRemaining: number; themeMode?: 'light' | 'dark' | 'color' }) {
  const totalSec = Math.max(0, Math.ceil(timeRemaining / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const str = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  const isLight = themeMode === 'light' || themeMode === 'color';
  return (
    <div
      className="absolute left-1/2 top-[calc(50%+min(200px,42vw))] -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none select-none"
      data-name="FocusDigitalTimer"
    >
      <span
        className={`font-mono text-xl sm:text-2xl font-medium tabular-nums tracking-wide transition-colors duration-500 ${
          isLight ? 'text-[#5a5a5a]' : 'text-white/90'
        }`}
      >
        {str}
      </span>
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

function Tasks({
  className,
  themeMode,
  fullWidth = false,
}: {
  className?: string;
  themeMode?: 'light' | 'dark' | 'color';
  fullWidth?: boolean;
}) {
  const isBright = themeMode === 'light';
  return (
    <div
      className={
        className ||
        `content-stretch flex flex-col relative rounded-[24px] w-full min-h-[178px] min-w-0 transition-all duration-500 ${fullWidth ? '' : 'max-w-[265px]'}`
      }
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
          className={`font-['SF_Pro:Medium',sans-serif] font-medium tracking-wide text-[11px] sm:text-[14px] relative shrink-0 transition-colors duration-500 ${isBright ? 'text-[#8a8a8a]' : 'text-[#FFFFFF]'}`}
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

function MobileTasksCard() {
  return (
    <div className="w-full px-4 pb-6 pt-2" data-name="MobileTasksContainer">
      <div className="content-stretch flex flex-col items-start relative w-full min-w-0">
        <Tasks themeMode="light" fullWidth />
      </div>
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
  showTimerSelector,
  themeMode,
  pickerChromeTheme,
  songName,
  currentTime,
  duration,
  onSeek,
  albumArtUrl,
  audioPlayerRef,
  onOpenSoundPicker,
  onCloseSoundPicker,
  soundPickerOpen,
}: {
  isPlaying?: boolean;
  volume?: number;
  onVolumePlayPause?: () => void;
  onVolumeChange?: (volume: number) => void;
  onVolumeLongPress?: () => void;
  isTimerActive?: boolean;
  showTimerSelector?: boolean;
  themeMode?: 'light' | 'dark' | 'color';
  /** Matches Top / watchface Push (`ui`); defaults to themeMode when omitted. */
  pickerChromeTheme?: 'light' | 'dark' | 'color';
  songName?: string;
  currentTime?: number;
  duration?: number;
  onSeek?: (progress: number) => void;
  albumArtUrl?: string;
  audioPlayerRef?: React.RefObject<AudioPlayerRef>;
  onOpenSoundPicker?: (buttonRect: DOMRect) => void;
  onCloseSoundPicker?: () => void;
  soundPickerOpen?: boolean;
}) {
  const isFocusMode = !!showTimerSelector || !!isTimerActive;
  const musicPickerChrome = pickerChromeTheme ?? themeMode;
  return (
    <div 
      className="absolute bottom-0 left-0 w-full flex flex-row items-end justify-between pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] transition-opacity duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)]"
      style={{ 
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        pointerEvents: 'auto'
      }}
      data-name="Bottom Bar"
    >
      {/* Tasks - Left: faded in focus mode */}
      <div className="flex-1 min-w-0 flex justify-start pointer-events-auto transition-opacity duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)]" style={{ opacity: isFocusMode ? 0 : 1, pointerEvents: isFocusMode ? 'none' : 'auto' }}>
        <TasksContainer themeMode={themeMode} />
      </div>
      
      {/* Audio Player - Center: remains visible in focus mode */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-0 flex justify-center pointer-events-auto transition-opacity duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)]" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))', opacity: 1, pointerEvents: 'auto' }}>
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
      
      {/* Bottom right: CD (open panel) when sidebar closed; faded in focus mode */}
      <div className="flex-1 min-w-0 flex justify-end items-end p-4 sm:p-5 lg:p-6 pointer-events-auto transition-opacity duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)]" style={{ opacity: isFocusMode ? 0 : 1, pointerEvents: isFocusMode ? 'none' : 'auto' }}>
        <MusicPickerButton onClick={onOpenSoundPicker} themeMode={musicPickerChrome} />
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
  onMenuClick,
  onOpenSoundPicker,
  onCloseSoundPicker,
  showWatchfacePicker,
  showSoundPicker,
  watchfaceBackgroundIndex,
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
  /** UI theme: bright (light) for watchface 1–5, same as themeMode for watchface 0 */
  uiTheme?: 'light' | 'dark' | 'color';
  onToggleDarkMode?: () => void;
  songName?: string;
  currentTime?: number;
  duration?: number;
  onSeek?: (progress: number) => void;
  albumArtUrl?: string;
  audioPlayerRef?: React.RefObject<AudioPlayerRef>;
  onMenuClick?: (menuButtonRect: DOMRect) => void;
  onOpenSoundPicker?: (buttonRect: DOMRect) => void;
  onCloseSoundPicker?: () => void;
  showWatchfacePicker?: boolean;
  showSoundPicker?: boolean;
  /** Matches App effective background index (0 = default flat bg, 1+ = image) */
  watchfaceBackgroundIndex?: number;
}) {
  const ui = uiTheme ?? themeMode;
  const panelOpen = !!showWatchfacePicker;
  const uiFaded = panelOpen
    ? 'opacity-0 pointer-events-none'
    : 'opacity-100 pointer-events-auto';
  const uiTransition = 'transition-opacity duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]';
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(max-width: 768px)');
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  if (isMobile) {
    return (
      <div className="bg-transparent relative w-full h-full min-h-screen overflow-y-auto" data-name="HomeMobile">
        <div className="w-full min-h-screen flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
          <div className="w-full shrink-0">
            <GreetingHeader
              themeMode="light"
              watchfaceBackgroundIndex={0}
              onMenuClick={onMenuClick}
            />
          </div>

          <div className="relative shrink-0 h-[320px]" data-name="ClockMobile">
            <Clock
              themeMode="light"
              isTimerActive={false}
              timeRemaining={null}
              onClockClick={onClockClick}
            />
          </div>

          <div className="shrink-0 mt-3">
            <MobileTasksCard />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent overflow-clip relative w-full h-full min-h-screen" data-name="Home">
      <div className={`absolute left-0 top-0 w-full ${uiTransition}`}>
        <Top
          isTimerActive={isTimerActive}
          showTimerSelector={showTimerSelector}
          themeMode={ui}
          timeRemaining={timeRemaining}
          onToggleDarkMode={onToggleDarkMode}
          onTimeButtonClick={onTimeButtonClick}
          onOpenWatchfacePicker={onOpenWatchfacePicker}
          onMenuClick={onMenuClick}
          soundPickerOpen={showSoundPicker}
          watchfacePickerOpen={panelOpen}
          watchfaceBackgroundIndex={watchfaceBackgroundIndex}
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
      />
      {isTimerActive && timeRemaining != null && timeRemaining > 0 && (
        <FocusDigitalTimer timeRemaining={timeRemaining} themeMode={themeMode} />
      )}
      <div className={`absolute bottom-0 left-0 w-full ${uiFaded} ${uiTransition}`} aria-hidden={panelOpen}>
        <BottomBar 
          isPlaying={isPlaying}
          volume={volume}
          onVolumePlayPause={onVolumePlayPause}
          onVolumeChange={onVolumeChange}
          onVolumeLongPress={onVolumeLongPress}
          isTimerActive={isTimerActive}
          showTimerSelector={showTimerSelector}
          themeMode={themeMode}
          pickerChromeTheme={ui}
          songName={songName}
          currentTime={currentTime}
          duration={duration}
          onSeek={onSeek}
          albumArtUrl={albumArtUrl}
          audioPlayerRef={audioPlayerRef}
          onOpenSoundPicker={onOpenSoundPicker}
          onCloseSoundPicker={onCloseSoundPicker}
          soundPickerOpen={showSoundPicker}
        />
      </div>
    </div>
  );
}
