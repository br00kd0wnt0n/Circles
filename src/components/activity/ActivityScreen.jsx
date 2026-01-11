import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InviteCard } from './InviteCard';
import { Calendar, Send, Inbox } from 'lucide-react';

const tabs = [
  { id: 'all', label: 'All', icon: Calendar },
  { id: 'sent', label: 'Sent', icon: Send },
  { id: 'received', label: 'Received', icon: Inbox }
];

export function ActivityScreen({ invites, onRespond }) {
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
    <div className="px-4 pt-6 pb-24">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-[#1F2937]">Activity</h1>
        <p className="text-sm text-[#6B7280] mt-1">
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

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#9CAF88] text-white'
                  : 'bg-white text-[#6B7280] border border-gray-200'
              }`}
            >
              <Icon size={16} />
              {tab.label}
              {count > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-gray-100'
                }`}>
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
              className="w-20 h-20 rounded-full bg-[#E8F0E3] flex items-center justify-center mx-auto mb-4"
            >
              <Calendar size={36} className="text-[#9CAF88]" />
            </motion.div>
            <h3 className="font-semibold text-[#1F2937] mb-2">No hangouts yet</h3>
            <p className="text-sm text-[#6B7280] max-w-[240px] mx-auto">
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
            <p className="text-[#6B7280]">No {activeTab} hangouts</p>
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
                <h3 className="text-sm font-medium text-[#6B7280] mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
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
                <h3 className="text-sm font-medium text-[#6B7280] mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
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
