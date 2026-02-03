
import React, { useState, useEffect, useRef } from 'react';

const HOLD_DURATION = 3000; // 3 seconds to unlock text
const DRIFT_TOLERANCE = 10; // Pixels of movement allowed before cancel

export const CaptainInteractionLayer: React.FC = () => {
  const [isHolding, setIsHolding] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const holdInterval = useRef<number | null>(null);
  const startTime = useRef<number>(0);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      
      const target = e.target as HTMLElement;
      
      // Ignore interactive elements and Sidebar (Navigation/PETCO)
      // This ensures we don't accidentally unlock UI elements that should remain static
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'BUTTON' || 
        target.tagName === 'A' ||
        target.isContentEditable ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('aside') // PROTECT SIDEBAR (Nav & Mascot)
      ) {
        return;
      }

      setIsHolding(true);
      startPos.current = { x: clientX, y: clientY };
      startTime.current = Date.now();

      // Start Silent Timer (No visual feedback)
      holdInterval.current = window.setInterval(() => {
        const elapsed = Date.now() - startTime.current;
        
        if (elapsed >= HOLD_DURATION) {
          unlockTextUnderCursor(clientX, clientY);
          cancelHold();
        }
      }, 100);
    };

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isHolding) return;
      
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      const dist = Math.sqrt(
        Math.pow(clientX - startPos.current.x, 2) + Math.pow(clientY - startPos.current.y, 2)
      );

      // Cancel if drifted too far
      if (dist > DRIFT_TOLERANCE) {
        cancelHold();
      }
    };

    const handleMouseUp = () => {
      if (isHolding) {
        cancelHold();
      }
    };

    const cancelHold = () => {
      setIsHolding(false);
      if (holdInterval.current) {
        clearInterval(holdInterval.current);
        holdInterval.current = null;
      }
    };

    const unlockTextUnderCursor = (x: number, y: number) => {
        const target = document.elementFromPoint(x, y) as HTMLElement;
        if (target && target.textContent && target.textContent.trim().length > 0) {
            // Re-check protection (redundant safety)
            if (target.closest('aside')) return;

            // Remove existing unlocks to keep it clean
            document.querySelectorAll('.captain-unlocked').forEach(el => el.classList.remove('captain-unlocked'));
            
            // Add unlock class (Graphite Glow defined in CSS)
            target.classList.add('captain-unlocked');
            
            // Programmatically select the text
            const range = document.createRange();
            range.selectNodeContents(target);
            const selection = window.getSelection();
            if (selection) {
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
    };

    // Global Listeners
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchstart', handleMouseDown);
    window.addEventListener('touchmove', handleMouseMove);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchstart', handleMouseDown);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
      if (holdInterval.current) clearInterval(holdInterval.current);
    };
  }, [isHolding]);

  return null; // Silent Component - Zero UI Distraction
};
