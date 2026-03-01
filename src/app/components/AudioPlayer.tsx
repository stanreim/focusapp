import { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import ReactPlayer from 'react-player';

interface AudioPlayerProps {
  src: string | null;
  isPlaying: boolean;
  moodKey: number;
  volume?: number;
  onProgress?: (currentTime: number) => void;
  onDuration?: (duration: number) => void;
}

export interface AudioPlayerRef {
  seek: (progress: number) => void;
  getAudioElement: () => HTMLAudioElement | null;
  getAudioContext: () => AudioContext | null;
  getSourceNode: () => AudioNode | null;
}

// Check if URL is a streaming URL that needs ReactPlayer
// Note: react-player v3 only supports YouTube, Vimeo, Wistia, Mux, and direct files
// Spotify, SoundCloud, Facebook, Twitch, DailyMotion, Mixcloud are NOT supported
const isStreamingUrl = (url: string): boolean => {
  if (!url) return false;
  // Only include platforms actually supported by react-player v3
  const streamingPatterns = [
    /youtube\.com/i,
    /youtu\.be/i,
    /vimeo\.com/i,
    /wistia\.com/i,
    /mux\.com/i,
  ];
  return streamingPatterns.some(pattern => pattern.test(url));
};

export const AudioPlayer = forwardRef<AudioPlayerRef, AudioPlayerProps>(function AudioPlayer(
  { src, isPlaying, moodKey, volume: externalVolume = 0.7, onProgress, onDuration },
  ref
) {
  // Web Audio API refs (for generated audio)
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const gainNodesRef = useRef<GainNode[]>([]);
  const masterGainRef = useRef<GainNode | null>(null);
  
  // Native audio element ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioReady, setAudioReady] = useState(false);
  
  // ReactPlayer ref for streaming URLs
  const reactPlayerRef = useRef<ReactPlayer | null>(null);
  
  // State to handle unmuting after autoplay starts (browsers block autoplay with sound)
  const [isMutedForAutoplay, setIsMutedForAutoplay] = useState(true);
  // Track if video has started playing at least once
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  
  // Compute directly instead of using state to avoid race conditions
  const useReactPlayer = src ? isStreamingUrl(src) : false;
  
  // Reset states when source changes
  useEffect(() => {
    if (useReactPlayer) {
      setIsMutedForAutoplay(true);
      setHasStartedPlaying(false);
    }
  }, [src, useReactPlayer]);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    seek: (progress: number) => {
      if (useReactPlayer && reactPlayerRef.current) {
        reactPlayerRef.current.seekTo(progress, 'fraction');
      } else if (audioRef.current && audioRef.current.duration) {
        audioRef.current.currentTime = progress * audioRef.current.duration;
      }
    },
    getAudioElement: () => audioRef.current,
    getAudioContext: () => {
      return src === null ? audioContextRef.current : null;
    },
    getSourceNode: () => {
      return src === null ? masterGainRef.current : null;
    },
  }), [src, useReactPlayer]);

  // Create audio element when src changes (only for non-streaming URLs)
  useEffect(() => {
    // Skip if using ReactPlayer for streaming URLs
    if (src && isStreamingUrl(src)) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      setAudioReady(false);
      return;
    }
    
    if (!src) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      setAudioReady(false);
      return;
    }

    // Create new audio element for direct audio files
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = externalVolume;
    audio.preload = 'auto';
    
    audio.onloadedmetadata = () => {
      setAudioReady(true);
      if (onDuration) {
        onDuration(audio.duration);
      }
    };
    
    audio.ontimeupdate = () => {
      if (onProgress) {
        onProgress(audio.currentTime);
      }
    };
    
    audio.onerror = (e) => {
      console.error('Audio error:', e, 'src:', src);
      setAudioReady(false);
    };

    audio.onplay = () => {
      console.log('Audio started playing:', src);
    };

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [src]);

  // Handle play/pause for native audio (skip if using ReactPlayer)
  useEffect(() => {
    if (useReactPlayer || !audioRef.current || !src) return;

    if (isPlaying) {
      audioRef.current.volume = externalVolume;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => {
          if (e.name !== 'AbortError') {
            console.warn('Audio play failed:', e);
          }
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, src, audioReady, useReactPlayer]);

  // Handle volume changes for native audio
  useEffect(() => {
    if (audioRef.current && !useReactPlayer) {
      audioRef.current.volume = externalVolume;
    }
  }, [externalVolume, useReactPlayer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      
      oscillatorsRef.current.forEach(osc => {
        try {
          osc.stop();
        } catch (e) {
          // Ignore if already stopped
        }
      });
    };
  }, []);

  // For generated audio playback - initialize audio context
  useEffect(() => {
    if (src !== null) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      masterGainRef.current = audioContextRef.current.createGain();
      masterGainRef.current.connect(audioContextRef.current.destination);
      masterGainRef.current.gain.value = 0;
    }
  }, [src]);

  // For generated audio playback - create oscillators
  useEffect(() => {
    if (src !== null) return;
    if (!audioContextRef.current || !masterGainRef.current) return;

    // Stop existing oscillators
    oscillatorsRef.current.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Ignore if already stopped
      }
    });
    oscillatorsRef.current = [];
    gainNodesRef.current = [];

    // Define mood frequencies and characteristics
    const moodConfigs = [
      // Mood 0: Blue ocean calm - deep, flowing tones
      [
        { freq: 110, gain: 0.15, detune: 0 },
        { freq: 165, gain: 0.12, detune: 2 },
        { freq: 220, gain: 0.08, detune: -2 },
      ],
      // Mood 1: Green forest - earthy, balanced
      [
        { freq: 130, gain: 0.14, detune: 0 },
        { freq: 195, gain: 0.11, detune: 3 },
        { freq: 260, gain: 0.07, detune: -3 },
      ],
      // Mood 2: Red sunset warmth - rich, warm tones
      [
        { freq: 98, gain: 0.16, detune: 0 },
        { freq: 147, gain: 0.13, detune: -2 },
        { freq: 196, gain: 0.09, detune: 2 },
      ],
      // Mood 3: Purple night - mysterious, deeper
      [
        { freq: 87, gain: 0.17, detune: 0 },
        { freq: 130, gain: 0.14, detune: 4 },
        { freq: 174, gain: 0.10, detune: -4 },
      ],
    ];

    const config = moodConfigs[moodKey];

    // Create oscillators for current mood
    config.forEach(({ freq, gain, detune }) => {
      const osc = audioContextRef.current!.createOscillator();
      const gainNode = audioContextRef.current!.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.detune.value = detune;

      gainNode.gain.value = 0;
      osc.connect(gainNode);
      gainNode.connect(masterGainRef.current!);

      osc.start();

      oscillatorsRef.current.push(osc);
      gainNodesRef.current.push(gainNode);

      // Fade in individual oscillator
      if (isPlaying) {
        gainNode.gain.linearRampToValueAtTime(
          gain,
          audioContextRef.current!.currentTime + 2
        );
      }
    });
    
    // Cleanup function: stop oscillators when this effect re-runs
    return () => {
        oscillatorsRef.current.forEach(osc => {
            try { osc.stop(); } catch(e) {}
        });
        oscillatorsRef.current = [];
    };
  }, [moodKey, src, isPlaying]);

  // For generated audio playback - handle play/pause
  useEffect(() => {
    if (src !== null) return;
    if (!audioContextRef.current || !masterGainRef.current) return;

    const currentTime = audioContextRef.current.currentTime;

    if (isPlaying) {
      // Resume audio context if suspended
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      // Fade in master gain
      masterGainRef.current.gain.cancelScheduledValues(currentTime);
      masterGainRef.current.gain.setValueAtTime(
        masterGainRef.current.gain.value,
        currentTime
      );
      masterGainRef.current.gain.linearRampToValueAtTime(1, currentTime + 2);
    } else {
      // Fade out master gain
      masterGainRef.current.gain.cancelScheduledValues(currentTime);
      masterGainRef.current.gain.setValueAtTime(
        masterGainRef.current.gain.value,
        currentTime
      );
      masterGainRef.current.gain.linearRampToValueAtTime(0, currentTime + 2);
    }
  }, [isPlaying, src]);

  // ReactPlayer handlers
  const handleReactPlayerProgress = (state: { playedSeconds: number }) => {
    if (onProgress) {
      onProgress(state.playedSeconds);
    }
  };

  const handleReactPlayerDuration = (duration: number) => {
    if (onDuration) {
      onDuration(duration);
    }
  };

  // Handle when playing starts
  const handleReactPlayerPlay = () => {
    console.log('ReactPlayer started playing:', src);
    setHasStartedPlaying(true);
    // Unmute after autoplay starts
    setTimeout(() => {
      setIsMutedForAutoplay(false);
    }, 300);
  };

  // Render ReactPlayer for streaming URLs - visible player in corner for YouTube
  if (useReactPlayer && src) {
    console.log('Rendering ReactPlayer with:', { src, isPlaying, volume: externalVolume, muted: isMutedForAutoplay });
    return (
      <div 
        style={{ 
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '240px',
          height: '135px',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          zIndex: 9999,
          background: '#000',
        }}
      >
        <ReactPlayer
          ref={reactPlayerRef}
          url={src}
          playing={isPlaying}
          loop={true}
          volume={externalVolume}
          muted={isMutedForAutoplay}
          controls={true}
          onProgress={handleReactPlayerProgress}
          onDuration={handleReactPlayerDuration}
          onError={(e, data) => console.error('ReactPlayer error:', e, data)}
          onReady={() => {
            console.log('ReactPlayer ready:', src);
          }}
          onPlay={handleReactPlayerPlay}
          onPause={() => console.log('ReactPlayer paused:', src)}
          onBuffer={() => console.log('ReactPlayer buffering:', src)}
          onBufferEnd={() => console.log('ReactPlayer buffer ended:', src)}
          onStart={() => console.log('ReactPlayer onStart:', src)}
          width="100%"
          height="100%"
        />
        {/* Overlay prompting user to click if video hasn't started */}
        {!hasStartedPlaying && isPlaying && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              fontSize: '12px',
              fontWeight: 500,
              textAlign: 'center',
              padding: '8px',
              pointerEvents: 'none',
            }}
          >
            Click video to start audio
          </div>
        )}
      </div>
    );
  }

  return null;
})
