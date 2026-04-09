import { useState, useEffect, useRef } from 'react';
import { AudioPlayer, AudioPlayerRef } from '@/app/components/AudioPlayer';
import { HomeWrapper } from '@/app/components/HomeWrapper';
import { WatchfacePickerPanel } from '@/app/components/WatchfacePickerPanel';
import { MenuFlyoutModal, type MenuFlyoutAnchor } from '@/app/components/MenuFlyoutModal';
import { SoundPickerFlyoutModal, type SoundFlyoutAnchor } from '@/app/components/SoundPickerFlyoutModal';
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
  subtitle?: string;
}

// Build ID – visible on the page so you can confirm the deployed version
const BUILD_ID = '2.0';

// Backgrounds use same numeric indices as watchfaces: Background-0 (none) … Background-5.png
const WATCHFACE_BACKGROUND_IDS = [0, 1, 2, 3, 4, 5] as const;
const WATCHFACE_LAST_INDEX = WATCHFACE_BACKGROUND_IDS.length - 1;
const BACKGROUNDS: (string | null)[] = WATCHFACE_BACKGROUND_IDS.map((i) =>
  i === 0 ? null : `/assets/Backgrounds/Background-${i}.png`
);

// Watchface index → theme. Hover previews and selection apply this theme to the watch and UI.
const WATCHFACE_THEMES: ('light' | 'dark' | 'color')[] = [
  'light',  // 0
  'dark',   // 1
  'color',  // 2
  'dark',   // 3
  'color',  // 4
  'dark',   // 5 — same clock dial as 1–4 (gradient ring, white markers/hands); uiTheme still light for chrome
];

// Loading screen greetings — rotate one per day (day-of-year % 5) to set focus and calm.
const LOADING_GREETINGS = [
  "Where attention goes, energy flows.",
  "Breathe in focus. Breathe out distraction.",
  "One task, one moment, one breath.",
  "Calm mind. Clear intention. Steady focus.",
  "Be here now. Everything else can wait.",
];

