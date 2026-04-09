import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Fragment, useEffect, useRef, useState } from 'react';
import { cn } from '@/app/components/ui/utils';

export type SoundFlyoutAnchor = {
  top: number;
  left: number;
  right: number;
  bottom: number;
};

type FlyoutSong = {
  id: string;
  name: string;
  subtitle?: string;
  imageUrl?: string;
};

interface SoundPickerFlyoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  anchor: SoundFlyoutAnchor | null;
  songs: FlyoutSong[];
  selectedSongId?: string;
  onSelectSong: (songId: string) => void;
}

const VIEWPORT_PAD = 16;
const GAP_ABOVE_TRIGGER = 8;

function TrackVinyl({ imageUrl }: { imageUrl?: string }) {
  return (
    <div
      className="relative size-12 shrink-0 overflow-hidden rounded-full"
      style={{ boxShadow: '3px 8px 15px rgba(0,0,0,0.25), 0 4px 10px -3px rgba(179,179,179,0.25)' }}
    >
      <div
        data-vinyl-rotor
        className="size-full origin-center"
      >
        {imageUrl ? (
          <img src={imageUrl} alt="" className="block size-full object-cover" />
        ) : (
          <div className="size-full bg-gradient-to-br from-[#333] to-[#111]" />
        )}
      </div>
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 size-[12px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[inset_0_4px_4px_rgba(0,0,0,0.1),inset_1px_-3px_4px_rgba(0,0,0,0.2)]" />
    </div>
  );
}

export function SoundPickerFlyoutModal({
  isOpen,
  onClose,
  anchor,
  songs,
  selectedSongId,
  onSelectSong,
}: SoundPickerFlyoutModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onResize = () => onClose();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isOpen, onClose]);

  const open = isOpen && anchor != null;
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const rowListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) setHoveredRowId(null);
  }, [open]);

  // Anchor with right + bottom only (no transform) so entrance can be opacity-only without fighting translateY(-100%).
  const flyoutStyle =
    anchor != null && typeof window !== 'undefined'
      ? (() => {
          const anchorRight = anchor.right ?? window.innerWidth - VIEWPORT_PAD;
          const right = Math.max(VIEWPORT_PAD, window.innerWidth - anchorRight);
          const bottom = Math.max(
            VIEWPORT_PAD,
            window.innerHeight - anchor.top + GAP_ABOVE_TRIGGER,
          );
          return { right, bottom } as const;
        })()
      : undefined;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogPrimitive.Portal>
        {open && (
          <div
            className="fixed inset-0 z-[59] bg-transparent"
            aria-hidden
            onMouseDown={(e) => {
              e.preventDefault();
              onClose();
            }}
          />
        )}
        <DialogPrimitive.Content
          className={cn(
            'fixed z-[60] w-[200px] max-w-[calc(100vw-2rem)] rounded-[24px] border border-[#e5e5e5] border-solid p-4',
            'flex flex-col items-end outline-none',
            // Opacity-only open/close — no slide/zoom from tailwind animate-in
            'transition-opacity duration-200 ease-out',
            'data-[state=closed]:opacity-0 data-[state=open]:opacity-100',
          )}
          style={{
            ...flyoutStyle,
            background: '#FFFFFF',
            boxShadow: '0px 2px 8px rgba(0,0,0,0.06), 0px 1px 2px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)',
          }}
          data-name="Sound Picker / Flyout"
          data-sound-flyout
        >
          <style>{`
            @keyframes sound-flyout-vinyl-spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            [data-sound-flyout] [data-vinyl-rotor] {
              animation: sound-flyout-vinyl-spin 3.2s linear infinite;
              animation-play-state: paused;
            }
            [data-sound-flyout] button:hover [data-vinyl-rotor],
            [data-sound-flyout] button:focus-visible [data-vinyl-rotor] {
              animation-play-state: running;
            }
          `}</style>
          <DialogPrimitive.Title className="sr-only text-[14px]">Pick music or sound</DialogPrimitive.Title>
          <div
            ref={rowListRef}
            className="flex w-full min-w-0 flex-col items-end text-[14px] pointer-events-auto"
            onMouseLeave={() => setHoveredRowId(null)}
          >
            {songs.map((song, index) => (
              <Fragment key={song.id}>
                {index > 0 && (
                  <div
                    className="h-5 w-full shrink-0"
                    aria-hidden
                  />
                )}
                <button
                  type="button"
                  onMouseEnter={() => setHoveredRowId(song.id)}
                  onFocus={() => setHoveredRowId(song.id)}
                  onBlur={(e) => {
                    const next = e.relatedTarget as Node | null;
                    if (!next || !rowListRef.current?.contains(next)) {
                      setHoveredRowId(null);
                    }
                  }}
                  onClick={() => {
                    onSelectSong(song.id);
                    onClose();
                  }}
                  aria-pressed={song.id === selectedSongId}
                  className={cn(
                    'content-stretch flex w-full items-center justify-end gap-4 rounded-xl py-0.5 text-right outline-none',
                    'transition-opacity duration-200 ease-out',
                    hoveredRowId != null
                      ? hoveredRowId !== song.id && 'opacity-50'
                      : selectedSongId != null && selectedSongId !== song.id && 'opacity-50',
                    'focus-visible:ring-2 focus-visible:ring-[#111]/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e9e9e9]',
                  )}
                >
                  <div className="content-stretch flex min-w-0 max-w-full flex-col items-end justify-center text-right leading-[normal] [overflow-wrap:anywhere]">
                    <p
                      className={cn(
                        "font-['SF_Pro:Regular',sans-serif] font-normal text-[#6d6d6d]",
                        song.id === selectedSongId && 'text-[#4f4f4f]',
                      )}
                      style={{ fontVariationSettings: "'wdth' 100" }}
                    >
                      {song.name}
                    </p>
                  </div>
                  <TrackVinyl imageUrl={song.imageUrl} />
                </button>
              </Fragment>
            ))}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
