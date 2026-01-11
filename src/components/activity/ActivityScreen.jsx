import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InviteCard } from './InviteCard';
import { Calendar, Send, Inbox } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const tabs = [
  { id: 'all', label: 'All', icon: Calendar },
  { id: 'sent', label: 'Sent', icon: Send },
  { id: 'received', label: 'Received', icon: Inbox }
];

export function ActivityScreen({ invites, onRespond }) {
  const { theme, themeId } = useTheme();
  const isDark = themeId === 'midnight';
  const [activeTab, setActiveTab] = useState('all');

  // Filter invites based on tab
  const filteredInvites = invites.filter(invite => {
    if (activeTab === 'all') return true;
    if (activeTab === 'sent') return invite.createdBy === 'howard' || !invite.createdBy;
    if (activeTab === 'received') return invite.createdBy && invite.createdBy !== 'howard';
    return true;
  });

  // Separate into upcoming and past
  const pendingInvites = filteredInvites.filter(i => i.status === 'sent' || i.status === 'pending');
  const confirmedInvites = filteredInvites.filter(i => i.status === 'confirmed');

  return (
    <div className="px-4 pt-6 pb-24 h-full">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: theme.textPrimary }}>Activity</h1>
        <p className="text-sm mt-1" style={{ color: theme.textSecondary }}>
          {invites.length === 0
            ? 'No hangouts yet - create one to get started!'
            : `${invites.length} hangout${invites.length === 1 ? '' : 's'}`}
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const count = tab.id === 'all' ? invites.length :
                        tab.id === 'sent' ? invites.filter(i => i.createdBy === 'howard' || !i.createdBy).length :
                        invites.filter(i => i.createdBy && i.createdBy !== 'howard').length;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap backdrop-blur-md"
              style={{
                backgroundColor: isActive ? theme.cta : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'),
                color: isActive ? '#FFFFFF' : theme.textSecondary,
                border: isActive ? 'none' : `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
              }}
            >
              <Icon size={16} />
              {tab.label}
              {count > 0 && (
                <span
                  className="ml-1 px-1.5 py-0.5 rounded-full text-xs"
                  style={{
                    backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)')
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {invites.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center py-16"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${theme.cta}20` }}
            >
              <Calendar size={36} style={{ color: theme.cta }} />
            </motion.div>
            <h3 className="font-semibold mb-2" style={{ color: theme.textPrimary }}>No hangouts yet</h3>
            <p className="text-sm max-w-[240px] mx-auto" style={{ color: theme.textSecondary }}>
              Tap the + button to create your first hangout with friends from your circles!
            </p>
          </motion.div>
        ) : filteredInvites.length === 0 ? (
          <motion.div
            key="no-results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p style={{ color: theme.textSecondary }}>No {activeTab} hangouts</p>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Pending Section */}
            {pendingInvites.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: theme.textSecondary }}>
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme.statusOpen }} />
                  Pending ({pendingInvites.length})
                </h3>
                <div className="space-y-3">
                  {pendingInvites.map((invite, index) => (
                    <motion.div
                      key={invite.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <InviteCard
                        invite={invite}
                        type={invite.createdBy === 'howard' || !invite.createdBy ? 'outgoing' : 'incoming'}
                        onRespond={onRespond}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Confirmed Section */}
            {confirmedInvites.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: theme.textSecondary }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.statusAvailable }} />
                  Confirmed ({confirmedInvites.length})
                </h3>
                <div className="space-y-3">
                  {confirmedInvites.map((invite, index) => (
                    <motion.div
                      key={invite.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <InviteCard
                        invite={invite}
                        type="confirmed"
                        onRespond={onRespond}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
