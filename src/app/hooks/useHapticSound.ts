/**
 * useHapticSound - Mechanical UI sound feedback
 * 
 * Generates subtle, physical-feeling sounds using Web Audio API.
 * Designed to feel like a real mechanical device: radio knobs, switches, dials.
 * 
 * Sound types:
 * - click: soft mechanical click (play/pause)
 * - tick: dial tick (volume changes)
 * - thud: soft confirmation (enter focus mode)
 * - pop: light pop (add todo)
 * - complete: pleasant chime for task completion
 * - success: triumphant multi-tone for achievements
 * - gentle: soft pleasant tone
 * - sparkle: magical sparkle effect
 */

// Singleton AudioContext to avoid browser limitations
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
      return null;
    }
  }
  
  // Resume if suspended (browser autoplay policy)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  
  return audioContext;
};

type SoundType = 'click' | 'tick' | 'thud' | 'pop' | 'complete' | 'success' | 'gentle' | 'sparkle';

interface SoundConfig {
  type: OscillatorType;
  frequency: number;
  frequencyEnd?: number;
  attack: number;
  decay: number;
  gain: number;
}

const soundConfigs: Record<SoundType, SoundConfig> = {
  click: {
    type: 'triangle',
    frequency: 800,
    attack: 0,
    decay: 0.015,
    gain: 0.1,
  },
  tick: {
    type: 'sine',
    frequency: 1200,
    attack: 0,
    decay: 0.008,
    gain: 0.05,
  },
  thud: {
    type: 'sine',
    frequency: 200,
    frequencyEnd: 100,
    attack: 0.005,
    decay: 0.08,
    gain: 0.15,
  },
  pop: {
    type: 'sine',
    frequency: 600,
    frequencyEnd: 400,
    attack: 0,
    decay: 0.03,
    gain: 0.08,
  },
  // New pleasant sounds
  complete: {
    type: 'sine',
    frequency: 880, // A5 note
    attack: 0.01,
    decay: 0.3,
    gain: 0.12,
  },
  success: {
    type: 'sine',
    frequency: 523, // C5
    attack: 0.01,
    decay: 0.4,
    gain: 0.1,
  },
  gentle: {
    type: 'sine',
    frequency: 440, // A4
    attack: 0.02,
    decay: 0.25,
    gain: 0.08,
  },
  sparkle: {
    type: 'sine',
    frequency: 1318, // E6
    attack: 0,
    decay: 0.15,
    gain: 0.06,
  },
};

const playSound = (soundType: SoundType): void => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const config = soundConfigs[soundType];
  const now = ctx.currentTime;

  // Create oscillator
  const oscillator = ctx.createOscillator();
  oscillator.type = config.type;
  oscillator.frequency.setValueAtTime(config.frequency, now);
  
  // Apply pitch bend if configured
  if (config.frequencyEnd) {
    oscillator.frequency.exponentialRampToValueAtTime(
      config.frequencyEnd,
      now + config.attack + config.decay
    );
  }

  // Create gain envelope
  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0, now);
  
  // Attack
  if (config.attack > 0) {
    gainNode.gain.linearRampToValueAtTime(config.gain, now + config.attack);
  } else {
    gainNode.gain.setValueAtTime(config.gain, now);
  }
  
  // Decay
  gainNode.gain.exponentialRampToValueAtTime(
    0.001,
    now + config.attack + config.decay
  );

  // Connect nodes
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  // Play and cleanup
  oscillator.start(now);
  oscillator.stop(now + config.attack + config.decay + 0.01);
};

/**
 * Play a pleasant multi-tone chime for task completion
 * Creates a musical ascending arpeggio that feels rewarding
 */
const playCompleteChime = (): void => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Musical notes for a pleasant major chord arpeggio (C major: C5, E5, G5)
  const notes = [
    { freq: 523.25, delay: 0, duration: 0.35, gain: 0.1 },      // C5
    { freq: 659.25, delay: 0.08, duration: 0.3, gain: 0.09 },   // E5
    { freq: 783.99, delay: 0.16, duration: 0.4, gain: 0.08 },   // G5
  ];

  notes.forEach(note => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(note.freq, now + note.delay);

    // Soft attack and natural decay
    gainNode.gain.setValueAtTime(0, now + note.delay);
    gainNode.gain.linearRampToValueAtTime(note.gain, now + note.delay + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + note.delay + note.duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(now + note.delay);
    oscillator.stop(now + note.delay + note.duration + 0.01);
  });
};

