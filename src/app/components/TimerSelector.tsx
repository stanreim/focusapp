import { useState, useEffect } from 'react';
import { hapticSounds } from '@/app/hooks/useHapticSound';

interface TimerSelectorProps {
  onSelect: (minutes: number) => void;
  onCancel: () => void;
}

export function TimerSelector({ onSelect, onCancel }: TimerSelectorProps) {
  const durations = [15, 30, 45, 60]; // minutes

  // Responsive sizing
  const getButtonSize = () => {
    if (typeof window !== 'undefined') {
      const vw = window.innerWidth;
      
      if (vw < 640) {
        return 'text-3xl sm:text-4xl'; // Mobile
      } else if (vw < 1024) {
        return 'text-5xl'; // Tablet
      }
      return 'text-6xl'; // Desktop
    }
    return 'text-6xl';
  };

  const [buttonSize, setButtonSize] = useState(getButtonSize());

  useEffect(() => {
    const handleResize = () => {
      setButtonSize(getButtonSize());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
      style={{
        opacity: 1,
        transition: 'opacity 0.3s ease-in-out',
        zIndex: 9999,
      }}
    >
      <div className="flex flex-col items-center gap-4 sm:gap-6 lg:gap-8">
        <div className="text-white/60 text-xs sm:text-sm tracking-widest font-light mb-2 sm:mb-4">
          SELECT DURATION
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          {durations.map((duration) => (
            <button
              key={duration}
              onClick={(e) => {
                e.stopPropagation();
                hapticSounds.thud();
                onSelect(duration);
              }}
              className={`${buttonSize} font-extralight text-[#6d6d6d] hover:text-[#4a4a4a] relative w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 flex items-center justify-center rounded-[112px] shrink-0 transition-all duration-300 hover:scale-110 bg-white shadow-[0px_4px_8px_-3px_rgba(0,0,0,0.54)]`}
            >
              {duration}
              <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_2px_0px_12px_-3px_rgba(0,0,0,0.12),inset_0px_8px_9px_-7px_rgba(0,0,0,0.08)]" />
            </button>
          ))}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          className="mt-4 sm:mt-6 text-white/40 hover:text-white/60 text-xs sm:text-sm tracking-widest font-light transition-colors duration-200"
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}