function getLoadingGreetingForToday(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  return LOADING_GREETINGS[dayOfYear % LOADING_GREETINGS.length];
}

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
      const index = Number.isNaN(n) ? 0 : Math.min(Math.max(0, n), WATCHFACE_LAST_INDEX);
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
  const [isMuted, setIsMuted] = useState(false);
  const savedVolumeRef = useRef(0.7); // volume before mute, for unmute
  const allSongsRef = useRef<Song[]>([]);
  const selectedSongIdRef = useRef<string>('song-1');
  const volumeRef = useRef(volume);
  const isMutedRef = useRef(isMuted);
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const [soundFlyoutAnchor, setSoundFlyoutAnchor] = useState<SoundFlyoutAnchor | null>(null);
  const [showMenuFlyout, setShowMenuFlyout] = useState(false);
  const [menuFlyoutAnchor, setMenuFlyoutAnchor] = useState<MenuFlyoutAnchor | null>(null);
  const [showWatchfacePicker, setShowWatchfacePicker] = useState(false);
  const [previewBackgroundIndex, setPreviewBackgroundIndex] = useState<number | null>(null);
  const [selectedWatchfaceIndex, setSelectedWatchfaceIndex] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('zenoApp_selectedWatchfaceIndex');
      if (saved == null) return 0;
      const n = parseInt(saved, 10);
      return Number.isNaN(n) ? 0 : Math.min(Math.max(0, n), WATCHFACE_LAST_INDEX);
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
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1516117172878-fd2c41f4a759?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1760346738721-235e811f573d?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1736176421274-546a4eaf57d6?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1765046255479-669cf07a0230?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1682943827405-6261f5540d68?auto=format&fit=crop&w=900&q=80"
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

  // Create song list for picker using audio files in public/assets.
  const allSongs: Song[] = [
    {
      id: 'song-1',
      name: 'Calm',
      duration: '∞',
      audioUrl: '/assets/Calm.mp3',
      imageUrl: getSongImageUrl('song-1', 'Calm'),
      subtitle: 'Calm',
    },
    {
      id: 'song-2',
      name: 'Rain',
      duration: '∞',
      audioUrl: '/assets/Rain.mp3',
      imageUrl: getSongImageUrl('song-2', 'Rain'),
      subtitle: 'Focused',
    },
    {
      id: 'song-3',
      name: 'Ocean',
      duration: '∞',
      audioUrl: '/assets/Ocean.mp3',
      imageUrl: getSongImageUrl('song-3', 'Ocean'),
      subtitle: 'Energised',
    },
    {
      id: 'song-4',
      name: 'Fireplace',
      duration: '∞',
      audioUrl: '/assets/Fireplace.mp3',
      imageUrl: getSongImageUrl('song-4', 'Fireplace'),
      subtitle: 'Funky',
    },
    {
      id: 'song-5',
      name: 'Piano',
      duration: '∞',
      audioUrl: '/assets/Piano.mp3',
      imageUrl: getSongImageUrl('song-5', 'Piano'),
      subtitle: 'Brazilian moods',
    },
    {
      id: 'song-6',
      name: 'Handpan',
      duration: '∞',
      audioUrl: '/assets/Handpan.mp3',
      imageUrl: getSongImageUrl('song-6', 'Handpan'),
      subtitle: 'Calm',
    },
    {
      id: 'song-7',
      name: 'Energised',
      duration: '∞',
      audioUrl: '/assets/Energised.mp3',
      imageUrl: getSongImageUrl('song-7', 'Energised'),
      subtitle: 'Energised',
    },
    {
      id: 'song-8',
      name: 'Brazilian Vibes',
      duration: '∞',
      audioUrl: '/assets/Brazilian Vibes.mp3',
      imageUrl: getSongImageUrl('song-8', 'Brazilian Vibes'),
      subtitle: 'Brazilian Vibes',
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
        setIsTimerActive(false); // Exit focus mode so UI fades back in
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
    if (target.closest('[data-name="MusicPicker"]')) return;

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
    if (newVolume > 0) setIsMuted(false);
  };

  const handleMuteUnmute = () => {
    if (isMuted) {
      setVolume(savedVolumeRef.current);
      setIsMuted(false);
    } else {
      savedVolumeRef.current = volume;
      setVolume(0);
      setIsMuted(true);
    }
  };

  const handleToggleDarkMode = () => {
    // Cycle through: light -> dark -> color -> light
    setThemeMode(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'color';
      return 'light';
    });
  };

  const handleOpenSoundPicker = (buttonRect?: DOMRect) => {
    hapticSounds.click();
    if (buttonRect) {
      setSoundFlyoutAnchor({
        top: buttonRect.top,
        left: buttonRect.left,
        right: buttonRect.right,
        bottom: buttonRect.bottom,
      });
    } else if (typeof window !== 'undefined') {
      // Long-press opens without a trigger rect: pin near bottom-right controls.
      setSoundFlyoutAnchor({
        top: window.innerHeight - 24,
        left: window.innerWidth - 72,
        right: window.innerWidth - 24,
        bottom: window.innerHeight - 24,
      });
    }
    setShowSoundPicker(true);
  };

  const handleCloseWatchfacePicker = () => {
    setShowWatchfacePicker(false);
    setPreviewBackgroundIndex(null);
  };

  const handleOpenWatchfacePicker = () => {
    hapticSounds.click();
    if (showWatchfacePicker) {
      handleCloseWatchfacePicker();
      return;
    }
    const current = selectedWatchfaceIndex;
    panelOpenAtWatchfaceRef.current = current;
    setPreviewBackgroundIndex(current);
    setThemeMode(WATCHFACE_THEMES[current]);
    setShowWatchfacePicker(true);
  };

  const handleSelectWatchface = (index: number) => {
    setSelectedWatchfaceIndex(index);
    setThemeMode(WATCHFACE_THEMES[index]);
    setShowWatchfacePicker(false);
  };

  const handleCloseSoundPicker = () => {
    setShowSoundPicker(false);
    setSoundFlyoutAnchor(null);
  };

  const handleAddSong = (song: Song) => {
    setCustomSongs([...customSongs, song]);
    setSelectedSongId(song.id);
    handleCloseSoundPicker();
    // Auto-play when adding a custom song
    if (!isPlaying) {
      setIsPlaying(true);
    }
  };

  const handleSelectSong = (songId: string) => {
    setSelectedSongId(songId);
    handleCloseSoundPicker();
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

  // Keep refs in sync for keyboard handler
  allSongsRef.current = allSongs;
  selectedSongIdRef.current = selectedSongId;
  volumeRef.current = volume;
  isMutedRef.current = isMuted;

  const soundPickerSongs = allSongs;

  // Don't trigger keyboard shortcuts when user is typing in an input
  const isTypingInInput = () => {
    const el = document.activeElement;
    if (!el || !(el instanceof HTMLElement)) return false;
    const tag = el.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
    if (el.isContentEditable) return true;
    return false;
  };

  // Global keyboard shortcuts: play/pause, volume, mute, previous/next track, eject
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTypingInInput()) return;

      const code = e.code;
      const key = e.key.toLowerCase();

      // Play / Pause — Space or MediaPlayPause
      if (code === 'Space' || code === 'MediaPlayPause') {
        e.preventDefault();
        setIsPlaying((p) => !p);
        return;
      }

      // Volume Up — ArrowUp or VolumeUp
      if (code === 'ArrowUp' || code === 'VolumeUp') {
        e.preventDefault();
        setIsMuted(false);
        setVolume((v) => Math.min(1, v + 0.05));
        setShowVolumeFeedback(true);
        if (volumeFeedbackTimerRef.current) clearTimeout(volumeFeedbackTimerRef.current);
        volumeFeedbackTimerRef.current = setTimeout(() => setShowVolumeFeedback(false), 1500);
        return;
      }

      // Volume Down — ArrowDown or VolumeDown
      if (code === 'ArrowDown' || code === 'VolumeDown') {
        e.preventDefault();
        setIsMuted(false);
        setVolume((v) => Math.max(0, v - 0.05));
        setShowVolumeFeedback(true);
        if (volumeFeedbackTimerRef.current) clearTimeout(volumeFeedbackTimerRef.current);
        volumeFeedbackTimerRef.current = setTimeout(() => setShowVolumeFeedback(false), 1500);
        return;
      }

      // Mute / Unmute — m, M, or VolumeMute
      if (key === 'm' || code === 'VolumeMute') {
        e.preventDefault();
        if (isMutedRef.current) {
          setVolume(savedVolumeRef.current);
          setIsMuted(false);
        } else {
          savedVolumeRef.current = volumeRef.current;
          setVolume(0);
          setIsMuted(true);
        }
        return;
      }

      // Previous track — MediaTrackPrevious or ArrowLeft
      if (code === 'MediaTrackPrevious' || code === 'ArrowLeft') {
        e.preventDefault();
        const songs = allSongsRef.current;
        const idx = songs.findIndex((s) => s.id === selectedSongIdRef.current);
        const newIdx = idx <= 0 ? songs.length - 1 : idx - 1;
        setSelectedSongId(songs[newIdx].id);
        setIsPlaying((p) => (p ? p : true));
        return;
      }

      // Next track — MediaTrackNext or ArrowRight
      if (code === 'MediaTrackNext' || code === 'ArrowRight') {
        e.preventDefault();
        const songs = allSongsRef.current;
        const idx = songs.findIndex((s) => s.id === selectedSongIdRef.current);
        const newIdx = idx < 0 || idx >= songs.length - 1 ? 0 : idx + 1;
        setSelectedSongId(songs[newIdx].id);
        setIsPlaying((p) => (p ? p : true));
        return;
      }

      // Eject — close sound picker if open, otherwise stop playback
      if (code === 'Eject') {
        e.preventDefault();
        setShowSoundPicker((open) => {
          if (open) return false;
          setIsPlaying(false);
          return open;
        });
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // When panel is open, use preview; if not set yet (first paint), use index at open so we never flash to background-0
  const effectiveBackgroundIndex =
    showWatchfacePicker && previewBackgroundIndex === null
      ? panelOpenAtWatchfaceRef.current
      : previewBackgroundIndex ?? selectedWatchfaceIndex;
  const effectiveBg = BACKGROUNDS[effectiveBackgroundIndex];
  const effectiveTheme = showWatchfacePicker
    ? WATCHFACE_THEMES[effectiveBackgroundIndex]
    : themeMode;
  // Watchface 1–5: use bright (light) theme for all UI; watchface 0 unchanged
  const uiTheme =
    effectiveBackgroundIndex >= 1 && effectiveBackgroundIndex <= WATCHFACE_LAST_INDEX
      ? 'light'
      : effectiveTheme;

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
      {/* Loading Overlay — uses uiTheme so watchface 1–5 show bright loading */}
      <div 
        className={`absolute inset-0 z-[100] transition-opacity duration-1000 ease-in-out ${
          uiTheme === 'dark' ? 'bg-[#111]' : 
          uiTheme === 'color' ? 'bg-[#56329d]' : 
          'bg-[#EAEAEA]'
        } ${isLoading ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        {isLoading && (
            <BlurTextAnimation 
                text={getLoadingGreetingForToday()} 
                loop={false}
                onComplete={handleLoadingComplete}
                className={
                  uiTheme === 'dark' ? 'bg-[#111]' : 
                  uiTheme === 'color' ? 'bg-[#56329d]' : 
                  'bg-[#EAEAEA]'
                }
                textColor={uiTheme === 'light' ? 'text-black/80' : 'text-white/80'}
                fontSize="text-2xl md:text-3xl font-light tracking-[0em]"
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
          volume={isMuted ? 0 : volume}
          onProgress={handleAudioProgress}
          onDuration={handleAudioDuration}
        />

        {/* Home UI — keep visible when sound sidebar is open; only right-side (theme + music button) hide */}
        <div className="relative z-10">
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
            onCloseSoundPicker={handleCloseSoundPicker}
            showWatchfacePicker={showWatchfacePicker}
            showSoundPicker={showSoundPicker}
            watchfaceBackgroundIndex={effectiveBackgroundIndex}
            onMenuClick={(rect) => {
              setMenuFlyoutAnchor({
                top: rect.top,
                left: rect.left,
                bottom: rect.bottom,
              });
              setShowMenuFlyout(true);
            }}
          />
        </HomeWrapper>
        </div>


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

      {/* Panels at root so they are never clipped and always on top */}
      <WatchfacePickerPanel
        isOpen={showWatchfacePicker}
        onClose={handleCloseWatchfacePicker}
        onSelectWatchface={handleSelectWatchface}
        onPreviewBackground={setPreviewBackgroundIndex}
        selectedWatchfaceIndex={selectedWatchfaceIndex}
        themeMode={effectiveTheme}
      />
      <SoundPickerFlyoutModal
        isOpen={showSoundPicker}
        onClose={handleCloseSoundPicker}
        anchor={soundFlyoutAnchor}
        songs={soundPickerSongs}
        onSelectSong={handleSelectSong}
        selectedSongId={selectedSongId}
      />
      <MenuFlyoutModal
        isOpen={showMenuFlyout}
        anchor={menuFlyoutAnchor}
        onClose={() => {
          setShowMenuFlyout(false);
          setMenuFlyoutAnchor(null);
        }}
      />
    </div>
  );
}
