import { useRef, useEffect, useState } from 'react';
import { hapticSounds } from '@/app/hooks/useHapticSound';
import { useAudioAnalyzer } from '@/app/hooks/useAudioAnalyzer';
import { AudioPlayerRef } from '@/app/components/AudioPlayer';

interface AudioPlayerUIProps {
  songName: string;
  currentTime: number; // in seconds
  duration: number; // in seconds
  isPlaying: boolean;
  onSeek: (progress: number) => void;
  onPlayPause: () => void;
  albumArtUrl?: string;
  themeMode?: 'light' | 'dark' | 'color';
  audioPlayerRef?: React.RefObject<AudioPlayerRef>;
}

// Default waveform bar heights (fallback when audio analysis is not available)
const defaultHeights = [6, 17, 14, 20, 28, 6, 14, 6, 17, 14, 20, 6, 14, 28, 6, 17, 14, 20, 28, 6, 14, 6, 17, 14, 20, 28, 6, 14, 6, 17, 14, 20, 6, 6, 17, 14, 20, 6, 6, 20, 6];
const BAR_COUNT = 41;
const MIN_HEIGHT = 6;
const MAX_HEIGHT = 28;

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function VinylArtwork({ 
  albumArtUrl, 
  themeMode, 
  onPlayPause,
  onLongPress,
  isPlaying
}: { 
  albumArtUrl?: string; 
  themeMode?: 'light' | 'dark' | 'color';
  onPlayPause?: () => void;
  onLongPress?: () => void;
  isPlaying?: boolean;
}) {
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasMoved = useRef(false);
  const longPressTriggered = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger click if it was a long press
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    e.stopPropagation();
    hapticSounds.click();
    if (onPlayPause) {
      onPlayPause();
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    hasMoved.current = false;
    longPressTriggered.current = false;
    startPos.current = { x: e.clientX, y: e.clientY };
    
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        if (!hasMoved.current && onLongPress) {
          longPressTriggered.current = true;
          e.stopPropagation();
          hapticSounds.click();
          onLongPress();
        }
      }, 800); // 800ms for long press
    }
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
  };

  const handlePointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const isDark = themeMode === 'dark' || themeMode === 'color';
  const trackShadow = isDark
    ? '3px 8px 15px rgba(0,0,0,0.25), 0 4px 10px -3px rgba(179,179,179,0.25)'
    : '0px 4px 8px 0px rgba(0,0,0,0.54), 3px 28px 27px 0px rgba(0,0,0,0.22)';

  return (
    <div 
      className="relative shrink-0 size-14 sm:size-16 lg:size-[72px] rounded-full overflow-hidden cursor-pointer transition-transform hover:scale-105 active:scale-95 flex-shrink-0"
      data-name="Track"
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ borderRadius: '50%', touchAction: 'manipulation', boxShadow: trackShadow }}
    >
      <div
        className="size-full"
        style={{
          animation: isPlaying ? 'vinyl-rotate 8s linear infinite' : 'none',
          transformOrigin: 'center center',
        }}
      >
        {albumArtUrl ? (
          <img 
            alt="Album artwork" 
            className="block size-full object-cover" 
            src={albumArtUrl}
          />
        ) : (
          <div 
            className={`size-full transition-colors duration-500 ${
              themeMode === 'light' ? 'bg-gradient-to-br from-[#333] to-[#111]' : 'bg-[#d9d9d9]'
            }`}
          />
        )}
      </div>
      {/* Center hole overlay: dark = white with inner shadows per Figma */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[12px] pointer-events-none z-10">
        {isDark ? (
          <div
            className="size-full rounded-full bg-white"
            style={{
              boxShadow: 'inset 0 4px 4px rgba(0,0,0,0.1), inset 1px -3px 4px rgba(0,0,0,0.2)',
            }}
          />
        ) : (
          <svg viewBox="0 0 12 12" className="size-full">
            <circle cx="6" cy="6" r="5.5" fill="none" stroke="#ededed" strokeWidth="1" />
            <circle cx="6" cy="6" r="3" fill="#ededed" />
          </svg>
        )}
      </div>
      <style>{`
        @keyframes vinyl-rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

function WaveformBar({ 
  height, 
  isPlayed, 
  themeMode 
}: { 
  height: number; 
  isPlayed: boolean; 
  themeMode?: 'light' | 'dark' | 'color';
}) {
  // Clamp height to valid range
  const clampedHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, height));
  
  const isDark = themeMode === 'dark' || themeMode === 'color';
  if (isPlayed) {
    return (
      <div 
        className="shrink-0 w-px transition-all duration-[50ms] ease-out" 
        style={{ 
          height: `${clampedHeight}px`,
          backgroundColor: isDark ? '#fff' : undefined,
          backgroundImage: !isDark ? "linear-gradient(to bottom, rgb(102, 102, 102), rgb(0, 0, 0))" : undefined,
          willChange: 'height'
        }} 
      />
    );
  }
  return (
    <div 
      className={`shrink-0 w-px transition-all duration-[50ms] ease-out ${
        themeMode === 'light' ? 'bg-[#bdbdbd] opacity-30' : 'bg-[#bdbdbd]'
      }`}
      style={{ 
        height: `${clampedHeight}px`,
        willChange: 'height'
      }}
    />
  );
}

export function AudioPlayerUI({
  songName,
  currentTime,
  duration,
  isPlaying,
  onSeek,
  onPlayPause,
  albumArtUrl,
  themeMode = 'light',
  onLongPress,
  audioPlayerRef
}: AudioPlayerUIProps & { onLongPress?: () => void }) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [sourceNode, setSourceNode] = useState<AudioNode | null>(null);
  
  // Get audio sources from audioPlayerRef - poll more frequently to catch audio element
  useEffect(() => {
    if (!audioPlayerRef?.current) {
      setAudioElement(null);
      setAudioContext(null);
      setSourceNode(null);
      return;
    }

    const updateAudioSources = () => {
      const element = audioPlayerRef?.current?.getAudioElement();
      const context = audioPlayerRef?.current?.getAudioContext();
      const source = audioPlayerRef?.current?.getSourceNode();
      
      setAudioElement(element);
      setAudioContext(context);
      setSourceNode(source);
    };

    // Initial check
    updateAudioSources();

    // Poll periodically to catch audio element when it becomes available
    const interval = setInterval(updateAudioSources, 100);
    
    return () => clearInterval(interval);
  }, [audioPlayerRef, isPlaying]);

  // Use audio analyzer hook to get real-time frequency data
  const frequencyData = useAudioAnalyzer({
    audioElement,
    audioContext,
    sourceNode,
    isPlaying,
    barCount: BAR_COUNT,
  });

  // Calculate bar heights from frequency data or use defaults
  const hasAudioData = frequencyData.length === BAR_COUNT && isPlaying && frequencyData.some(f => f > 0.01);
  
  // Debug: Log when we have audio data
  useEffect(() => {
    if (hasAudioData && isPlaying) {
      const maxFreq = Math.max(...frequencyData);
      const avgFreq = frequencyData.reduce((a, b) => a + b, 0) / frequencyData.length;
      // Only log occasionally to avoid spam
      if (Math.random() < 0.01) {
        console.log('Audio analyzer active:', { maxFreq: maxFreq.toFixed(3), avgFreq: avgFreq.toFixed(3), hasElement: !!audioElement, hasContext: !!audioContext });
      }
    }
  }, [hasAudioData, frequencyData, isPlaying, audioElement, audioContext]);

  const barHeights = hasAudioData
    ? frequencyData.map(freq => {
        // Map normalized frequency (0-1) to height range (MIN_HEIGHT to MAX_HEIGHT)
        // Add minimum threshold to ensure bars are visible even for quiet audio
        const normalized = Math.max(0.15, freq); // Minimum 15% height for visibility
        return MIN_HEIGHT + (normalized * (MAX_HEIGHT - MIN_HEIGHT));
      })
    : defaultHeights;
  
  const progress = duration > 0 ? currentTime / duration : 0;
  const playedBars = Math.floor(progress * BAR_COUNT);
  
  const handleWaveformClick = (e: React.MouseEvent) => {
    if (!waveformRef.current) return;
    
    const rect = waveformRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = Math.max(0, Math.min(1, clickX / rect.width));
    
    hapticSounds.click();
    onSeek(newProgress);
  };

  const handleWaveformDrag = (e: React.PointerEvent) => {
    if (!waveformRef.current) return;
    if (e.buttons !== 1) return; // Only handle left mouse button drag
    
    const rect = waveformRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = Math.max(0, Math.min(1, clickX / rect.width));
    
    onSeek(newProgress);
  };

  return (
    <div 
      className="content-stretch flex gap-2 sm:gap-2.5 items-end relative shrink-0 w-full min-w-0 max-w-full"
      data-name="Player"
    >
      {/* Vinyl Album Art - Clickable for play/pause, long press for sound selection */}
      <VinylArtwork 
        albumArtUrl={albumArtUrl} 
        themeMode={themeMode} 
        onPlayPause={onPlayPause}
        onLongPress={onLongPress}
        isPlaying={isPlaying}
      />
      
      {/* Song Info and Waveform */}
      <div 
        className="content-stretch flex flex-col gap-2 sm:gap-2.5 items-start justify-end relative shrink-0 flex-1 min-w-0 w-full max-w-[265px] sm:max-w-[280px]"
        data-name="Song"
      >
        {/* Song Name and Duration */}
        <div 
          className="content-stretch flex items-start justify-between leading-[normal] relative shrink-0 text-center w-full"
          data-name="Song"
        >
          <p 
            className={`font-['SF_Pro:Medium',sans-serif] font-[510] relative shrink-0 text-xs sm:text-sm transition-colors duration-500 truncate max-w-full ${themeMode === 'light' ? 'text-[#111]' : 'text-white'}`}
            style={{ fontVariationSettings: "'wdth' 100" }}
          >
            {songName}
          </p>
          <p 
            className={`font-['SF_Pro:Regular',sans-serif] font-normal relative shrink-0 text-[10px] sm:text-xs transition-colors duration-500 ${themeMode === 'light' ? 'text-[#bdbdbd]' : 'text-white'}`}
            style={{ fontVariationSettings: "'wdth' 100" }}
          >
            {duration > 0 ? `${formatTime(currentTime)} / ${formatTime(duration)}` : formatTime(currentTime)}
          </p>
        </div>
        
        {/* Waveform — bright (watchface-0): solid #e4e4e4. Dark/color: frosted glass */}
        <div 
          ref={waveformRef}
          onClick={handleWaveformClick}
          onPointerMove={handleWaveformDrag}
          className={`content-stretch flex gap-1 sm:gap-[4px] h-10 sm:h-12 items-center overflow-clip px-2 sm:px-3 py-1 sm:py-[4px] relative rounded-full shrink-0 w-full min-w-0 cursor-pointer transition-all duration-500 ${themeMode === 'light' ? 'bg-[#e4e4e4]' : 'border border-white/25'}`}
          data-name="Audiowave"
          style={ 
            themeMode === 'light'
              ? { touchAction: 'none' as const }
              : { 
                  touchAction: 'none' as const,
                  background: 'rgba(255, 255, 255, 0.45)',
                  backdropFilter: 'blur(40px)',
                  WebkitBackdropFilter: 'blur(40px)',
                }
          }
        >
          {/* Waveform bars */}
          <div className="content-stretch flex gap-[4px] items-center relative flex-1">
            {barHeights.map((height, index) => (
              <WaveformBar 
                key={index}
                height={height}
                isPlayed={index < playedBars}
                themeMode={themeMode}
              />
            ))}
          </div>
          {themeMode === 'light' && (
            <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_2px_0px_12px_-3px_rgba(0,0,0,0.12),inset_0px_8px_9px_-7px_rgba(0,0,0,0.08)]" />
          )}
        </div>
      </div>
    </div>
  );
}
