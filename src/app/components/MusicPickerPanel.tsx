// Music Picker Side Panel — Figma 61-4690 (Zeno-Day) "Home / Select Soundtrack"
import { useEffect, useRef, useState } from 'react';
import { SoundPickerContent, type Song } from './SoundPickerModal';

// From Figma 61-4690: Toggle frame w-[363px], px-[24px] py-[10px], gap-[48px], items-end, bg #EDEDED
const PANEL_WIDTH = 363;
const PADDING_H = 24;
const PADDING_V = 10;
const EASE_PANEL = 'cubic-bezier(0.32, 0.72, 0, 1)';
const PANEL_TRANSITION_MS = 190;
// Match SoundPickerModal stagger/animation for exit timing (50% faster)
const CARD_STAGGER_MS = 150;
const CARD_ANIMATION_MS = 225;

export interface MusicPickerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  songs: Song[];
  onAddSong: (song: Song) => void;
  onSelectSong: (songId: string) => void;
  onDeleteSong?: (songId: string) => void;
  selectedSongId?: string;
  themeMode?: 'light' | 'dark' | 'color';
}

export function MusicPickerPanel({
  isOpen,
  onClose,
  songs,
  onAddSong,
  onSelectSong,
  onDeleteSong,
  selectedSongId,
  themeMode = 'light',
}: MusicPickerPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const timeoutIds = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [slidIn, setSlidIn] = useState(false);
  const [cardsVisible, setCardsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const pendingSelectionRef = useRef<string | null>(null);
  const onCloseRef = useRef(onClose);
  const onSelectSongRef = useRef(onSelectSong);
  onCloseRef.current = onClose;
  onSelectSongRef.current = onSelectSong;
  const handleCloseRef = useRef<() => void>(() => {});

  // Sidebar slide-in from right
  useEffect(() => {
    if (!isOpen) return;
    setIsClosing(false);
    setSlidIn(false);
    setCardsVisible(false);
    pendingSelectionRef.current = null;
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setSlidIn(true));
    });
    return () => cancelAnimationFrame(raf);
  }, [isOpen]);

  // After panel has slid in, start staggered vinyl entrance (bottom to top)
  useEffect(() => {
    if (!isOpen || !slidIn || isClosing) return;
    const t = setTimeout(() => setCardsVisible(true), 80);
    return () => clearTimeout(t);
  }, [isOpen, slidIn, isClosing]);

  // When closing: after cards exit animation (top-to-bottom stagger), slide panel out, then call onClose
  useEffect(() => {
    if (!isClosing || !isOpen) return;
    const songCount = songs.length;
    const exitDuration = Math.max(0, (songCount - 1) * CARD_STAGGER_MS + CARD_ANIMATION_MS);
    const t1 = setTimeout(() => {
      setSlidIn(false);
      const t2 = setTimeout(() => {
        const pending = pendingSelectionRef.current;
        if (pending) onSelectSongRef.current(pending);
        onCloseRef.current();
      }, PANEL_TRANSITION_MS);
      timeoutIds.current.push(t2);
    }, exitDuration);
    timeoutIds.current.push(t1);
    return () => {
      timeoutIds.current.forEach(clearTimeout);
      timeoutIds.current = [];
    };
  }, [isClosing, isOpen, songs.length]);

  // Close on click outside or Escape (use ref so animated close sequence runs)
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCloseRef.current();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        handleCloseRef.current();
      }
    };
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setCardsVisible(false);
  };
  handleCloseRef.current = handleClose;

  const handleSelectSong = (songId: string) => {
    if (isClosing) return;
    pendingSelectionRef.current = songId;
    setIsClosing(true);
    setCardsVisible(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Invisible backdrop: same as Watchface panel — clicking outside closes */}
      <div
        className="fixed inset-0 z-40"
        aria-hidden
        onClick={handleClose}
        onMouseDown={handleClose}
      />
      <aside
        ref={panelRef}
        className="fixed top-0 right-0 z-50 h-full flex flex-col overflow-hidden bg-transparent"
        style={{
          width: PANEL_WIDTH,
          transform: slidIn ? 'translateX(0)' : 'translateX(100%)',
          transition: `transform ${PANEL_TRANSITION_MS}ms ${EASE_PANEL}`,
          paddingTop: `max(${PADDING_V}px, env(safe-area-inset-top))`,
          paddingRight: `max(${PADDING_H}px, env(safe-area-inset-right))`,
          paddingBottom: `max(${PADDING_V}px, env(safe-area-inset-bottom))`,
          paddingLeft: PADDING_H,
        }}
        role="dialog"
        aria-label="Pick music or sound"
      >
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <SoundPickerContent
            variant="sidebar"
            onClose={handleClose}
            songs={songs}
            onAddSong={onAddSong}
            onSelectSong={handleSelectSong}
            onDeleteSong={onDeleteSong}
            selectedSongId={selectedSongId}
            panelSlidIn={slidIn}
            cardsVisible={cardsVisible}
            isClosing={isClosing}
            themeMode={themeMode}
          />
        </div>
      </aside>
    </>
  );
}
