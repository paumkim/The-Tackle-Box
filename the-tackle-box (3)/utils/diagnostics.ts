
export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'INFO' | 'WARN' | 'ERROR';
  source: string;
  message: string;
  data?: any;
}

class DiagnosticSystem {
  private logs: LogEntry[] = [];
  private fps: number = 60;
  private fpsHistory: number[] = new Array(40).fill(60); // Flight Recorder Buffer
  private enabled: boolean = false;
  private readonly STORAGE_KEY = 'ttbox_logs';
  private readonly MAX_LOGS = 100;

  constructor() {
    // Check initial state from local storage directly to avoid store dependency loops
    const savedState = localStorage.getItem('vessel_developer_mode');
    this.enabled = savedState === 'true';
    if (this.enabled) {
        this.loadLogs();
    }
  }

  public setDevMode(enabled: boolean) {
      this.enabled = enabled;
      if (!enabled) {
          this.clearLogs(); // Purge buffer on disable for security
      } else {
          this.loadLogs();
      }
  }

  private loadLogs() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        this.logs = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load Black Box data', e);
    }
  }

  private saveLogs() {
    if (!this.enabled) return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.logs));
    } catch (e) {
      // LocalStorage full or blocked
    }
  }

  /**
   * Log a system event to the Black Box.
   */
  log(level: 'INFO' | 'WARN' | 'ERROR', source: string, message: string, data?: any) {
    // Security Gate: Do not record if dev mode is off
    if (!this.enabled) return;

    const entry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      level,
      source,
      message,
      data: data ? JSON.stringify(data) : undefined
    };
    
    // Add to front
    this.logs.unshift(entry);
    
    // Rotation Policy: Keep only the latest MAX_LOGS
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(0, this.MAX_LOGS);
    }
    
    this.saveLogs();
    
    // Echo critical errors to console for dev tools visibility regardless of mode
    // (Browsers console is distinct from internal App Black Box)
    if (level === 'ERROR') {
      console.error(`[${source}] ${message}`, data);
    }
  }

  info(source: string, message: string, data?: any) {
      this.log('INFO', source, message, data);
  }

  warn(source: string, message: string, data?: any) {
      this.log('WARN', source, message, data);
  }

  error(source: string, message: string, data?: any) {
      this.log('ERROR', source, message, data);
  }

  clearLogs() {
      this.logs = [];
      try {
        localStorage.removeItem(this.STORAGE_KEY);
      } catch(e) {}
  }

  getLogs() {
      return this.logs;
  }

  /**
   * Returns the current snapshot of the ship's health.
   */
  getVitals() {
    return {
      timestamp: new Date().toISOString(),
      performance: {
        fps: this.fps,
        fpsHistory: [...this.fpsHistory],
        status: this.fps < 30 ? 'CRITICAL_DRAG' : (this.fps < 50 ? 'MINOR_DRAG' : 'OPTIMAL'),
        memory: (performance as any).memory ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) + 'MB' : 'N/A',
        nodes: document.getElementsByTagName('*').length
      },
      environment: {
        userAgent: navigator.userAgent,
        screen: `${window.innerWidth}x${window.innerHeight}`,
      },
      recentLogs: this.logs.slice(0, 50)
    };
  }

  /**
   * Starts the animation loop to measure Frame Rate.
   * This runs independently of Dev Mode to power the main UI Telemetry Deck.
   */
  startHeartbeat(onUpdate: (fps: number) => void) {
    let lastTime = performance.now();
    let frames = 0;

    const loop = () => {
      const now = performance.now();
      frames++;
      
      if (now - lastTime >= 1000) {
        this.fps = frames;
        
        // Record to flight recorder buffer
        this.fpsHistory.push(this.fps);
        if (this.fpsHistory.length > 40) this.fpsHistory.shift();

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
