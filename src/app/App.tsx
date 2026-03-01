import { useState, useEffect, useRef } from 'react';
import { AudioPlayer, AudioPlayerRef } from '@/app/components/AudioPlayer';
import { HomeWrapper } from '@/app/components/HomeWrapper';
import { SoundPickerModal } from '@/app/components/SoundPickerModal';
import { WatchfacePickerPanel } from '@/app/components/WatchfacePickerPanel';
import BlurTextAnimation from '@/components/ui/blur-text-animation';
import Home from '@/imports/Home-7-86';
import { hapticSounds } from '@/app/hooks/useHapticSound';

interface Song {
  id: string;
  name: string;
  duration: string;
  audioUrl: string;
  imageUrl?: string;
  isCustom?: boolean;
}

// Build ID – visible on the page so you can confirm the deployed version
const BUILD_ID = '2.0';

// Backgrounds use same numeric indices as watchfaces: assets/Backgrounds/Background-0.png … Background-4.png
const WATCHFACE_BACKGROUND_IDS = [0, 1, 2, 3, 4] as const;
const BACKGROUNDS: (string | null)[] = WATCHFACE_BACKGROUND_IDS.map((i) =>
  i === 0 ? null : `/assets/Backgrounds/Background-${i}.png`
);

// Watchface index (0–4) → theme. Hover previews and selection apply this theme to the watch and UI.
const WATCHFACE_THEMES: ('light' | 'dark' | 'color')[] = [
  'light',  // 0
  'dark',   // 1
  'color',  // 2
  'dark',   // 3
  'color',  // 4
];

