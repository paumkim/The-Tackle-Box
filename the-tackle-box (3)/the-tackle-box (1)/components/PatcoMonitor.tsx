
import React, { useEffect, useRef } from 'react';
import { db } from '../db';
import { useAppStore } from '../store';
import { NotificationManager } from '../utils/notifications';

export const PatcoMonitor: React.FC = () => {
  const isSubmerged = useAppStore(state => state.isSubmerged);
  const setDrifting = useAppStore(state => state.setDrifting);
  const setPatcoAlert = useAppStore(state => state.setPatcoAlert);
  const setConnectionStatus = useAppStore(state => state.setConnectionStatus);
  const updateCrewStatus = useAppStore(state => state.updateCrewStatus);
  
  const offlineStartRef = useRef<number | null>(null);
  const driftTimerRef = useRef<number | null>(null);
  const isDriftingRef = useRef(false);
  const lastActivityRef = useRef<number>(Date.now());
  const idleCheckIntervalRef = useRef<number | null>(null);
  const pingIntervalRef = useRef<number | null>(null);

  // Constants
  const DRIFT_THRESHOLD_TAB_AWAY = 5 * 60 * 1000; // 5 mins tab away
  const IDLE_THRESHOLD_CAPTAIN = 10 * 60 * 1000; // 10 mins no input
  const CURRENT_USER_ID = '1'; // Mock ID for current user (Navigator John)

  // 1. Comm-Link Ping Engine
  useEffect(() => {
      const pingHQ = () => {
          if (!navigator.onLine) {
              setConnectionStatus('OFFLINE');
              return;
          }

          // Simulate Latency Check
          // In a real app, you would fetch HEAD from your API
          // Here we simulate random lags
          const latency = Math.random() * 600; // 0-600ms random latency
          
          if (latency > 500) {
              setConnectionStatus('LAG');
          } else {
              setConnectionStatus('GOOD');
          }
      };

      pingIntervalRef.current = window.setInterval(pingHQ, 30000); // 30s heartbeat
      return () => {
          if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      };
  }, [setConnectionStatus]);

  // 2. Connectivity Listeners (Immediate)
  useEffect(() => {
    const handleOffline = async () => {
      offlineStartRef.current = Date.now();
      setConnectionStatus('OFFLINE');
      NotificationManager.send("P.A.T.C.O. Alert", "Connection severed. Logging outage.");
    };

    const handleOnline = async () => {
      if (offlineStartRef.current) {
        const duration = Date.now() - offlineStartRef.current;
        await db.auditLogs.add({
          type: 'OFFLINE',
          timestamp: offlineStartRef.current,
          details: 'Network connectivity lost.',
          duration: duration
        });
        offlineStartRef.current = null;
        setConnectionStatus('GOOD');
        NotificationManager.send("P.A.T.C.O. Alert", "Signal restored. Outage logged.");
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [setConnectionStatus]);

  // 3. Focus & Visibility Listener (Tab Switching)
  useEffect(() => {
    const handleVisibilityChange = async () => {
        if (document.hidden && isSubmerged) {
            // User tabbed away while working
            driftTimerRef.current = window.setTimeout(() => {
                isDriftingRef.current = true;
                setDrifting(true);
                updateCrewStatus(CURRENT_USER_ID, 'DRIFTING');
                NotificationManager.send("Drift Alert", "Captain, the current is pulling us off course! Return to the oars!");
            }, DRIFT_THRESHOLD_TAB_AWAY);
        } else {
            // Returned to tab
            if (driftTimerRef.current) {
                clearTimeout(driftTimerRef.current);
                driftTimerRef.current = null;
            }
            
            if (isDriftingRef.current) {
                isDriftingRef.current = false;
                setDrifting(false);
                updateCrewStatus(CURRENT_USER_ID, 'AT_OARS');
                setPatcoAlert("Welcome back, Captain. Course corrected.");
                
                await db.auditLogs.add({
                    type: 'DRIFT',
                    timestamp: Date.now(),
                    details: 'Focus lost. Vessel drifted.',
                });
            }
        }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isSubmerged, setDrifting, setPatcoAlert, updateCrewStatus]);

  // 4. Captain Active Watchdog (Mouse/Keyboard)
  useEffect(() => {
      const resetIdleTimer = () => {
          lastActivityRef.current = Date.now();
          if (isDriftingRef.current && document.visibilityState === 'visible') {
              // Waking up from idle drift
              isDriftingRef.current = false;
              setDrifting(false);
              updateCrewStatus(CURRENT_USER_ID, 'AT_OARS');
          }
      };

      const checkIdle = () => {
          const now = Date.now();
          if (now - lastActivityRef.current > IDLE_THRESHOLD_CAPTAIN) {
              if (!isDriftingRef.current && isSubmerged) {
                  isDriftingRef.current = true;
                  // Note: Store isDrifting is mainly for UI effects, but here we specifically update crew status
                  updateCrewStatus(CURRENT_USER_ID, 'DRIFTING'); 
              }
          }
      };

      window.addEventListener('mousemove', resetIdleTimer);
      window.addEventListener('keydown', resetIdleTimer);
      
      idleCheckIntervalRef.current = window.setInterval(checkIdle, 60000); // Check every minute

      return () => {
          window.removeEventListener('mousemove', resetIdleTimer);
          window.removeEventListener('keydown', resetIdleTimer);
          if (idleCheckIntervalRef.current) clearInterval(idleCheckIntervalRef.current);
      };
  }, [isSubmerged, updateCrewStatus, setDrifting]);

  return null; // Invisible component
};
