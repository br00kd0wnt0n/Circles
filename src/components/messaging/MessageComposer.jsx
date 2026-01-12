import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export function MessageComposer({ isOpen, onClose, recipients = [], circleName = '' }) {
  const { theme, themeId } = useTheme();
  const isDark = themeId === 'midnight';
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [message, setMessage] = useState('');

  // Initialize with all recipients selected
  useEffect(() => {
    if (isOpen && recipients.length > 0) {
      setSelectedRecipients(recipients.map(r => r.id));
    }
  }, [isOpen, recipients]);

  const toggleRecipient = (recipientId) => {
    setSelectedRecipients(prev =>
      prev.includes(recipientId)
        ? prev.filter(id => id !== recipientId)
        : [...prev, recipientId]
    );
  };

  const selectAll = () => {
    setSelectedRecipients(recipients.map(r => r.id));
  };

  const deselectAll = () => {
    setSelectedRecipients([]);
  };

  const handleSend = () => {
    if (selectedRecipients.length === 0 || !message.trim()) return;

    // TODO: Implement actual send functionality
    console.log('Sending message:', {
      to: selectedRecipients,
      message: message.trim()
    });

    // Reset and close
    setMessage('');
    setSelectedRecipients([]);
    onClose();
  };

  const handleClose = () => {
    setMessage('');
    setSelectedRecipients([]);
    onClose();
  };

  const isValid = selectedRecipients.length > 0 && message.trim().length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl overflow-hidden flex flex-col"
            style={{
              backgroundColor: isDark ? '#1E293B' : '#FAF9F6',
              maxHeight: '85vh'
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between p-4 border-b"
              style={{ borderColor: isDark ? '#334155' : '#E5E7EB' }}
            >
              <div>
                <h2 className="text-lg font-semibold" style={{ color: theme.textPrimary }}>
                  Message {circleName}
                </h2>
                <p className="text-sm" style={{ color: theme.textSecondary }}>
                  {selectedRecipients.length} of {recipients.length} selected
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-full transition-colors"
                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
              >
                <X size={20} style={{ color: theme.textSecondary }} />
              </button>
            </div>

            {/* Recipients */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium" style={{ color: theme.textSecondary }}>
                  Recipients
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="text-xs font-medium px-2 py-1 rounded-lg transition-colors"
                    style={{
                      color: theme.cta,
                      backgroundColor: `${theme.cta}15`
                    }}
                  >
                    Select All
                  </button>
                  <button
                    onClick={deselectAll}
                    className="text-xs font-medium px-2 py-1 rounded-lg transition-colors"
                    style={{
                      color: theme.textSecondary,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {recipients.map(recipient => {
                  const isSelected = selectedRecipients.includes(recipient.id);
                  return (
                    <button
                      key={recipient.id}
                      onClick={() => toggleRecipient(recipient.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl transition-all"
                      style={{
                        backgroundColor: isSelected
                          ? `${theme.cta}15`
                          : isDark ? 'rgba(255,255,255,0.05)' : 'white',
                        border: `1px solid ${isSelected ? theme.cta : isDark ? '#334155' : '#E5E7EB'}`
                      }}
                    >
                      {/* Selection indicator */}
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                        style={{
                          backgroundColor: isSelected ? theme.cta : 'transparent',
                          border: isSelected ? 'none' : `2px solid ${theme.textSecondary}40`
                        }}
                      >
                        {isSelected && <Check size={14} className="text-white" />}
                      </div>

                      {/* Avatar */}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                        style={{
                          backgroundColor: recipient.status?.state === 'available'
                            ? theme.statusAvailable
                            : recipient.status?.state === 'open'
                              ? theme.statusOpen
                              : theme.statusBusy
                        }}
                      >
                        {recipient.members?.[0]?.avatar || '👤'}
                      </div>

                      {/* Name */}
                      <div className="flex-1 text-left">
                        <p className="font-medium" style={{ color: theme.textPrimary }}>
                          {recipient.householdName}
                        </p>
                        {recipient.status?.note && (
                          <p className="text-xs" style={{ color: theme.textSecondary }}>
                            {recipient.status.note}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message Input + Send */}
            <div
              className="p-4 border-t"
              style={{ borderColor: isDark ? '#334155' : '#E5E7EB' }}
            >
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                rows={3}
                className="w-full p-3 rounded-xl resize-none outline-none transition-colors"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'white',
                  color: theme.textPrimary,
                  border: `1px solid ${isDark ? '#334155' : '#E5E7EB'}`
                }}
              />
              <button
                onClick={handleSend}
                disabled={!isValid}
                className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all"
                style={{
                  backgroundColor: isValid ? theme.cta : isDark ? '#334155' : '#E5E7EB',
                  color: isValid ? 'white' : theme.textSecondary,
                  opacity: isValid ? 1 : 0.6
                }}
              >
                <Send size={18} />
                Send Message
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
