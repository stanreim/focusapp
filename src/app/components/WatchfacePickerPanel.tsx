// Watchface Picker Side Panel — Figma 61-4364 (Sidepanel frame)
import { useEffect, useRef, useState } from 'react';

const WATCHFACE_IDS = [0, 1, 2, 3, 4] as const;
const WATCHFACE_IMAGES = WATCHFACE_IDS.map((i) => `/assets/Watchfaces/Watchface-${i}.png`);

// From Figma: Sidepanel 282×1000, layoutMode VERTICAL, itemSpacing 16, fills []
const PANEL_WIDTH = 282;
const CARD_WIDTH = 234;
const CARD_HEIGHT = 176;
const PADDING_H = 24;
const ITEM_SPACING = 16;
const CARD_STAGGER_MS = 100;
// 1.3s entrance: opacity 0 → 1 (transparent to fully visible) for smooth fade-in
const CARD_ANIMATION_MS = 1300;
// Smooth deceleration curve — feels natural and polished
const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';
// Gentle ease for panel slide
const EASE_PANEL = 'cubic-bezier(0.32, 0.72, 0, 1)';

export interface WatchfacePickerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWatchface: (index: number) => void;
  onPreviewBackground?: (index: number | null) => void;
  selectedWatchfaceIndex: number;
  themeMode?: 'light' | 'dark' | 'color';
}

export function WatchfacePickerPanel({
  isOpen,
  onClose,
  onSelectWatchface,
  onPreviewBackground,
  selectedWatchfaceIndex,
  themeMode = 'light',
}: WatchfacePickerPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [slidIn, setSlidIn] = useState(false);
  const [cardsVisible, setCardsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Panel slide-in
  useEffect(() => {
    if (!isOpen) return;
    setSlidIn(false);
    setCardsVisible(false);
    setIsExiting(false);
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setSlidIn(true));
    });
    return () => cancelAnimationFrame(raf);
  }, [isOpen]);

  // After panel has slid in, start staggered card entrance (0.1s delay between each)
  useEffect(() => {
    if (!isOpen || !slidIn) return;
    const t = setTimeout(() => setCardsVisible(true), 80);
    return () => clearTimeout(t);
  }, [isOpen, slidIn]);

  // Close handlers: start exit animation, then call onClose after it finishes
  const requestClose = () => {
    if (isExiting) return;
    setIsExiting(true);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        requestClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // When exiting, wait for reverse stagger + animation then call onClose
  useEffect(() => {
    if (!isExiting) return;
    const totalExitMs =
      (WATCHFACE_IDS.length - 1) * CARD_STAGGER_MS + CARD_ANIMATION_MS;
    const t = setTimeout(() => {
      onClose();
    }, totalExitMs);
    return () => clearTimeout(t);
  }, [isExiting, onClose]);

  // Parent controls preview on open/close; we only preview on hover (mouse enter/leave)

  // When panel opens, scroll so the selected watchface is in view
  useEffect(() => {
    if (!isOpen || !slidIn || !panelRef.current) return;
    const cardHeight = CARD_HEIGHT + ITEM_SPACING;
    const scrollTop = Math.max(0, selectedWatchfaceIndex * cardHeight - 24);
    const t = setTimeout(() => {
      if (panelRef.current) {
        panelRef.current.scrollTop = scrollTop;
      }
    }, 400);
    return () => clearTimeout(t);
  }, [isOpen, slidIn, selectedWatchfaceIndex]);

  if (!isOpen) return null;

  const cardCount = WATCHFACE_IDS.length;

  return (
    <>
      {/* Invisible backdrop: clicking outside the panel closes it */}
      <div
        className="fixed inset-0 z-40"
        aria-hidden
        onClick={requestClose}
        onMouseDown={requestClose}
      />
      <aside
        ref={panelRef}
        className="fixed top-0 right-0 z-50 h-full flex flex-col overflow-y-auto"
      style={{
        width: PANEL_WIDTH,
        transform: slidIn ? 'translateX(0)' : 'translateX(100%)',
        transition: `transform ${380}ms ${EASE_PANEL}`,
        paddingTop: 'max(24px, env(safe-area-inset-top))',
        paddingRight: 'max(24px, env(safe-area-inset-right))',
        paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
        paddingLeft: PADDING_H,
        gap: ITEM_SPACING,
      }}
      role="dialog"
      aria-label="Choose watchface"
    >
      {WATCHFACE_IDS.map((index) => {
        const visible = isExiting ? false : cardsVisible;
        const delayMs = isExiting
          ? (cardCount - 1 - index) * CARD_STAGGER_MS
          : index * CARD_STAGGER_MS;
        const fromRight = 28;
        const scaleFrom = 0.94;
        const isSelected = index === selectedWatchfaceIndex;
        return (
          <button
            key={index}
            type="button"
            onClick={() => {
              onSelectWatchface(index);
              requestClose();
            }}
            onMouseEnter={() => onPreviewBackground?.(index)}
            onMouseLeave={() => onPreviewBackground?.(selectedWatchfaceIndex)}
            aria-pressed={isSelected}
            aria-label={`Watchface ${index + 1}${isSelected ? ' (selected)' : ''}`}
            className="overflow-hidden rounded-lg border-2 border-transparent outline-none shadow-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:ring-white/50 shrink-0 self-stretch origin-right transition-transform active:scale-[0.98] [box-shadow:none]"
            style={{
              width: CARD_WIDTH,
              height: CARD_HEIGHT,
              boxShadow: 'none',
              // Fade: 0 (fully transparent) → 1 (fully opaque) over 1s
              opacity: visible ? 1 : 0,
              transform: visible
                ? 'translateX(0) scale(1)'
                : `translateX(${fromRight}px) scale(${scaleFrom})`,
              transition: `opacity ${CARD_ANIMATION_MS}ms ${EASE_OUT}, transform ${CARD_ANIMATION_MS}ms ${EASE_OUT}`,
              transitionDelay: `${delayMs}ms`,
            }}
            data-name="WatchfaceCard"
          >
            <img
              src={WATCHFACE_IMAGES[index]}
              alt={`Watchface ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        );
      })}
    </aside>
    </>
  );
}
