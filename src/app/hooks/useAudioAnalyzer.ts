import { useEffect, useRef, useState } from 'react';

interface UseAudioAnalyzerOptions {
  audioElement?: HTMLAudioElement | null;
  audioContext?: AudioContext | null;
  sourceNode?: AudioNode | null;
  isPlaying: boolean;
  barCount?: number;
}

export function useAudioAnalyzer({
  audioElement,
  audioContext,
  sourceNode,
  isPlaying,
  barCount = 41,
}: UseAudioAnalyzerOptions) {
  const [frequencyData, setFrequencyData] = useState<number[]>(new Array(barCount).fill(0));
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const previousDataRef = useRef<number[]>(new Array(barCount).fill(0));

  useEffect(() => {
    // Cleanup previous analyzer
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // If we have an audio element, create analyzer from it
    if (audioElement && !audioContext) {
      try {
        // Check if audio element is already connected to an AudioContext
        // If so, we can't create another MediaElementSource
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = ctx;
        
        const source = ctx.createMediaElementSource(audioElement);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512; // Higher resolution for better frequency analysis
        analyser.smoothingTimeConstant = 0.3; // Lower smoothing for more responsive visualization
        
        source.connect(analyser);
        // Connect to destination to allow audio to play
        analyser.connect(ctx.destination);
        
        analyserRef.current = analyser;
      } catch (error) {
        // If creating MediaElementSource fails (e.g., already connected), 
        // we can't analyze this audio element
        console.warn('Could not create audio analyzer from element (may already be connected):', error);
        analyserRef.current = null;
        return;
      }
    }
    // If we have an audio context and source node (for generated audio)
    else if (audioContext && sourceNode) {
      try {
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.3;
        
        // For generated audio, sourceNode (masterGain) is already connected to destination
        // We connect analyser in parallel - sourceNode can connect to multiple nodes
        sourceNode.connect(analyser);
        
        analyserRef.current = analyser;
        audioContextRef.current = audioContext;
      } catch (error) {
        console.warn('Error creating audio analyzer from context:', error);
        analyserRef.current = null;
        return;
      }
    }

    if (!analyserRef.current || !isPlaying) {
      // Reset to zero when not playing
      setFrequencyData(new Array(barCount).fill(0));
      previousDataRef.current = new Array(barCount).fill(0);
      return;
    }

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const frequencyDataArray = new Uint8Array(bufferLength);
    const timeDataArray = new Uint8Array(bufferLength);

    const updateFrequencyData = () => {
      if (!isPlaying || !analyserRef.current) {
        setFrequencyData(new Array(barCount).fill(0));
        previousDataRef.current = new Array(barCount).fill(0);
        return;
      }

      // Get both frequency and time domain data
      analyser.getByteFrequencyData(frequencyDataArray);
      analyser.getByteTimeDomainData(timeDataArray);

      // Calculate overall volume/energy for rhythm detection
      let totalEnergy = 0;
      for (let i = 0; i < timeDataArray.length; i++) {
        const normalized = (timeDataArray[i] - 128) / 128;
        totalEnergy += Math.abs(normalized);
      }
      const averageEnergy = totalEnergy / timeDataArray.length;
      
      // Use energy to boost visualization when there's rhythm
      const rhythmBoost = Math.min(1.5, 1 + (averageEnergy * 0.5));

      // Map frequency data to bar count with better distribution
      const barData: number[] = [];
      
      // Use logarithmic distribution for better visualization
      // Lower frequencies (bass) get more bars, higher frequencies get fewer
      const logStart = Math.log(1);
      const logEnd = Math.log(bufferLength);
      const logRange = logEnd - logStart;

      for (let i = 0; i < barCount; i++) {
        // Logarithmic distribution
        const logPosition = logStart + (logRange * i / barCount);
        const freqIndex = Math.floor(Math.exp(logPosition));
        
        // Get frequency range for this bar (wider range for lower frequencies)
        const rangeSize = Math.max(1, Math.floor(freqIndex * 0.1));
        const start = Math.max(0, Math.min(bufferLength - 1, freqIndex - rangeSize / 2));
        const end = Math.max(start + 1, Math.min(bufferLength, freqIndex + rangeSize / 2));

        // Calculate average and peak for this frequency range
        let sum = 0;
        let peak = 0;
        for (let j = start; j < end; j++) {
          const value = frequencyDataArray[j];
          sum += value;
          peak = Math.max(peak, value);
        }

        // Use weighted average (70% peak, 30% average) for more dynamic visualization
        const average = sum / (end - start);
        const weighted = (peak * 0.7) + (average * 0.3);
        
        // Normalize to 0-1 range
        let normalized = weighted / 255;
        
        // Apply rhythm boost for more dynamic response
        normalized = Math.min(1, normalized * rhythmBoost);
        
        // Apply exponential curve for better visual distribution
        // This makes quiet sounds more visible and loud sounds less overwhelming
        const amplified = Math.pow(normalized, 0.6);
        
        // Smooth with previous value for less jittery animation
        const previous = previousDataRef.current[i] || 0;
        const smoothed = (amplified * 0.7) + (previous * 0.3);
        
        barData.push(smoothed);
      }

      previousDataRef.current = barData;
      setFrequencyData(barData);
      animationFrameRef.current = requestAnimationFrame(updateFrequencyData);
    };

    updateFrequencyData();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Cleanup audio context if we created it
      if (audioContextRef.current && audioContextRef.current !== audioContext) {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
    };
  }, [audioElement, audioContext, sourceNode, isPlaying, barCount]);

  return frequencyData;
}
