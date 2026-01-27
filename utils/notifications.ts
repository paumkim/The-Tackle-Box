export const NotificationManager = {
  requestPermission: async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notification');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  send: (title: string, body: string) => {
    if (Notification.permission === 'granted') {
      // Use Service Worker registration if available for better PWA support
      if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, {
            body,
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            vibrate: [200, 100, 200]
          } as any);
        });
      } else {
        // Fallback to standard API
        new Notification(title, {
          body,
          icon: '/favicon.svg'
        });
      }
    }
  }
};