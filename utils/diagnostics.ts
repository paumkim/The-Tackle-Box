
interface LogEntry {
  timestamp: number;
  level: 'INFO' | 'WARN' | 'ERROR';
  source: string;
  message: string;
  data?: any;
}

class DiagnosticSystem {
  private logs: LogEntry[] = [];
  private fps: number = 60;

  /**
   * Log a system event to the Black Box.
   */
  log(level: 'INFO' | 'WARN' | 'ERROR', source: string, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      source,
      message,
      data
    };
    
    // Keep the log buffer clean (Last 200 entries)
    this.logs.push(entry);
    if (this.logs.length > 200) this.logs.shift();
    
    // Echo critical errors to console for dev tools visibility
    if (level === 'ERROR') {
      console.error(`[${source}] ${message}`, data);
    }
  }

  /**
   * Returns the current snapshot of the ship's health.
   */
  getVitals() {
    return {
      timestamp: new Date().toISOString(),
      performance: {
        fps: this.fps,
        status: this.fps < 30 ? 'CRITICAL_DRAG' : (this.fps < 50 ? 'MINOR_DRAG' : 'OPTIMAL'),
        memory: (performance as any).memory ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) + 'MB' : 'N/A',
      },
      environment: {
        userAgent: navigator.userAgent,
        screen: `${window.innerWidth}x${window.innerHeight}`,
      },
      recentLogs: [...this.logs].reverse() // Newest first
    };
  }

  /**
   * Starts the animation loop to measure Frame Rate.
   */
  startHeartbeat(onUpdate: (fps: number) => void) {
    let lastTime = performance.now();
    let frames = 0;

    const loop = () => {
      const now = performance.now();
      frames++;
      
      if (now - lastTime >= 1000) {
        this.fps = frames;
        frames = 0;
        lastTime = now;
        onUpdate(this.fps);
      }
      
      requestAnimationFrame(loop);
    };
    
    requestAnimationFrame(loop);
  }
}

export const Diagnostics = new DiagnosticSystem();
