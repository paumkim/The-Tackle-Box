import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../store';

// Procedural Noise Generator to avoid external assets
const createNoiseBuffer = (ctx: AudioContext) => {
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    output[i] = (lastOut + (0.02 * white)) / 1.02;
    lastOut = output[i];
    output[i] *= 3.5; 
  }
  return buffer;
};

let lastOut = 0;

export const AudioBridge: React.FC = () => {
  const isSubmerged = useAppStore(state => state.isSubmerged);
  const soundEnabled = useAppStore(state => state.soundEnabled);
  const cabinMode = useAppStore(state => state.cabinMode);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);

  useEffect(() => {
    if (soundEnabled && (isSubmerged || cabinMode)) {
      if (!audioCtxRef.current) {
        const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
        if (AudioContextClass) {
            audioCtxRef.current = new AudioContextClass();
        }
      }

      const ctx = audioCtxRef.current;
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Create Brown Noise (Ocean Roar)
      if (!sourceNodeRef.current) {
        const bufferSize = 2 * ctx.sampleRate;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            // Pinkish/Brown noise approximation
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = data[i];
            data[i] *= 3.5; 
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        
        // Filter to shape the sound
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400; // Deep rumble

        const gain = ctx.createGain();
        gain.gain.value = 0.05; // Start quiet

        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        source.start();
        
        sourceNodeRef.current = source;
        filterNodeRef.current = filter;
        gainNodeRef.current = gain;
      }

      // Adjust Soundscape based on mode
      if (gainNodeRef.current && filterNodeRef.current) {
          const now = ctx.currentTime;
          
          if (cabinMode) {
              // Rain Mode (Higher pitch, louder)
              filterNodeRef.current.frequency.linearRampToValueAtTime(800, now + 2); 
              gainNodeRef.current.gain.linearRampToValueAtTime(0.08, now + 2);
          } else {
              // Deep Ocean (Lower pitch, quieter)
              filterNodeRef.current.frequency.linearRampToValueAtTime(300, now + 2); 
              gainNodeRef.current.gain.linearRampToValueAtTime(0.04, now + 2);
          }
      }

    } else {
      // Silence
      if (gainNodeRef.current && audioCtxRef.current) {
          const now = audioCtxRef.current.currentTime;
          gainNodeRef.current.gain.linearRampToValueAtTime(0, now + 1);
          
          // Stop fully after fade out to save CPU
          setTimeout(() => {
              if (sourceNodeRef.current) {
                  sourceNodeRef.current.stop();
                  sourceNodeRef.current = null;
              }
          }, 1200);
      }
    }

    return () => {
        // Cleanup on unmount is tricky with React strict mode double-mount
        // We rely on the logic above to manage state transitions
    };
  }, [soundEnabled, isSubmerged, cabinMode]);

  return null; // Audio only
};