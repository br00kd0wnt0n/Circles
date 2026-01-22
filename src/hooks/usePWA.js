import { useState, useEffect, useCallback } from 'react';

/**
 * PWA Hook - handles service worker, install prompt, push notifications, and offline detection
 */
export function usePWA() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [swRegistration, setSwRegistration] = useState(null);
  const [pushSubscription, setPushSubscription] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // Detect iOS
  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone
      || document.referrer.includes('android-app://');
    setIsInstalled(isStandalone);
  }, []);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Service worker registration
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        setSwRegistration(registration);
        console.log('[PWA] Service worker registered:', registration.scope);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
              console.log('[PWA] New version available');
            }
          });
        });

        // Get existing push subscription
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
          setPushSubscription(existingSubscription);
        }
      } catch (error) {
        console.error('[PWA] Service worker registration failed:', error);
      }
    };

    registerServiceWorker();
  }, []);

  // Install prompt (beforeinstallprompt event)
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome 67+ from auto-showing the prompt
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
      console.log('[PWA] Install prompt captured');
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
      console.log('[PWA] App installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Trigger install prompt
  const promptInstall = useCallback(async () => {
    if (!installPrompt) {
      console.log('[PWA] No install prompt available');
      return false;
    }

    try {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      console.log('[PWA] Install prompt outcome:', outcome);

      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
      }

      setInstallPrompt(null);
      return outcome === 'accepted';
    } catch (error) {
      console.error('[PWA] Install prompt error:', error);
      return false;
    }
  }, [installPrompt]);

  // Request push notification permission
  const requestPushPermission = useCallback(async () => {
    if (!swRegistration) {
      console.error('[PWA] No service worker registration');
      return null;
    }

    try {
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        console.log('[PWA] Push permission denied');
        return null;
      }

      // Get VAPID public key from environment or config
      // This should come from your backend in production
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        console.error('[PWA] VAPID public key not configured');
        return null;
      }

      // Convert VAPID key to Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });

      setPushSubscription(subscription);
      console.log('[PWA] Push subscription created:', subscription.endpoint);

      return subscription;
    } catch (error) {
      console.error('[PWA] Push subscription error:', error);
      return null;
    }
  }, [swRegistration]);

  // Unsubscribe from push notifications
  const unsubscribePush = useCallback(async () => {
    if (!pushSubscription) {
      return true;
    }

    try {
      await pushSubscription.unsubscribe();
      setPushSubscription(null);
      console.log('[PWA] Push unsubscribed');
      return true;
    } catch (error) {
      console.error('[PWA] Push unsubscribe error:', error);
      return false;
    }
  }, [pushSubscription]);

  // Apply service worker update
  const applyUpdate = useCallback(() => {
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [swRegistration]);

  // Check push permission status
  const getPushPermission = useCallback(() => {
    if (!('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }, []);

  return {
    // State
    isOnline,
    isInstallable,
    isInstalled,
    isIOS,
    updateAvailable,
    pushSubscription,
    pushPermission: getPushPermission(),

    // Actions
    promptInstall,
    requestPushPermission,
    unsubscribePush,
    applyUpdate
  };
}

// Helper: Convert base64 VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export default usePWA;
