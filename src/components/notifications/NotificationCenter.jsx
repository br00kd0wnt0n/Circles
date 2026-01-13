import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, BellOff, Check, Clock, Users, Calendar, Trash2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { usePWA } from '../../hooks/usePWA';

export function NotificationCenter({ isOpen, onClose, notifications = [], onMarkRead, onClearAll }) {
  const { theme, themeId } = useTheme();
  const { pushPermission, requestPushPermission, pushSubscription } = usePWA();
  const isDark = themeId === 'midnight';

  const [filter, setFilter] = useState('all'); // all, unread, invites

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    let filtered = notifications;

    if (filter === 'unread') {
      filtered = notifications.filter(n => !n.read);
    } else if (filter === 'invites') {
      filtered = notifications.filter(n => n.type === 'invite');
    }

    const groups = {};
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    filtered.forEach(notif => {
      const date = new Date(notif.createdAt).toDateString();
      let key = date;

      if (date === today) key = 'Today';
      else if (date === yesterday) key = 'Yesterday';

      if (!groups[key]) groups[key] = [];
      groups[key].push(notif);
    });

    return groups;
  }, [notifications, filter]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleEnablePush = async () => {
    const subscription = await requestPushPermission();
    if (subscription) {
      // TODO: Send subscription to backend
      console.log('Push enabled:', subscription.endpoint);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <motion.div
        className="absolute inset-x-0 bottom-0 rounded-t-3xl overflow-hidden"
        style={{
          backgroundColor: isDark ? '#1a1a2e' : '#ffffff',
          maxHeight: '85vh'
        }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3">
          <div className="flex items-center gap-2">
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-[#9CAF88] text-white">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <Trash2 className={`w-5 h-5 ${isDark ? 'text-white/50' : 'text-gray-400'}`} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
            >
              <X className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-900'}`} />
            </button>
          </div>
        </div>

        {/* Push Notification Banner */}
        {pushPermission !== 'granted' && (
          <div className={`mx-4 mb-4 p-4 rounded-xl ${
            isDark ? 'bg-white/5' : 'bg-amber-50'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-full ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                <BellOff className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Enable push notifications
                </p>
                <p className={`text-sm mt-0.5 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                  Get notified when friends want to hang out
                </p>
              </div>
              <button
                onClick={handleEnablePush}
                className="px-3 py-1.5 rounded-lg bg-[#9CAF88] text-white text-sm font-medium"
              >
                Enable
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 px-4 pb-3">
          {[
            { id: 'all', label: 'All' },
            { id: 'unread', label: 'Unread' },
            { id: 'invites', label: 'Invites' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f.id
                  ? 'bg-[#9CAF88] text-white'
                  : isDark
                    ? 'bg-white/10 text-white/70'
                    : 'bg-gray-100 text-gray-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto px-4 pb-8" style={{ maxHeight: 'calc(85vh - 200px)' }}>
          {Object.keys(groupedNotifications).length === 0 ? (
            <div className={`text-center py-12 ${isDark ? 'text-white/50' : 'text-gray-400'}`}>
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No notifications</p>
              <p className="text-sm mt-1">You're all caught up!</p>
            </div>
          ) : (
            Object.entries(groupedNotifications).map(([date, notifs]) => (
              <div key={date} className="mb-4">
                <p className={`text-xs font-semibold mb-2 ${isDark ? 'text-white/50' : 'text-gray-400'}`}>
                  {date}
                </p>
                <div className="space-y-2">
                  {notifs.map(notif => (
                    <NotificationItem
                      key={notif.id}
                      notification={notif}
                      isDark={isDark}
                      onMarkRead={onMarkRead}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function NotificationItem({ notification, isDark, onMarkRead }) {
  const getIcon = () => {
    switch (notification.type) {
      case 'invite':
        return <Calendar className="w-5 h-5 text-[#9CAF88]" />;
      case 'response':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'reminder':
        return <Clock className="w-5 h-5 text-amber-500" />;
      default:
        return <Users className="w-5 h-5 text-blue-500" />;
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <motion.button
      onClick={() => !notification.read && onMarkRead?.(notification.id)}
      className={`w-full flex items-start gap-3 p-3 rounded-xl transition-colors ${
        notification.read
          ? isDark ? 'bg-white/5' : 'bg-gray-50'
          : isDark ? 'bg-white/10' : 'bg-[#9CAF88]/10'
      }`}
      whileTap={{ scale: 0.98 }}
    >
      <div className={`p-2 rounded-full ${isDark ? 'bg-white/10' : 'bg-white'}`}>
        {getIcon()}
      </div>
      <div className="flex-1 text-left">
        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {notification.title}
        </p>
        {notification.body && (
          <p className={`text-sm mt-0.5 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
            {notification.body}
          </p>
        )}
        <p className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
          {getTimeAgo(notification.createdAt)}
        </p>
      </div>
      {!notification.read && (
        <div className="w-2 h-2 rounded-full bg-[#9CAF88] mt-2" />
      )}
    </motion.button>
  );
}

export default NotificationCenter;
