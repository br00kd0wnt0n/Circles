import { motion, AnimatePresence } from 'framer-motion';
import { Check, Bell, X, Users } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const icons = {
  success: Check,
  invite: Bell,
  info: Users,
  error: X
};

export function Toast({ toast, onDismiss }) {
  const { theme } = useTheme();

  const Icon = toast ? (icons[toast.type] || Check) : Check;
  const isInvite = toast?.type === 'invite';

  const bgColors = {
    success: theme.headerAvailable,
    invite: '#F4A69A',
    info: '#94A3B8',
    error: '#E11D48'
  };

  const bg = toast ? (bgColors[toast.type] || bgColors.success) : bgColors.success;

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key="toast"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute bottom-20 left-0 right-0 z-30 px-4"
        >
          <div
            className="rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3"
            style={{ backgroundColor: bg }}
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Icon size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm">
                {toast.title}
              </p>
              {toast.message && (
                <p className="text-white/80 text-xs truncate">
                  {toast.message}
                </p>
              )}
            </div>
            {isInvite && (
              <>
                <button
                  onClick={() => {
                    if (toast.onTap) toast.onTap();
                    onDismiss();
                  }}
                  className="px-3 py-1.5 bg-white rounded-lg text-[#F4A69A] text-xs font-semibold"
                >
                  View
                </button>
                <button
                  onClick={() => onDismiss()}
                  className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors flex-shrink-0"
                >
                  <X size={14} className="text-white" />
                </button>
              </>
            )}
            {toast.action && !isInvite && (
              <button
                onClick={() => {
                  toast.action.onPress();
                  onDismiss();
                }}
                className="px-3 py-1.5 bg-white/20 rounded-lg text-white text-xs font-medium"
              >
                {toast.action.label}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
