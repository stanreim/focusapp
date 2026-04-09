// Menu flyout — Zeno-Day "Menu / Flyout"; fill #FFFFFF; anchored under top bar menu (61:3718)
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

/** Snapshot of `getBoundingClientRect()` — avoid storing live `DOMRect` in React state */
export type MenuFlyoutAnchor = {
  top: number;
  left: number;
  bottom: number;
};

export interface MenuFlyoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  anchor: MenuFlyoutAnchor | null;
}

const FLYOUT_MIN_WIDTH = 265;
const GAP_BELOW_MENU_PX = 8;
const VIEWPORT_PAD = 16;

const LINKS: { label: string; href: string }[] = [
  { label: 'Explore other apps', href: 'https://stanreimgen.space/' },
  { label: 'Follow the builder journey', href: 'https://www.linkedin.com/in/stanreimgen/' },
  { label: 'Legal & imprint', href: 'https://heyalma.app/imprint' },
];

function MenuLinkRow({ label, href, onNavigate }: { label: string; href: string; onNavigate: () => void }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onNavigate}
      className="content-stretch flex gap-1 items-start relative shrink-0 outline-none rounded-md focus-visible:ring-2 focus-visible:ring-[#111]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      data-name="Button / Link"
    >
      <span
        className="font-['SF_Pro:Medium',sans-serif] font-medium leading-normal relative shrink-0 text-[#111] text-[14px] whitespace-nowrap"
        style={{ fontVariationSettings: "'wdth' 100" }}
      >
        {label}
      </span>
      <ArrowRight className="size-4 shrink-0 text-[#111]" strokeWidth={1.5} aria-hidden />
    </a>
  );
}

export function MenuFlyoutModal({ isOpen, onClose, anchor }: MenuFlyoutModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onResize = () => onClose();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isOpen, onClose]);

  const open = isOpen && anchor != null;

  const flyoutStyle =
    anchor != null && typeof window !== 'undefined'
      ? (() => {
          const maxLeft = Math.max(
            VIEWPORT_PAD,
            window.innerWidth - FLYOUT_MIN_WIDTH - VIEWPORT_PAD,
          );
          const left = Math.min(Math.max(anchor.left, VIEWPORT_PAD), maxLeft);
          return {
            top: anchor.bottom + GAP_BELOW_MENU_PX,
            left,
          } as const;
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
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1',
            'fixed z-[60] w-[min(265px,calc(100vw-2rem))] rounded-[24px] border border-[#e0e0e0] border-solid bg-white p-4 shadow-lg duration-200',
            'flex flex-col gap-6 items-start outline-none',
            'max-h-[min(90dvh,calc(100vh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2rem))] overflow-y-auto',
          )}
          style={flyoutStyle}
          data-name="Menu / Flyout"
        >
          <DialogPrimitive.Title className="sr-only">About Zeno</DialogPrimitive.Title>
          <p
            className="font-['SF_Pro:Medium',sans-serif] font-medium leading-normal min-w-0 w-full shrink-0 text-[14px] text-black"
            style={{ fontVariationSettings: "'wdth' 100" }}
            data-node-id="94:3184"
          >
            Zeno (&ldquo;Zero Noise&rdquo;) is a minimalistic approach for daily focus time.
          </p>
          <p
            className="font-['SF_Pro:Medium',sans-serif] font-medium leading-normal min-w-0 w-full shrink-0 text-[#9f9f9f] text-[14px]"
            style={{ fontVariationSettings: "'wdth' 100" }}
            data-node-id="94:3187"
          >
            Zeno is part of a family of apps by Stan Reimgen, designed around calm software and mindful living.
          </p>
          <div className="bg-[#e0e0e0] h-px shrink-0 w-[233px] max-w-full" data-node-id="94:3210" aria-hidden />
          <div className="content-stretch flex flex-col gap-2 items-start relative shrink-0 w-full" data-node-id="94:3209">
            {LINKS.map(({ label, href }) => (
              <MenuLinkRow key={label} label={label} href={href} onNavigate={onClose} />
            ))}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
