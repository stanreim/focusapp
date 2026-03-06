import { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import svgPaths from "@/imports/svg-8dn7ashjpm";

export interface Song {
  id: string;
  name: string;
  duration: string;
  audioUrl: string;
  imageUrl?: string;
  isCustom?: boolean;
  /** Mood label shown above the song name in the sidebar (e.g. Calm, Focused). */
  subtitle?: string;
}

interface SoundPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  songs: Song[];
  onAddSong: (song: Song) => void;
  onSelectSong: (songId: string) => void;
  onDeleteSong?: (songId: string) => void;
  selectedSongId?: string;
}

// Stagger timing: smooth fade in from bottom to top (50% faster than original 300/450ms)
const CARD_STAGGER_MS = 150;
const CARD_ANIMATION_MS = 225;
const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';

interface SoundPickerContentProps {
  variant?: 'modal' | 'sidebar';
  onClose: () => void;
  songs: Song[];
  onAddSong: (song: Song) => void;
  onSelectSong: (songId: string) => void;
  onDeleteSong?: (songId: string) => void;
  selectedSongId?: string;
  /** When sidebar: panel has finished sliding in (used for staggered entrance) */
  panelSlidIn?: boolean;
  /** When sidebar: vinyl rows should be visible (staggered bottom-to-top) */
  cardsVisible?: boolean;
  /** When sidebar: panel is closing (reverse stagger top-to-bottom) */
  isClosing?: boolean;
  /** Theme for close button styling (same as CD button in Home) */
  themeMode?: 'light' | 'dark' | 'color';
}

// Figma 61-4764 / 61:4987: Album art 80×80 rounded-[2px]
function TrackArtwork({ song, size, getImageUrl }: { song: Song; size: number; getImageUrl: (id: string, name: string) => string }) {
  const [imageError, setImageError] = useState(false);
  const src = getImageUrl(song.id, song.name);
  return (
    <div className="relative shrink-0 overflow-hidden rounded-[2px]" style={{ width: size, height: size }}>
      {!imageError && src ? (
        <img alt="" className="block w-full h-full object-cover pointer-events-none" src={src} onError={() => setImageError(true)} />
      ) : (
        <div className="absolute inset-0 bg-[#d9d9d9]" />
      )}
    </div>
  );
}

// Sidebar: title uses transition for rollout/rollin (no keyframes needed)
const VINYL_TRANSITION_MS = 350;
const SIDEBAR_ROLLOUT_STYLES = ``;

const VINYL_ROLLOUT_OFFSET_PX = 37; // vinyl rolls out from inside the 80px container