/**
 * Play a magical sparkle effect - multiple high frequencies
 */
const playSparkleEffect = (): void => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Random sparkle tones
  const sparkles = [
    { freq: 1200 + Math.random() * 400, delay: 0, duration: 0.12 },
    { freq: 1400 + Math.random() * 400, delay: 0.04, duration: 0.1 },
    { freq: 1600 + Math.random() * 400, delay: 0.08, duration: 0.08 },
    { freq: 1800 + Math.random() * 300, delay: 0.11, duration: 0.06 },
  ];

  sparkles.forEach(sparkle => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(sparkle.freq, now + sparkle.delay);

    gainNode.gain.setValueAtTime(0, now + sparkle.delay);
    gainNode.gain.linearRampToValueAtTime(0.04, now + sparkle.delay + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + sparkle.delay + sparkle.duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(now + sparkle.delay);
    oscillator.stop(now + sparkle.delay + sparkle.duration + 0.01);
  });
};

/**
 * Play a triumphant success fanfare for major achievements
 */
const playSuccessFanfare = (): void => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Triumphant ascending fanfare (C major to G major)
  const notes = [
    { freq: 523.25, delay: 0, duration: 0.2, gain: 0.08 },      // C5
    { freq: 659.25, delay: 0.12, duration: 0.2, gain: 0.09 },   // E5
    { freq: 783.99, delay: 0.24, duration: 0.25, gain: 0.1 },   // G5
    { freq: 1046.50, delay: 0.36, duration: 0.5, gain: 0.12 },  // C6 (finale)
  ];

  notes.forEach(note => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(note.freq, now + note.delay);

    gainNode.gain.setValueAtTime(0, now + note.delay);
    gainNode.gain.linearRampToValueAtTime(note.gain, now + note.delay + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + note.delay + note.duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(now + note.delay);
    oscillator.stop(now + note.delay + note.duration + 0.01);
  });
};

/**
 * Play a gentle, warm tone - good for subtle positive feedback
 */
const playGentleTone = (): void => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Warm chord (F major)
  const notes = [
    { freq: 349.23, duration: 0.4, gain: 0.06 },  // F4
    { freq: 440.00, duration: 0.4, gain: 0.05 },  // A4
    { freq: 523.25, duration: 0.4, gain: 0.04 },  // C5
  ];

  notes.forEach(note => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(note.freq, now);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(note.gain, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + note.duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + note.duration + 0.01);
  });
};

// Throttle helper for volume dial ticks
let lastTickVolume = -1;
const TICK_THRESHOLD = 0.05; // 5% volume change

const playTickIfThreshold = (currentVolume: number): void => {
  if (lastTickVolume === -1) {
    lastTickVolume = currentVolume;
    return;
  }
  
  const delta = Math.abs(currentVolume - lastTickVolume);
  if (delta >= TICK_THRESHOLD) {
    playSound('tick');
    lastTickVolume = currentVolume;
  }
};

const resetTickThreshold = (): void => {
  lastTickVolume = -1;
};

// Export individual sound functions for clean API
export const hapticSounds = {
  // Basic mechanical sounds
  click: () => playSound('click'),
  tick: () => playSound('tick'),
  thud: () => playSound('thud'),
  pop: () => playSound('pop'),
  
  // Pleasant feedback sounds
  complete: playCompleteChime,        // Task completion - pleasant ascending chime
  success: playSuccessFanfare,        // Major achievement - triumphant fanfare
  gentle: playGentleTone,             // Subtle positive - warm chord
  sparkle: playSparkleEffect,         // Magical sparkle effect
  
  // Special throttled tick for volume dial
  volumeTick: playTickIfThreshold,
  resetVolumeTick: resetTickThreshold,
};

// Hook version for components that prefer hooks
export function useHapticSound() {
  return hapticSounds;
}

export default useHapticSound;
