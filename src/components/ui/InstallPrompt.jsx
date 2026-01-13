import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share, Plus, Download } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { usePWA } from '../../hooks/usePWA';

const DISMISS_KEY = 'circles-install-prompt-dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function InstallPrompt() {
  const { theme } = useTheme();
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if dismissed recently
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (elapsed < DISMISS_DURATION) {
        return;
      }
    }

    // Show prompt after a delay if installable or on iOS Safari
    const timer = setTimeout(() => {
      if (isInstalled) {
        return;
      }
      if (isInstallable || isIOS) {
        setIsVisible(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isInstallable, isInstalled, isIOS]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setIsVisible(false);
    setShowIOSInstructions(false);
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
    } else {
      const installed = await promptInstall();
      if (installed) {
        setIsVisible(false);
      }
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50"
            onClick={handleDismiss}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-md rounded-t-3xl p-6 pb-8"
            style={{ backgroundColor: theme.background }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 rounded-full"
              style={{ backgroundColor: `${theme.textSecondary}20` }}
            >
              <X size={20} style={{ color: theme.textSecondary }} />
            </button>

            {/* Content */}
            <h2
              className="text-xl font-semibold mb-6"
              style={{ color: theme.textPrimary }}
            >
              Install Circles
            </h2>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: theme.cta }}
                >
                  <span className="text-white font-semibold">1</span>
                </div>
                <div>
                  <p style={{ color: theme.textPrimary }} className="font-medium">
                    Tap the Share button
                  </p>
                  <p style={{ color: theme.textSecondary }} className="text-sm mt-1">
                    Look for <Share size={14} className="inline mx-1" /> at the bottom of Safari
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: theme.cta }}
                >
                  <span className="text-white font-semibold">2</span>
                </div>
                <div>
                  <p style={{ color: theme.textPrimary }} className="font-medium">
                    Scroll down and tap "Add to Home Screen"
                  </p>
                  <p style={{ color: theme.textSecondary }} className="text-sm mt-1">
                    Look for <Plus size={14} className="inline mx-1" /> Add to Home Screen
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: theme.cta }}
                >
                  <span className="text-white font-semibold">3</span>
                </div>
                <div>
                  <p style={{ color: theme.textPrimary }} className="font-medium">
                    Tap "Add" to confirm
                  </p>
                  <p style={{ color: theme.textSecondary }} className="text-sm mt-1">
                    Circles will appear on your home screen
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="w-full mt-6 py-3 rounded-xl font-medium"
              style={{
                backgroundColor: `${theme.textSecondary}20`,
                color: theme.textPrimary
              }}
            >
              Got it
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Install Banner */}
      {!showIOSInstructions && (
        <motion.div
          className="fixed bottom-24 left-4 right-4 z-40 sm:left-auto sm:right-4 sm:max-w-sm"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <div
            className="rounded-2xl p-4 shadow-lg flex items-center gap-4"
            style={{ backgroundColor: theme.background, border: `1px solid ${theme.textSecondary}30` }}
          >
            {/* App icon */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#0F172A' }}
            >
              <svg width="28" height="28" viewBox="0 0 512 512" fill="none">
                <circle cx="192" cy="200" r="60" stroke="#8B5CF6" strokeWidth="10" fill="none"/>
                <circle cx="320" cy="200" r="60" stroke="#8B5CF6" strokeWidth="10" fill="none"/>
                <circle cx="256" cy="300" r="60" stroke="#8B5CF6" strokeWidth="10" fill="none"/>
              </svg>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold" style={{ color: theme.textPrimary }}>
                Install Circles
              </p>
              <p className="text-sm" style={{ color: theme.textSecondary }}>
                Add to home screen for the best experience
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleDismiss}
                className="p-2 rounded-full"
                style={{ color: theme.textSecondary }}
              >
                <X size={20} />
              </button>
              <button
                onClick={handleInstall}
                className="px-4 py-2 rounded-xl font-medium flex items-center gap-2"
                style={{ backgroundColor: theme.cta, color: theme.ctaText }}
              >
                <Download size={18} />
                Install
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default InstallPrompt;
