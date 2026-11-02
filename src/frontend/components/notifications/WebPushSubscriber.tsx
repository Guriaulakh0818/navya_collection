'use client';

import { Bell, X } from 'lucide-react';
import { useEffect, useState } from 'react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function WebPushSubscriber() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    // Only run in modern browsers supporting serviceWorker & PushManager
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window)
    ) {
      return;
    }

    // Register service worker
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        // If permission is default and user hasn't dismissed recently
        const dismissed = localStorage.getItem('jiivaa_push_dismissed');
        if (Notification.permission === 'default' && !dismissed) {
          // Show prompt after 4 seconds of page engagement
          const timer = setTimeout(() => setShowPrompt(true), 4000);
          return () => clearTimeout(timer);
        }
      })
      .catch((err) => {
        console.warn('Service worker registration error:', err);
      });
  }, []);

  const handleSubscribe = async () => {
    try {
      setIsSubscribing(true);

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setShowPrompt(false);
        localStorage.setItem('jiivaa_push_dismissed', 'true');
        return;
      }

      // Fetch public VAPID key
      const keyRes = await fetch('/api/v1/push/subscribe');
      const keyData = await keyRes.json();
      const vapidPublicKey = keyData.publicKey;

      if (!vapidPublicKey) {
        setShowPrompt(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Send subscription to backend
      await fetch('/api/v1/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      });

      setShowPrompt(false);
      localStorage.setItem('jiivaa_push_subscribed', 'true');
    } catch (err) {
      console.warn('Failed to subscribe to web push:', err);
      setShowPrompt(false);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('jiivaa_push_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-[calc(100%-2rem)] bg-white border border-slate-200 rounded-2xl shadow-xl p-4 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange flex items-center justify-center shrink-0">
          <Bell className="w-5 h-5 text-orange animate-bounce" />
        </div>
        <div className="flex-1 pr-1">
          <h4 className="text-xs font-black text-slate-900 tracking-tight">
            Turn On Screen Notifications?
          </h4>
          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
            Get instant updates on flash sales, new boutique arrivals & ₹50 referral credits right
            on your screen.
          </p>

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleSubscribe}
              disabled={isSubscribing}
              className="px-3.5 py-1.5 bg-navy hover:bg-navy/90 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSubscribing ? 'Enabling...' : 'Enable Notifications'}
            </button>
            <button
              onClick={handleDismiss}
              className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 text-[11px] font-medium transition-colors cursor-pointer"
            >
              Later
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