// Figma 61-4804 Vinyl: 72×72 at (0,4), 12×12 dot at (30.5,34), 80×80 art at (37,0). Literally rolls out from container with rotation.
function VinylGroup({ song, getImageUrl, isActive }: { song: Song; getImageUrl: (id: string, name: string) => string; isActive: boolean }) {
  const transition = `transform ${VINYL_TRANSITION_MS}ms ease-out`;
  return (
    <div
      className="relative shrink-0"
      style={{
        width: 117,
        height: 80,
        transform: isActive ? 'translateX(0)' : `translateX(${VINYL_ROLLOUT_OFFSET_PX}px)`,
        transition,
      }}
    >
      {/* 61:4805 — vinyl ring; rotation on wrapper so inner circle isn't overridden by dev tools */}
      <div
        className="absolute left-0"
        style={{
          width: 72,
          height: 72,
          top: 4,
          transform: `rotate(${isActive ? 245 : 0}deg)`,
          transformOrigin: '50% 50%',
          transition: `transform ${VINYL_TRANSITION_MS}ms ease-out`,
        }}
      >
        <div
          className="rounded-full bg-[#2a2a2a] size-full"
          style={{ boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.25)' }}
        />
      </div>
      {/* 61:4806 — center dot 12×12 at ml-[30.5px] mt-[34px] */}
      <div className="absolute rounded-full bg-[#6d6d6d]" style={{ width: 12, height: 12, left: 30.5, top: 34 }} />
      {/* 61:4987 — album art 80×80 at ml-[37px] mt-0 */}
      <div className="absolute rounded-[2px] overflow-hidden" style={{ left: 37, top: 0, width: 80, height: 80 }}>
        <TrackArtwork song={song} size={80} getImageUrl={getImageUrl} />
      </div>
    </div>
  );
}

// Figma 61-4986 full Track (open): 315×80 — label 182px + gap 16 + Vinyl group 117px. Title and vinyl transition on rollout/rollin.
function OpenTrackRow({ song, getImageUrl, isActive }: { song: Song; getImageUrl: (id: string, name: string) => string; isActive: boolean }) {
  return (
    <div className="content-stretch flex gap-[16px] items-center justify-end relative shrink-0" style={{ width: 315 }}>
      <div
        className="content-stretch flex flex-col gap-[8px] items-end justify-center text-right shrink-0"
        style={{
          width: 182,
          opacity: isActive ? 1 : 0,
          transform: isActive ? 'translateX(0)' : 'translateX(12px)',
          transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
          transitionDelay: isActive ? '0.08s' : '0s',
        }}
      >
        <p className="font-['SF_Pro:Bold',sans-serif] font-bold text-[14px] text-[#111] w-full truncate" style={{ fontVariationSettings: "'wdth' 100" }}>
          {song.subtitle ?? 'Focused'}
        </p>
        <p className="font-['SF_Pro:Regular',sans-serif] font-normal text-[14px] text-[#6d6d6d] w-full truncate" style={{ height: 24, fontVariationSettings: "'wdth' 100" }}>
          {song.name}
        </p>
      </div>
      <VinylGroup song={song} getImageUrl={getImageUrl} isActive={isActive} />
    </div>
  );
}

// Sidepanel row: 80×80 container always visible; title + vinyl roll out directly from this container when hovered or active.
const ROW_CLOSED_WIDTH = 80;
const ROW_OPEN_WIDTH = 315; // 182 + 16 + 117 (Figma open track)

function SidebarTrackRow({
  song,
  isActive,
  onSelect,
  onMouseEnter,
  onMouseLeave,
  getImageUrl,
}: {
  song: Song;
  isActive: boolean;
  onSelect: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  getImageUrl: (id: string, name: string) => string;
}) {
  return (
    <div
      data-sound-picker-track-row
      className="flex justify-end overflow-hidden rounded-[2px] transition-[width] duration-300 ease-out"
      style={{ width: isActive ? ROW_OPEN_WIDTH : ROW_CLOSED_WIDTH, minHeight: ROW_CLOSED_WIDTH }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex justify-end outline-none border-none bg-transparent cursor-pointer p-0 min-w-0 shrink-0"
        aria-label={song.name}
      >
        <OpenTrackRow song={song} getImageUrl={getImageUrl} isActive={isActive} />
      </button>
    </div>
  );
}

export function SoundPickerContent({
  variant = 'modal',
  onClose,
  songs,
  onAddSong,
  onSelectSong,
  onDeleteSong,
  selectedSongId,
  panelSlidIn,
  cardsVisible = false,
  isClosing = false,
  themeMode = 'light',
}: SoundPickerContentProps) {
  const isSidebar = variant === 'sidebar';
  const [customLink, setCustomLink] = useState('');
  const [linkError, setLinkError] = useState('');
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [hoveredTrackId, setHoveredTrackId] = useState<string | null>(null);

  // Clean the URL to remove tracking params while preserving essential ones
  // Also convert youtu.be short links to full youtube.com URLs for better compatibility
  const cleanUrl = (url: string): string => {
    try {
        const urlObj = new URL(url.trim());
        
        // For YouTube, preserve the video ID
        if (urlObj.hostname.includes('youtube.com')) {
          const videoId = urlObj.searchParams.get('v');
          if (videoId) {
            return `https://www.youtube.com/watch?v=${videoId}`;
          }
        }
        
        // For youtu.be short links, convert to full youtube.com URL for better compatibility
        if (urlObj.hostname === 'youtu.be') {
          const videoId = urlObj.pathname.slice(1); // Remove leading slash
          if (videoId) {
            return `https://www.youtube.com/watch?v=${videoId}`;
          }
        }
        
        // For other URLs, strip tracking params but keep the URL functional
        return urlObj.origin + urlObj.pathname;
    } catch (e) {
        return url.trim();
    }
  };

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      // Handle youtu.be short links
      if (urlObj.hostname === 'youtu.be') {
        return urlObj.pathname.slice(1); // Remove leading slash
      }
      // Handle youtube.com links
      if (urlObj.hostname.includes('youtube.com')) {
        return urlObj.searchParams.get('v');
      }
    } catch (e) {
      // Not a valid URL
    }
    return null;
  };

  // Get YouTube thumbnail URL
  const getYouTubeThumbnail = (url: string): string | null => {
    const videoId = getYouTubeVideoId(url);
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    return null;
  };

  // Platforms actually supported by react-player v3
  const SUPPORTED_STREAMING_PLATFORMS: { pattern: RegExp; name: string }[] = [
    { pattern: /youtu\.?be/i, name: 'YouTube' },
    { pattern: /vimeo\.com/i, name: 'Vimeo' },
    { pattern: /wistia\.com/i, name: 'Wistia' },
    { pattern: /mux\.com/i, name: 'Mux' },
  ];

  // Platforms that users might try but are NOT supported
  const UNSUPPORTED_PLATFORMS: { pattern: RegExp; name: string; reason: string }[] = [
    { pattern: /spotify\.com/i, name: 'Spotify', reason: 'Spotify requires authentication and Premium account' },
    { pattern: /soundcloud\.com/i, name: 'SoundCloud', reason: 'SoundCloud is not supported in this version' },
    { pattern: /apple\.com\/music/i, name: 'Apple Music', reason: 'Apple Music requires authentication' },
    { pattern: /tidal\.com/i, name: 'Tidal', reason: 'Tidal requires authentication' },
    { pattern: /deezer\.com/i, name: 'Deezer', reason: 'Deezer requires authentication' },
    { pattern: /facebook\.com/i, name: 'Facebook', reason: 'Facebook videos are not supported' },
    { pattern: /twitch\.tv/i, name: 'Twitch', reason: 'Twitch is not supported' },
    { pattern: /dailymotion\.com/i, name: 'Dailymotion', reason: 'Dailymotion is not supported' },
    { pattern: /mixcloud\.com/i, name: 'Mixcloud', reason: 'Mixcloud is not supported' },
  ];

  // Check if URL is a supported streaming service
  const isStreamingUrl = (url: string): { isStreaming: boolean; platform: string } => {
    if (!url) return { isStreaming: false, platform: '' };
    for (const platform of SUPPORTED_STREAMING_PLATFORMS) {
      if (platform.pattern.test(url)) {
        return { isStreaming: true, platform: platform.name };
      }
    }
    return { isStreaming: false, platform: '' };
  };

  // Check if URL is from an unsupported platform
  const checkUnsupportedPlatform = (url: string): { isUnsupported: boolean; name: string; reason: string } => {
    if (!url) return { isUnsupported: false, name: '', reason: '' };
    for (const platform of UNSUPPORTED_PLATFORMS) {
      if (platform.pattern.test(url)) {
        return { isUnsupported: true, name: platform.name, reason: platform.reason };
      }
    }
    return { isUnsupported: false, name: '', reason: '' };
  };

  // Check if URL is a direct audio file
  const isDirectAudioFile = (url: string): boolean => {
    const audioExtensions = /\.(mp3|wav|ogg|m4a|aac|flac|webm|opus)(\?.*)?$/i;
    return audioExtensions.test(url);
  };

  const validateAudioLink = (url: string): { valid: boolean; error?: string } => {
    const cleaned = cleanUrl(url);
    
    // First check if it's an unsupported platform
    const unsupported = checkUnsupportedPlatform(cleaned);
    if (unsupported.isUnsupported) {
      return { valid: false, error: unsupported.reason };
    }
    
    // Check if it's a supported streaming platform
    const streaming = isStreamingUrl(cleaned);
    if (streaming.isStreaming) {
      return { valid: true };
    }
    
    // Check if it's a direct audio file
    if (isDirectAudioFile(cleaned)) {
      return { valid: true };
    }
    
    // For other URLs, check with ReactPlayer (but be cautious)
    if (ReactPlayer.canPlay(cleaned)) {
      return { valid: true };
    }
    
    return { valid: false, error: 'This link format is not supported. Try YouTube, Vimeo, or direct audio files (.mp3, .wav)' };
  };

  const handleLinkPaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const cleaned = cleanUrl(pastedText);
    
    setCustomLink(cleaned);
    setLinkError('');
    
    if (cleaned) {
      const validation = validateAudioLink(cleaned);
      
      if (validation.valid) {
        setShowPlayIcon(true);
        setLinkError('');
      } else {
        setShowPlayIcon(false);
        setLinkError(validation.error || 'Unable to load audio from this link');
      }
    }
  };

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setCustomLink(newVal);
    setLinkError('');
    
    if (!newVal.trim()) {
      setShowPlayIcon(false);
      return;
    }

    // Check if it looks like a URL before validating
    try {
      new URL(newVal.trim());
      const validation = validateAudioLink(newVal);
      if (validation.valid) {
        setShowPlayIcon(true);
        setLinkError('');
      } else {
        setShowPlayIcon(false);
        // Show error immediately for unsupported platforms
        if (validation.error) {
          setLinkError(validation.error);
        }
      }
    } catch {
      // Not a valid URL yet, don't show error while typing
      setShowPlayIcon(false);
    }
  };

  const getSongImageUrl = (songId: string, songName: string): string => {
    let hash = 0;
    const str = songId || songName || 'default';
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % FALLBACK_IMAGES.length;
    return FALLBACK_IMAGES[index];
  };

  const handleAddCustomSong = () => {
    if (!customLink.trim()) {
      setLinkError('Please enter a URL');
      return;
    }

    const finalUrl = cleanUrl(customLink);
    
    const validation = validateAudioLink(finalUrl);
    if (!validation.valid) {
      setLinkError(validation.error || 'This link is not supported. Try YouTube, Vimeo, or direct audio links (.mp3, .wav)');
      setShowPlayIcon(false);
      return;
    }
    
    const songId = `custom-${Date.now()}`;
    const { isStreaming, platform } = isStreamingUrl(finalUrl);
    const isAudioFile = isDirectAudioFile(finalUrl);
    
    // Get thumbnail for YouTube, or use fallback
    let imageUrl: string;
    const youtubeThumbnail = getYouTubeThumbnail(customLink); // Use original URL to get video ID
    if (youtubeThumbnail) {
      imageUrl = youtubeThumbnail;
    } else {
      imageUrl = getSongImageUrl(songId, 'Custom Audio');
    }
    
    // Determine name based on source type
    let songName = 'Custom Audio';
    let songDuration = 'Custom • Live';
    
    if (platform) {
      songName = `${platform} Audio`;
      songDuration = `${platform} • Stream`;
    } else if (isAudioFile) {
      // Try to extract filename from URL
      try {
        const urlPath = new URL(finalUrl).pathname;
        const filename = urlPath.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'Audio File';
        songName = decodeURIComponent(filename).substring(0, 30);
        songDuration = 'Audio File';
      } catch {
        songName = 'Audio File';
        songDuration = 'Direct Link';
      }
    }
    
    const newSong: Song = {
      id: songId,
      name: songName,
      duration: songDuration,
      audioUrl: finalUrl,
      imageUrl,
      isCustom: true,
      subtitle: 'Custom',
    };
    
    onAddSong(newSong);
    
    // Reset input
    setCustomLink('');
    setShowPlayIcon(false);
    setLinkError('');
  };

  // Figma 61-4764: Each container (80×80) always visible; title + vinyl roll out directly from that container when hovered or active. Only one rollout at a time.
  if (isSidebar) {
    const activeTrackId = hoveredTrackId ?? selectedSongId ?? null;
    const getImageUrlForSong = (id: string, name: string) => songs.find((s) => s.id === id)?.imageUrl || getSongImageUrl(id, name);
    const songCount = songs.length;

    // Reveal in/out: same pattern as WatchfacePickerPanel — content container fades in after panel has slid in, fades out when closing
    const contentRevealed = panelSlidIn && !isClosing;
    const contentTransitionMs = 160;
    const contentEase = 'cubic-bezier(0.22, 1, 0.36, 1)';

    return (
      <>
        <div className="content-stretch flex flex-col flex-1 min-h-0 w-full">
          {/* Scroll: vinyl list aligned bottom-right; staggered entrance from bottom to top (same as watchface panel, reversed). Container reveal matches theme/watchface sidepanel. */}
          <div
            className="content-stretch flex flex-col gap-[48px] items-end justify-center w-full flex-1 min-h-0 overflow-y-auto scrollbar-hide"
            style={{
              opacity: contentRevealed ? 1 : 0,
              transform: contentRevealed ? 'translateX(0)' : 'translateX(12px)',
              transition: `opacity ${contentTransitionMs}ms ${contentEase}, transform ${contentTransitionMs}ms ${contentEase}`,
              transitionDelay: contentRevealed ? '30ms' : '0ms',
            }}
          >
            {songs.map((song, index) => {
              const visible = cardsVisible && !isClosing;
              // Open: bottom-to-top stagger (last item first). Close: top-to-bottom (first item first).
              const delayMs = isClosing ? index * CARD_STAGGER_MS : (songCount - 1 - index) * CARD_STAGGER_MS;
              const fromBottom = 28;
              const scaleFrom = 0.94;
              return (
                <div
                  key={song.id}
                  className="origin-bottom shrink-0"
                  style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0) scale(1)' : `translateY(${fromBottom}px) scale(${scaleFrom})`,
                    transition: `opacity ${CARD_ANIMATION_MS}ms ${EASE_OUT}, transform ${CARD_ANIMATION_MS}ms ${EASE_OUT}`,
                    transitionDelay: `${delayMs}ms`,
                  }}
                >
                  <SidebarTrackRow
                    song={song}
                    isActive={activeTrackId === song.id}
                    onSelect={() => onSelectSong(song.id)}
                    onMouseEnter={() => setHoveredTrackId(song.id)}
                    onMouseLeave={() => setHoveredTrackId(null)}
                    getImageUrl={getImageUrlForSong}
                  />
                </div>
              );
            })}
          </div>

          {/* Select your mood + close button: same slot and styling as CD (Open Sidepanel) button in Home. Vertical: CD bar has 1rem bottom + container p-4/sm:p-5/lg:p-6 → button 32/36/40px from bottom; panel has 10px → add pb 22/26/30. Horizontal: CD container p-4/sm:p-5/lg:p-6 → 16/20/24px from right; panel padding 24px → add negative mr so button sits 16/20/24px from panel right. */}
          <div className="content-stretch flex gap-[16px] items-center justify-end relative shrink-0 w-full pb-[22px] sm:pb-[26px] lg:pb-[30px] -mr-2 sm:-mr-1 lg:mr-0">
            <div className="content-stretch flex flex-col items-end justify-center shrink-0" style={{ width: 133 }}>
              <p className="font-['SF_Pro:Regular',sans-serif] font-normal text-[16px] text-[#6d6d6d] text-right w-full leading-[24px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                Select your mood
              </p>
            </div>
            {/* Same slot as Home: CD button lives here when closed; X (same styling) when panel open */}
            <div
              className="flex justify-end items-end shrink-0 transition-transform duration-300"
              style={{ transform: panelSlidIn && !isClosing ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className={`flex items-center justify-center rounded-full size-12 sm:size-14 transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  themeMode === 'light'
                    ? 'bg-white/90 shadow-[0_2px_8px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.8)] text-[#5a5a5a] focus-visible:ring-[#888]'
                    : 'bg-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.2)] text-[#c0c0c0] focus-visible:ring-white/40'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4 shrink-0">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <style>{SIDEBAR_ROLLOUT_STYLES + `.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
      </>
    );
  }

  // Modal layout (default)
  return (
    <>
      <div className="content-stretch flex flex-col sm:flex-row items-start justify-between w-full p-4 sm:p-5 md:p-6 gap-4 shrink-0">
        <div className="relative shrink-0 min-w-0 flex-1">
          <p className="font-['SF_Pro:Medium',sans-serif] font-[510] leading-none relative shrink-0 text-[#c3c3c3] text-2xl sm:text-[40px] md:text-[64px] whitespace-pre-wrap" style={{ fontVariationSettings: "'wdth' 100" }}>
            Select Sound
          </p>
        </div>
        <div className="relative shrink-0 flex justify-end">
          <button onClick={onClose} className="bg-[#282828] relative rounded-full shrink-0 size-10 sm:size-12 cursor-pointer hover:bg-[#333] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Close">
            <div className="overflow-clip relative shrink-0 size-[24px]">
              <svg className="block size-full" fill="none" viewBox="0 0 12.728 12.728">
                <path d={svgPaths.p1eba9480} fill="var(--fill-0, #F5F5F3)" />
              </svg>
            </div>
          </button>
        </div>
      </div>

      <div className="content-stretch flex flex-col gap-4 sm:gap-6 items-end w-full max-w-[615px] mx-auto px-4 sm:px-6 md:px-8 flex-1 min-h-0 overflow-y-auto scrollbar-hide">
        {songs.map((song) => (
          <div key={song.id} className="w-full">
            <SongItem
              compact={false}
              song={song}
              onSelect={() => onSelectSong(song.id)}
              onDelete={song.isCustom && onDeleteSong ? () => onDeleteSong(song.id) : undefined}
              isSelected={selectedSongId === song.id}
            />
            <div className="bg-[#e0e0e0] h-px shrink-0 w-full mt-4 sm:mt-6" />
          </div>
        ))}

        <div className="w-full">
          <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] sm:flex-row gap-3 sm:gap-6 items-stretch sm:items-center relative shrink-0 w-full">
            <div className="content-stretch flex flex-col gap-[8px] items-start leading-[normal] min-h-px min-w-px relative">
              <p className="font-['SF_Pro:Medium',sans-serif] font-[510] relative shrink-0 text-[#111] text-[14px] w-full whitespace-pre-wrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                Add your own
              </p>
              <div className="relative w-full">
                <input
                  type="text"
                  value={customLink}
                  onChange={handleLinkChange}
                  onPaste={handleLinkPaste}
                  onKeyDown={(e) => e.key === 'Enter' && showPlayIcon && handleAddCustomSong()}
                  placeholder="Paste your link here"
                  className={`block cursor-text font-['SF_Pro:Regular',sans-serif] font-normal overflow-hidden relative shrink-0 text-[16px] md:text-[20px] text-ellipsis w-full whitespace-nowrap bg-transparent border-none outline-none ${linkError ? 'text-[#ff4444]' : 'text-[#bdbdbd] placeholder:text-[#bdbdbd]'}`}
                  style={{ fontVariationSettings: "'wdth' 100" }}
                />
                {linkError && <p className="absolute top-full left-0 mt-2 text-[#ff4444] text-[12px] font-['SF_Pro:Regular',sans-serif]">{linkError}</p>}
              </div>
            </div>
            <button onClick={handleAddCustomSong} disabled={!showPlayIcon} className={`relative rounded-full shrink-0 size-12 sm:size-14 group cursor-pointer transition-all min-h-[48px] min-w-[48px] ${!showPlayIcon ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}>
              <div className="content-stretch flex items-center justify-center overflow-clip p-[2px] relative rounded-[inherit] size-full">
                <div className="relative shrink-0 size-[17.657px]">
                  {showPlayIcon ? (
                    <svg className="block size-full" fill="none" viewBox="0 0 18 18"><path d="M4 2 L16 9 L4 16 Z" fill="#666" /></svg>
                  ) : (
                    <svg className="block size-full" fill="none" viewBox="0 0 17.657 17.657"><path d={svgPaths.p2c58ed00} fill="var(--fill-0, #BDBDBD)" /></svg>
                  )}
                </div>
              </div>
              <div aria-hidden="true" className={`absolute border-2 border-solid inset-0 pointer-events-none rounded-[48px] ${showPlayIcon ? 'border-[#666]' : 'border-[#e0e0e0]'}`} />
            </button>
          </div>
        </div>
      </div>

      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </>
  );
}

export function SoundPickerModal({ 
  isOpen, 
  onClose, 
  songs, 
  onAddSong, 
  onSelectSong,
  onDeleteSong,
  selectedSongId 
}: SoundPickerModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-[#ededed] size-full overflow-hidden pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
      style={{ animation: 'fadeIn 0.4s ease-in-out' }}
    >
      <SoundPickerContent
        onClose={onClose}
        songs={songs}
        onAddSong={onAddSong}
        onSelectSong={onSelectSong}
        onDeleteSong={onDeleteSong}
        selectedSongId={selectedSongId}
      />
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1760346738721-235e811f573d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsby1maSUyMGFic3RyYWN0JTIwYmFja2dyb3VuZHxlbnwxfHx8fDE3Njk4MDYxMzF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1736176421274-546a4eaf57d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMG11c2ljJTIwd2F2ZWZvcm1zJTIwZ3JhZGllbnR8ZW58MXx8fHwxNzY5ODA2MTMxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1765046255479-669cf07a0230?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwc291bmQlMjB3YXZlc3xlbnwxfHx8fDE3Njk4MDYxMzF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1682943827405-6261f5540d68?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGF1ZGlvJTIwc3BlY3RydW18ZW58MXx8fHwxNzY5ODA2MTMxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
];

function SongItem({ song, onSelect, onDelete, isSelected, compact }: { song: Song; onSelect: () => void; onDelete?: () => void; isSelected: boolean; compact?: boolean }) {
  const [imageError, setImageError] = useState(false);
  const [randomImageUrl, setRandomImageUrl] = useState('');

  useEffect(() => {
    if (!song.imageUrl || imageError) {
      let hash = 0;
      const str = song.id || song.name || 'default';
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
      }
      const index = Math.abs(hash) % FALLBACK_IMAGES.length;
      setRandomImageUrl(FALLBACK_IMAGES[index]);
    }
  }, [song.imageUrl, song.id, song.name, imageError]);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the song when deleting
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <div className={`content-stretch flex items-center relative shrink-0 w-full min-w-0 group cursor-pointer ${compact ? 'gap-2' : 'gap-3 sm:gap-6'}`} onClick={onSelect}>
      {/* Image */}
      <div className={`overflow-clip pointer-events-none relative rounded shrink-0 flex-shrink-0 ${compact ? 'size-10 rounded-lg' : 'size-12 sm:size-14'}`}>
        <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 rounded-lg size-full top-1/2">
          <div aria-hidden="true" className="absolute inset-0 rounded-[8px]">
            <div className="absolute bg-[#d9d9d9] inset-0 rounded-[8px]" />
            {song.imageUrl && !imageError ? (
              <img 
                alt="" 
                className="absolute max-w-none object-cover rounded-[8px] size-full" 
                src={song.imageUrl}
                onError={() => setImageError(true)}
              />
            ) : (
              <img 
                alt="" 
                className="absolute max-w-none object-cover rounded-[8px] size-full" 
                src={randomImageUrl}
              />
            )}
          </div>
          <div aria-hidden="true" className="absolute border-2 border-[#d8d8d8] border-solid inset-0 rounded-[8px]" />
          <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0px_4px_8px_4px_rgba(0,0,0,0.25)]" />
        </div>
        <div className="absolute inset-0 rounded-[inherit] shadow-[inset_-1px_-1px_4px_0px_rgba(0,0,0,0.02),inset_2px_2px_4px_1px_rgba(0,0,0,0.08)]" />
      </div>

      {/* Title */}
      <div className="content-stretch flex flex-col gap-0.5 items-start leading-[normal] relative shrink-0 flex-1 min-w-0">
        <p className={`font-['SF_Pro:Regular',sans-serif] font-normal relative shrink-0 text-[#111] w-full truncate ${compact ? 'text-sm' : 'text-base sm:text-lg md:text-xl'}`} style={{ fontVariationSettings: "'wdth' 100" }}>
          {song.name}
        </p>
        <p className={`font-['SF_Pro:Medium',sans-serif] font-[510] relative shrink-0 text-[#bdbdbd] w-full ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`} style={{ fontVariationSettings: "'wdth' 100" }}>
          {song.duration}
        </p>
      </div>

      {/* Delete Button - only for custom songs */}
      {onDelete && (
        <button
          onClick={handleDelete}
          className={`relative shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:scale-110 touch-manipulation flex items-center justify-center ${compact ? 'size-8 min-h-[32px] min-w-[32px]' : 'size-9 sm:size-10 min-h-[44px] min-w-[44px]'}`}
          title="Remove"
        >
          <svg className="block size-full" fill="none" viewBox="0 0 24 24">
            <path 
              d="M6 6L18 18M6 18L18 6" 
              stroke="#bdbdbd" 
              strokeWidth="2" 
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}

      {/* Play Button */}
      <div className={`relative shrink-0 group-hover:scale-105 transition-transform flex-shrink-0 ${compact ? 'size-10' : 'size-12 sm:size-14'}`}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 56 56">
          <g id="Play">
            <rect 
                height="54" 
                rx="27" 
                stroke={isSelected ? "#666" : "var(--stroke-0, #E0E0E0)"} 
                strokeWidth={isSelected ? "3" : "2"} 
                width="54" 
                x="1" 
                y="1" 
            />
            <g id="Play_2">
              <g filter="url(#filter0_i_40_108)">
                <path d={svgPaths.p157b8080} fill="url(#paint0_linear_40_108)" />
              </g>
              <path d={svgPaths.pec34000} stroke="url(#paint1_linear_40_108)" strokeWidth="0.5" />
            </g>
          </g>
          <defs>
            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="20.4314" id="filter0_i_40_108" width="12.71" x="23.5" y="19.7843">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
              <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
              <feOffset dy="4" />
              <feGaussianBlur stdDeviation="2" />
              <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
              <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
              <feBlend in2="shape" mode="normal" result="effect1_innerShadow_40_108" />
            </filter>
            <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_40_108" x1="37" x2="18.01" y1="28" y2="33.3632">
              <stop stopColor="#666666" />
              <stop offset="1" />
            </linearGradient>
            <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_40_108" x1="37" x2="19" y1="28" y2="28">
              <stop />
              <stop offset="1" stopColor="#666666" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