export default function App() {
  useEffect(() => {
    document.title = `Zeno — v${BUILD_ID}`;
  }, []);

  // Loading State
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMood, setCurrentMood] = useState(0); // 0-3
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'color'>(() => {
    try {
      const saved = localStorage.getItem('zenoApp_selectedWatchfaceIndex');
      if (saved == null) return 'light';
      const n = parseInt(saved, 10);
      const index = Number.isNaN(n) ? 0 : Math.min(Math.max(0, n), 4);
      return WATCHFACE_THEMES[index];
    } catch {
      return 'light';
    }
  });
  const [sessionLength, setSessionLength] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [draggedMinutes, setDraggedMinutes] = useState<number | null>(null);
  const [showTimerSelector, setShowTimerSelector] = useState(false);
  const [volume, setVolume] = useState(0.7); // Default volume 70%
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const [showWatchfacePicker, setShowWatchfacePicker] = useState(false);
  const [previewBackgroundIndex, setPreviewBackgroundIndex] = useState<number | null>(null);
  const [selectedWatchfaceIndex, setSelectedWatchfaceIndex] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('zenoApp_selectedWatchfaceIndex');
      if (saved == null) return 0;
      const n = parseInt(saved, 10);
      return Number.isNaN(n) ? 0 : Math.min(Math.max(0, n), 4);
    } catch {
      return 0;
    }
  });
  const panelOpenAtWatchfaceRef = useRef<number>(0);
  const [customSongs, setCustomSongs] = useState<Song[]>(() => {
    // Load custom songs from localStorage on initial render
    try {
      const saved = localStorage.getItem('zenoApp_customSongs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedSongId, setSelectedSongId] = useState<string>(() => {
    // Load selected song from localStorage on initial render
    try {
      const saved = localStorage.getItem('zenoApp_selectedSongId');
      return saved || 'song-1';
    } catch {
      return 'song-1';
    }
  });
  const [showVolumeFeedback, setShowVolumeFeedback] = useState(false);
  const volumeFeedbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio player state for UI
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioPlayerRef = useRef<AudioPlayerRef>(null);
  
  // Gestures
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const handleLoadingComplete = () => {
    // Start fading out loader
    setIsLoading(false);
    // Start fading in content slightly after
    setTimeout(() => {
        setShowContent(true);
    }, 500);
  };

  const moods = [
    {
      video: '/assets/mood-0.mp4',
      audio: '/assets/mood-0.mp3',
    },
    {
      video: '/assets/mood-1.mp4',
      audio: '/assets/mood-1.mp3',
    },
    {
      video: '/assets/mood-2.mp4',
      audio: '/assets/mood-2.mp3',
    },
    {
      video: '/assets/mood-3.mp4',
      audio: null, // Generated
    },
  ];

  // Helper function to generate consistent image URL for songs
  const getSongImageUrl = (songId: string, songName: string): string => {
    const FALLBACK_IMAGES = [
      "https://images.unsplash.com/photo-1760346738721-235e811f573d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsby1maSUyMGFic3RyYWN0JTIwYmFja2dyb3VuZHxlbnwxfHx8fDE3Njk4MDYxMzF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      "https://images.unsplash.com/photo-1736176421274-546a4eaf57d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMG11c2ljJTIwd2F2ZWZvcm1zJTIwZ3JhZGllbnR8ZW58MXx8fHwxNzY5ODA2MTMxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      "https://images.unsplash.com/photo-1765046255479-669cf07a0230?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwc291bmQlMjB3YXZlc3xlbnwxfHx8fDE3Njk4MDYxMzF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      "https://images.unsplash.com/photo-1682943827405-6261f5540d68?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGF1ZGlvJTIwc3BlY3RydW18ZW58MXx8fHwxNzY5ODA2MTMxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    ];
    let hash = 0;
    const str = songId || songName || 'default';
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % FALLBACK_IMAGES.length;
    return FALLBACK_IMAGES[index];
  };

  // Create song list for picker - using actual audio files from assets
  const allSongs: Song[] = [
    {
      id: 'song-1',
      name: '3 Petits Bouts de Choux (Cover)',
      duration: '∞',
      audioUrl: '/assets/3 Petits Bouts de Choux (Cover).mp3',
      imageUrl: getSongImageUrl('song-1', '3 Petits Bouts de Choux (Cover)'),
    },
    {
      id: 'song-2',
      name: 'Dreams of Glass',
      duration: '∞',
      audioUrl: '/assets/Dreams of Glass.mp3',
      imageUrl: getSongImageUrl('song-2', 'Dreams of Glass'),
    },
    {
      id: 'song-3',
      name: 'Vive le Plein air',
      duration: '∞',
      audioUrl: '/assets/Vive le Plein air.mp3',
      imageUrl: getSongImageUrl('song-3', 'Vive le Plein air'),
    },
    {
      id: 'song-4',
      name: 'Funcky Day Cover',
      duration: '∞',
      audioUrl: '/assets/Funcky Day Cover.mp3',
      imageUrl: getSongImageUrl('song-4', 'Funcky Day Cover'),
    },
    {
      id: 'song-5',
      name: 'Sabe Jogar Cover',
      duration: '∞',
      audioUrl: '/assets/Sabe Jogar Cover.mp3',
      imageUrl: getSongImageUrl('song-5', 'Sabe Jogar Cover'),
    },
    ...customSongs,
  ];

  // Save custom songs to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('zenoApp_customSongs', JSON.stringify(customSongs));
    } catch (e) {
      console.warn('Failed to save custom songs to localStorage:', e);
    }
  }, [customSongs]);

  // Save selected song to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('zenoApp_selectedSongId', selectedSongId);
    } catch (e) {
      console.warn('Failed to save selected song to localStorage:', e);
    }
  }, [selectedSongId]);

  useEffect(() => {
    try {
      localStorage.setItem('zenoApp_selectedWatchfaceIndex', String(selectedWatchfaceIndex));
    } catch (e) {
      console.warn('Failed to save selected watchface to localStorage:', e);
    }
  }, [selectedWatchfaceIndex]);

  // Update time remaining
  useEffect(() => {
    if (!isPlaying || !startTime || !sessionLength) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = sessionLength - elapsed;

      if (remaining <= 0) {
        setTimeRemaining(0);
        setSessionEnded(true);
        setIsPlaying(false);
        // Play triumphant success sound when session completes
        hapticSounds.success();
        clearInterval(interval);
      } else {
        setTimeRemaining(remaining);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, startTime, sessionLength]);

  const handleTimerButtonClick = () => {
    if (!isTimerActive) {
      // Toggle focus mode on - show timer selector for user to choose time
      // If selector is already showing, hide it (toggle off)
      if (showTimerSelector) {
        setShowTimerSelector(false);
      } else {
        setShowTimerSelector(true);
      }
    } else {
      // Toggle focus mode off - reset everything
      setIsTimerActive(false);
      setIsPlaying(false);
      setSessionLength(null);
      setStartTime(null);
      setTimeRemaining(null);
      setSessionEnded(false);
      setShowTimerSelector(false);
    }
  };

  const handleTimeButtonClick = (minutes: number) => {
    // Start timer with selected duration
    setIsTimerActive(true);
    setShowTimerSelector(false); // Hide selector once time is selected
    setSessionLength(minutes * 60 * 1000);
    setStartTime(Date.now());
    setTimeRemaining(minutes * 60 * 1000);
    setIsPlaying(true);
    hapticSounds.thud();
  };

  const handleMinuteHandDrag = (minutes: number) => {
    // Update preview while dragging
    setDraggedMinutes(minutes);
  };

  const handleMinuteHandDragEnd = (minutes: number) => {
    // Start timer with dragged duration
    setIsTimerActive(true);
    setShowTimerSelector(false); // Hide selector once time is selected
    const duration = minutes * 60 * 1000;
    setSessionLength(duration);
    setStartTime(Date.now());
    setTimeRemaining(duration);
    setIsPlaying(true);
    setDraggedMinutes(null); // Reset drag preview
    hapticSounds.thud();
  };

  const handleClockClick = () => {
    if (!isTimerActive) return;
    
    // Cycle to next mood (0-3)
    const nextMood = (currentMood + 1) % moods.length;
    setCurrentMood(nextMood);
  };

  const handlePointerDown = () => {
    isLongPressRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      hapticSounds.click();
      setShowSoundPicker(true);
    }, 800); // 800ms for long press
  };

  const handlePointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  const handleScreenClick = (e: React.MouseEvent) => {
    if (isLoading) return; // Ignore clicks during loading

    // Ignore click if it was a long press
    if (isLongPressRef.current) {
       isLongPressRef.current = false;
       return;
    }
    
    const target = e.target as HTMLElement;
    
    if (target.closest('[data-name="Ticker"]')) return;

    if (target.closest('[data-name="Timer"]') || 
        target.closest('[data-name="Toggle"]') ||
        target.closest('[data-name="Greeting"]')) {
      return;
    }
    
    // Also ignore clicks on mood switcher
    if (target.closest('.mood-switcher')) return;

    if (isTimerActive && sessionLength) {
      // Toggle play/pause
      setIsPlaying(!isPlaying);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (isLoading) return;
    if (!isTimerActive) return;
    
    // Normalize delta
    const delta = e.deltaY * -0.001; 
    const newVolume = Math.min(1, Math.max(0, volume + delta));
    
    setVolume(newVolume);
    setShowVolumeFeedback(true);
    
    if (volumeFeedbackTimerRef.current) clearTimeout(volumeFeedbackTimerRef.current);
    volumeFeedbackTimerRef.current = setTimeout(() => setShowVolumeFeedback(false), 1500);
  };


  const handleVolumePlayPause = () => {
    // Allow playing audio even when timer isn't active
    setIsPlaying(!isPlaying);
    // If starting to play and timer isn't active, ensure we have a selected song
    if (!isPlaying && !isTimerActive) {
      // Audio will play automatically when isPlaying becomes true
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
  };

  const handleToggleDarkMode = () => {
    // Cycle through: light -> dark -> color -> light
    setThemeMode(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'color';
      return 'light';
    });
  };

  const handleOpenSoundPicker = () => {
    hapticSounds.click();
    setShowSoundPicker(true);
  };

  const handleOpenWatchfacePicker = () => {
    hapticSounds.click();
    const current = selectedWatchfaceIndex;
    panelOpenAtWatchfaceRef.current = current;
    setPreviewBackgroundIndex(current);
    setThemeMode(WATCHFACE_THEMES[current]);
    setShowWatchfacePicker(true);
  };


  const handleCloseWatchfacePicker = () => {
    setShowWatchfacePicker(false);
    setPreviewBackgroundIndex(null);
  };

  const handleSelectWatchface = (index: number) => {
    setSelectedWatchfaceIndex(index);
    setThemeMode(WATCHFACE_THEMES[index]);
    setShowWatchfacePicker(false);
  };

  const handleCloseSoundPicker = () => {
    setShowSoundPicker(false);
  };

  const handleAddSong = (song: Song) => {
    setCustomSongs([...customSongs, song]);
    setSelectedSongId(song.id);
    setShowSoundPicker(false);
    // Auto-play when adding a custom song
    if (!isPlaying) {
      setIsPlaying(true);
    }
  };

  const handleSelectSong = (songId: string) => {
    setSelectedSongId(songId);
    setShowSoundPicker(false);
    // Always start playing when a song is selected from the picker
    if (!isPlaying) {
      setIsPlaying(true);
    }
  };

  const handleDeleteSong = (songId: string) => {
    // Remove the song from customSongs
    setCustomSongs(prev => prev.filter(song => song.id !== songId));
    // If the deleted song was selected, switch to the first default song
    if (selectedSongId === songId) {
      setSelectedSongId('song-1');
    }
  };

  const handleAudioProgress = (currentTime: number) => {
    setAudioCurrentTime(currentTime);
  };

  const handleAudioDuration = (duration: number) => {
    setAudioDuration(duration);
  };

  const handleAudioSeek = (progress: number) => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.seek(progress);
      // Update local state immediately for responsive UI
      setAudioCurrentTime(progress * audioDuration);
    }
  };

  // Get current audio source based on selected song
  const getCurrentAudioSource = () => {
    const selectedSong = allSongs.find(song => song.id === selectedSongId);
    if (selectedSong) {
      // If audioUrl is empty or null, return null for generative audio
      if (!selectedSong.audioUrl || selectedSong.audioUrl.trim() === '') {
        console.log('Using generative audio for:', selectedSong.name);
        return null;
      }
      // Return the audioUrl
      console.log('Playing audio URL:', selectedSong.audioUrl, 'for song:', selectedSong.name);
      return selectedSong.audioUrl;
    }
    // Fallback to current mood audio
    console.log('Fallback to mood audio:', moods[currentMood].audio);
    return moods[currentMood].audio;
  };

  // When panel is open, use preview; if not set yet (first paint), use index at open so we never flash to background-0
  const effectiveBackgroundIndex =
    showWatchfacePicker && previewBackgroundIndex === null
      ? panelOpenAtWatchfaceRef.current
      : previewBackgroundIndex ?? selectedWatchfaceIndex;
  const effectiveBg = BACKGROUNDS[effectiveBackgroundIndex];
  const effectiveTheme = showWatchfacePicker
    ? WATCHFACE_THEMES[effectiveBackgroundIndex]
    : themeMode;
  // Watchface 1–4: use bright (light) theme for all UI; watchface 0 unchanged
  const uiTheme =
    effectiveBackgroundIndex >= 1 && effectiveBackgroundIndex <= 4 ? 'light' : effectiveTheme;

  return (
    <div 
      className="fixed inset-0 overflow-hidden"
      onClick={handleScreenClick}
      data-build={BUILD_ID}
      onMouseDown={handlePointerDown}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchEnd={handlePointerUp}
      onWheel={handleWheel}
    >
      {/* Background: always show watchface image when available; theme overlay for dark/color */}
      <div
        className="absolute inset-0 z-0 transition-[background,background-color,background-image] duration-500 ease-out"
        style={
          effectiveBg == null
            ? { background: effectiveTheme === 'light' ? '#ededed' : effectiveTheme === 'dark' ? '#111' : '#56329d' }
            : {
                backgroundImage: `url(${effectiveBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
        }
        aria-hidden
      />
      {/* No theme overlay on watchphase backgrounds — show images as-is */}
      {/* Loading Overlay — uses uiTheme so watchface 1–4 show bright loading */}
      <div 
        className={`absolute inset-0 z-[100] transition-opacity duration-1000 ease-in-out ${
          uiTheme === 'dark' ? 'bg-[#111]' : 
          uiTheme === 'color' ? 'bg-[#56329d]' : 
          'bg-[#EAEAEA]'
        } ${isLoading ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        {isLoading && (
            <BlurTextAnimation 
                text="Where attention goes, energy flows." 
                loop={false}
                onComplete={handleLoadingComplete}
                className={
                  uiTheme === 'dark' ? 'bg-[#111]' : 
                  uiTheme === 'color' ? 'bg-[#56329d]' : 
                  'bg-[#EAEAEA]'
                }
                textColor={uiTheme === 'light' ? 'text-black/80' : 'text-white/80'}
                fontSize="text-2xl md:text-3xl font-light tracking-widest"
            />
        )}
      </div>

      {/* Main Content Container - Fades in after loading */}
      <div 
        className={`absolute inset-0 z-10 flex transition-opacity duration-1000 ease-in-out ${showContent ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="flex-1 min-w-0 overflow-hidden flex flex-col relative">
        <AudioPlayer
          ref={audioPlayerRef}
          src={getCurrentAudioSource()}
          isPlaying={isPlaying}
          moodKey={currentMood}
          volume={volume}
          onProgress={handleAudioProgress}
          onDuration={handleAudioDuration}
        />

        {/* Home UI - always visible */}
        <div
          style={{
            opacity: showSoundPicker ? 0 : 1,
            transition: 'opacity 0.4s ease-in-out',
            pointerEvents: showSoundPicker ? 'none' : 'auto',
            position: 'relative',
            zIndex: 10,
          }}
        >
          <HomeWrapper
          onTimerClick={handleTimerButtonClick}
          isTimerActive={isTimerActive}
          isPlaying={isPlaying}
          volume={volume}
          onVolumePlayPause={handleVolumePlayPause}
          onVolumeChange={handleVolumeChange}
          onVolumeLongPress={handleOpenSoundPicker}
        >
          <Home
            isTimerActive={isTimerActive}
            isPlaying={isPlaying}
            volume={volume}
            onVolumePlayPause={handleVolumePlayPause}
            onVolumeChange={handleVolumeChange}
            onVolumeLongPress={handleOpenSoundPicker}
            timeRemaining={timeRemaining}
            onClockClick={handleClockClick}
            onOpenWatchfacePicker={handleOpenWatchfacePicker}
            onTimeButtonClick={handleTimeButtonClick}
            onMinuteHandDrag={handleMinuteHandDrag}
            onMinuteHandDragEnd={handleMinuteHandDragEnd}
            draggedMinutes={draggedMinutes}
            showTimerSelector={showTimerSelector}
            themeMode={effectiveTheme}
            uiTheme={uiTheme}
            onToggleDarkMode={handleToggleDarkMode}
            songName={allSongs.find(s => s.id === selectedSongId)?.name || 'Song Name'}
            currentTime={audioCurrentTime}
            duration={audioDuration}
            onSeek={handleAudioSeek}
            albumArtUrl={allSongs.find(s => s.id === selectedSongId)?.imageUrl}
            audioPlayerRef={audioPlayerRef}
            onOpenSoundPicker={handleOpenSoundPicker}
            showWatchfacePicker={showWatchfacePicker}
          />
        </HomeWrapper>
        </div>


        {/* Watchface picker side panel */}
        <WatchfacePickerPanel
          isOpen={showWatchfacePicker}
          onClose={handleCloseWatchfacePicker}
          onSelectWatchface={handleSelectWatchface}
          onPreviewBackground={setPreviewBackgroundIndex}
          selectedWatchfaceIndex={selectedWatchfaceIndex}
          themeMode={effectiveTheme}
        />

        {/* Sound picker modal */}
        {showSoundPicker && (
          <SoundPickerModal
            isOpen={showSoundPicker}
            onClose={handleCloseSoundPicker}
            songs={allSongs}
            onAddSong={handleAddSong}
            onSelectSong={handleSelectSong}
            onDeleteSong={handleDeleteSong}
            selectedSongId={selectedSongId}
          />
        )}

        {/* Click feedback ripple - removed for simplicity */}

        {/* Play/Pause indicator - removed for simplicity */}

        {/* Volume Feedback Indicator */}
        {showVolumeFeedback && isTimerActive && !sessionEnded && (
          <div 
             className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 pointer-events-none transition-opacity duration-300 z-50 px-2"
             style={{ 
               opacity: showVolumeFeedback ? 1 : 0,
               paddingBottom: 'env(safe-area-inset-bottom)'
             }}
          >
             <div className={`backdrop-blur-md px-4 sm:px-6 py-1.5 sm:py-2 rounded-full shadow-sm text-xs sm:text-sm font-medium tracking-wide transition-colors duration-500 ${effectiveTheme === 'light' ? 'bg-white/80 text-gray-600' : 'bg-white/20 text-white'}`}>
               VOLUME {Math.round(volume * 100)}%
             </div>
          </div>
        )}

        </div>
      </div>


    </div>
  );
}
