import { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import svgPaths from "@/imports/svg-8dn7ashjpm";

interface Song {
  id: string;
  name: string;
  duration: string;
  audioUrl: string;
  imageUrl?: string;
  isCustom?: boolean;
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

export function SoundPickerModal({ 
  isOpen, 
  onClose, 
  songs, 
  onAddSong, 
  onSelectSong,
  onDeleteSong,
  selectedSongId 
}: SoundPickerModalProps) {
  const [customLink, setCustomLink] = useState('');
  const [linkError, setLinkError] = useState('');
  const [showPlayIcon, setShowPlayIcon] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCustomLink('');
      setLinkError('');
      setShowPlayIcon(false);
    }
  }, [isOpen]);

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
    };
    
    onAddSong(newSong);
    
    // Reset input
    setCustomLink('');
    setShowPlayIcon(false);
    setLinkError('');
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-[#ededed] size-full overflow-hidden"
      style={{ animation: 'fadeIn 0.4s ease-in-out' }}
    >
      {/* Top Bar */}
      <div className="absolute content-stretch flex items-start justify-between left-0 top-0 w-full p-[24px]">
        <div className="relative shrink-0 w-[321px]">
          <p className="font-['SF_Pro:Medium',sans-serif] font-[510] leading-none relative shrink-0 text-[#c3c3c3] text-[40px] md:text-[64px] whitespace-pre-wrap" style={{ fontVariationSettings: "'wdth' 100" }}>
            Select Sound
          </p>
        </div>
        
        <div className="relative shrink-0 flex justify-end w-[321px]">
          <button 
            onClick={onClose}
            className="bg-[#282828] relative rounded-[88px] shrink-0 size-[48px] cursor-pointer hover:bg-[#333] transition-colors"
          >
            <div className="content-stretch flex items-center justify-center overflow-clip px-[8px] py-[9px] relative rounded-[inherit] size-full">
              <div className="overflow-clip relative shrink-0 size-[24px]">
                <div className="absolute inset-[23.48%]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.728 12.728">
                    <g id="Group">
                      <path d={svgPaths.p1eba9480} fill="var(--fill-0, #F5F5F3)" />
                    </g>
                  </svg>
                </div>
              </div>
            </div>
            <div aria-hidden="true" className="absolute border border-solid border-white inset-0 pointer-events-none rounded-[88px]" />
          </button>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="-translate-x-1/2 -translate-y-1/2 absolute content-stretch flex flex-col gap-[24px] items-end left-1/2 top-1/2 w-full max-w-[615px] px-4 md:px-0 max-h-[70vh] overflow-y-auto scrollbar-hide">
        {songs.map((song, index) => (
          <div key={song.id} className="w-full">
            <SongItem 
              song={song} 
              onSelect={() => onSelectSong(song.id)}
              onDelete={song.isCustom && onDeleteSong ? () => onDeleteSong(song.id) : undefined}
              isSelected={selectedSongId === song.id}
            />
            {/* Separator */}
            <div className="bg-[#e0e0e0] h-px shrink-0 w-full mt-[24px]" />
          </div>
        ))}

        {/* Add Custom Section */}
        <div className="w-full">
          <div className="content-stretch flex gap-[24px] items-center relative shrink-0 w-full">
            <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start leading-[normal] min-h-px min-w-px relative">
              <p className="font-['SF_Pro:Medium',sans-serif] font-[510] relative shrink-0 text-[#111] text-[14px] w-full whitespace-pre-wrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                Add your own
              </p>
              
              <div className="relative w-full">
                <input
                  type="text"
                  value={customLink}
                  onChange={handleLinkChange}
                  onPaste={handleLinkPaste}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && showPlayIcon) {
                      handleAddCustomSong();
                    }
                  }}
                  placeholder="Paste your link here"
                  className={`block cursor-text font-['SF_Pro:Regular',sans-serif] font-normal overflow-hidden relative shrink-0 text-[16px] md:text-[20px] text-ellipsis w-full whitespace-nowrap bg-transparent border-none outline-none ${linkError ? 'text-[#ff4444]' : 'text-[#bdbdbd] placeholder:text-[#bdbdbd]'}`}
                  style={{ fontVariationSettings: "'wdth' 100" }}
                />
                {linkError && (
                  <p className="absolute top-full left-0 mt-2 text-[#ff4444] text-[12px] font-['SF_Pro:Regular',sans-serif]">{linkError}</p>
                )}
              </div>
            </div>

            <button
               onClick={handleAddCustomSong}
               disabled={!showPlayIcon}
               className={`relative rounded-[48px] shrink-0 size-[56px] group cursor-pointer transition-all ${!showPlayIcon ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
            >
              <div className="content-stretch flex items-center justify-center overflow-clip p-[2px] relative rounded-[inherit] size-full">
                <div className="relative shrink-0 size-[17.657px]">
                  {showPlayIcon ? (
                     <svg className="block size-full" fill="none" viewBox="0 0 18 18">
                        <path d="M4 2 L16 9 L4 16 Z" fill="#666" />
                     </svg>
                  ) : (
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.657 17.657">
                      <g id="Group">
                        <path d={svgPaths.p2c58ed00} fill="var(--fill-0, #BDBDBD)" />
                      </g>
                    </svg>
                  )}
                </div>
              </div>
              <div aria-hidden="true" className={`absolute border-2 border-solid inset-0 pointer-events-none rounded-[48px] ${showPlayIcon ? 'border-[#666]' : 'border-[#e0e0e0]'}`} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
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

function SongItem({ song, onSelect, onDelete, isSelected }: { song: Song; onSelect: () => void; onDelete?: () => void; isSelected: boolean }) {
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
    <div className="content-stretch flex gap-[24px] items-center relative shrink-0 w-full group cursor-pointer" onClick={onSelect}>
      {/* Image */}
      <div className="overflow-clip pointer-events-none relative rounded-[4px] shrink-0 size-[56px]">
        <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 rounded-[8px] size-[56px] top-1/2">
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
      <div className="content-stretch flex flex-col gap-[8px] items-start leading-[normal] relative shrink-0 flex-1 whitespace-pre-wrap min-w-0">
        <p className="font-['SF_Pro:Regular',sans-serif] font-normal relative shrink-0 text-[#111] text-[20px] w-full truncate" style={{ fontVariationSettings: "'wdth' 100" }}>
          {song.name}
        </p>
        <p className="font-['SF_Pro:Medium',sans-serif] font-[510] relative shrink-0 text-[#bdbdbd] text-[14px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
          {song.duration}
        </p>
      </div>

      {/* Delete Button - only for custom songs */}
      {onDelete && (
        <button
          onClick={handleDelete}
          className="relative shrink-0 size-[40px] opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
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
      <div className="relative shrink-0 size-[56px] group-hover:scale-105 transition-transform">
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
