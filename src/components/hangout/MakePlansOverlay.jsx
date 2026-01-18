import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Mic, Calendar, MapPin, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { DeliveryMethodSelector } from './DeliveryMethodSelector';
import { activities, timeSlots } from '../../data/seedData';

const dateOptions = [
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'weekend', label: 'This Weekend' }
];

export function MakePlansOverlay({ onClose, onSend, preselectedFriends = [] }) {
  const { theme, themeId } = useTheme();
  const { friendHouseholds } = useData();
  const isDark = themeId === 'midnight';

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [deliveryMethods, setDeliveryMethods] = useState({});
  const [showDeliveryOptions, setShowDeliveryOptions] = useState(false);
  const [showVoiceMode, setShowVoiceMode] = useState(false);

  useEffect(() => {
    if (preselectedFriends.length > 0) {
      setSelectedFriends(preselectedFriends);
    }
  }, [preselectedFriends]);

  const toggleFriend = (friendId) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  // Only require friends selected - when/what are optional
  const isValid = selectedFriends.length > 0;

  // Get selected friend objects for delivery selector
  const selectedFriendObjects = useMemo(() => {
    return selectedFriends.map(id => {
      const household = friendHouseholds.find(h => h.id === id);
      return {
        id,
        householdName: household?.householdName || '',
        avatar: household?.members?.[0]?.avatar,
        isAppUser: household?.isAppUser !== false // Default to true for demo
      };
    });
  }, [selectedFriends, friendHouseholds]);

  const handleSend = () => {
    if (!isValid) return;
    onSend({
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      activity: selectedActivity,
      invitedHouseholds: selectedFriends,
      deliveryMethods
    });
  };

  // Filter to available friends
  const availableFriends = friendHouseholds.filter(h => h.status.state !== 'busy');

  return (
    <div className="px-4 pt-6 pb-24 h-full overflow-y-auto">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: theme.textPrimary }}>
            Make Plans
          </h1>
          <p className="text-sm mt-1" style={{ color: theme.textSecondary }}>
            Who do you want to hang with?
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full transition-colors"
          style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
        >
          <X size={20} style={{ color: theme.textSecondary }} />
        </button>
      </header>

      {/* Voice Mode Button */}
      <motion.button
        onClick={() => setShowVoiceMode(true)}
        className="w-full mb-6 p-4 rounded-2xl flex items-center gap-4 transition-colors"
        style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
        }}
        whileTap={{ scale: 0.98 }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${theme.cta}20` }}
        >
          <Mic size={24} style={{ color: theme.cta }} />
        </div>
        <div className="text-left">
          <p className="font-medium" style={{ color: theme.textPrimary }}>
            Just tell me what you want
          </p>
          <p className="text-sm" style={{ color: theme.textSecondary }}>
            Tap to speak your plans
          </p>
        </div>
      </motion.button>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px" style={{ backgroundColor: `${theme.textSecondary}30` }} />
        <span className="text-xs font-medium" style={{ color: theme.textSecondary }}>or choose below</span>
        <div className="flex-1 h-px" style={{ backgroundColor: `${theme.textSecondary}30` }} />
      </div>

      {/* When Section */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={16} style={{ color: theme.textSecondary }} />
          <h3 className="text-sm font-medium" style={{ color: theme.textSecondary }}>When?</h3>
        </div>
        <div className="flex gap-2 flex-wrap">
          {dateOptions.map(option => (
            <motion.button
              key={option.id}
              onClick={() => setSelectedDate(selectedDate === option.label ? null : option.label)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                backgroundColor: selectedDate === option.label ? theme.cta : (isDark ? 'rgba(255,255,255,0.1)' : 'white'),
                color: selectedDate === option.label ? 'white' : theme.textSecondary,
                border: selectedDate === option.label ? 'none' : `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
              }}
              whileTap={{ scale: 0.95 }}
            >
              {option.label}
            </motion.button>
          ))}
        </div>
        {selectedDate && (
          <div className="flex gap-2 flex-wrap mt-3">
            {timeSlots.map(slot => (
              <motion.button
                key={slot.id}
                onClick={() => setSelectedTimeSlot(selectedTimeSlot?.id === slot.id ? null : slot)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  backgroundColor: selectedTimeSlot?.id === slot.id ? theme.cta : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
                  color: selectedTimeSlot?.id === slot.id ? 'white' : theme.textSecondary,
                }}
                whileTap={{ scale: 0.95 }}
              >
                {slot.label}
              </motion.button>
            ))}
          </div>
        )}
      </section>

      {/* Activity Section */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <MapPin size={16} style={{ color: theme.textSecondary }} />
          <h3 className="text-sm font-medium" style={{ color: theme.textSecondary }}>What's the plan?</h3>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar -mx-4 px-4">
          {activities.slice(0, 6).map(activity => (
            <motion.button
              key={activity.id}
              onClick={() => setSelectedActivity(selectedActivity?.id === activity.id ? null : activity)}
              className="flex-shrink-0 px-4 py-3 rounded-xl text-sm font-medium transition-all min-w-[100px]"
              style={{
                backgroundColor: selectedActivity?.id === activity.id ? theme.cta : (isDark ? 'rgba(255,255,255,0.1)' : 'white'),
                color: selectedActivity?.id === activity.id ? 'white' : theme.textPrimary,
                border: selectedActivity?.id === activity.id ? 'none' : `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
              }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="text-center">
                <span className="text-lg block mb-1">
                  {activity.type === 'outdoor' ? '🌳' : activity.type === 'food' ? '🍽️' : activity.type === 'active' ? '⚡' : '🏠'}
                </span>
                <span className="text-xs">{activity.name}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Friends Section */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Users size={16} style={{ color: theme.textSecondary }} />
          <h3 className="text-sm font-medium" style={{ color: theme.textSecondary }}>
            Who's in? ({selectedFriends.length} selected)
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {availableFriends.map(household => {
            const isSelected = selectedFriends.includes(household.id);
            const statusColor = household.status.state === 'available' ? theme.statusAvailable : theme.statusOpen;
            return (
              <motion.button
                key={household.id}
                onClick={() => toggleFriend(household.id)}
                className="p-3 rounded-xl text-center transition-all"
                style={{
                  backgroundColor: isSelected ? `${theme.cta}15` : (isDark ? 'rgba(255,255,255,0.05)' : 'white'),
                  border: `2px solid ${isSelected ? theme.cta : 'transparent'}`,
                  boxShadow: isSelected ? 'none' : '0 1px 3px rgba(0,0,0,0.1)'
                }}
                whileTap={{ scale: 0.95 }}
              >
                <div
                  className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-lg"
                  style={{ backgroundColor: statusColor }}
                >
                  {household.members[0]?.avatar || '👤'}
                </div>
                <p className="text-xs font-medium truncate" style={{ color: theme.textPrimary }}>
                  {household.householdName?.replace(/^The\s+/i, '') || ''}
                </p>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Delivery Options - Collapsible */}
      {selectedFriends.length > 0 && (
        <section className="mb-6">
          <button
            onClick={() => setShowDeliveryOptions(!showDeliveryOptions)}
            className="flex items-center justify-between w-full mb-3"
          >
            <div className="flex items-center gap-2">
              <Send size={16} style={{ color: theme.textSecondary }} />
              <h3 className="text-sm font-medium" style={{ color: theme.textSecondary }}>
                Delivery options
              </h3>
            </div>
            {showDeliveryOptions ? (
              <ChevronUp size={16} style={{ color: theme.textSecondary }} />
            ) : (
              <ChevronDown size={16} style={{ color: theme.textSecondary }} />
            )}
          </button>
          <AnimatePresence>
            {showDeliveryOptions && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <DeliveryMethodSelector
                  friends={selectedFriendObjects}
                  selectedMethods={deliveryMethods}
                  onMethodChange={setDeliveryMethods}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      {/* Send Button - Fixed at bottom */}
      <motion.div
        className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-auto sm:max-w-[398px] sm:mx-auto sm:w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <motion.button
          onClick={handleSend}
          disabled={!isValid}
          className="w-full py-4 rounded-2xl font-medium flex items-center justify-center gap-2 shadow-lg transition-all"
          style={{
            backgroundColor: isValid ? theme.cta : (isDark ? '#334155' : '#E5E7EB'),
            color: isValid ? 'white' : theme.textSecondary,
            opacity: isValid ? 1 : 0.6
          }}
          whileTap={isValid ? { scale: 0.98 } : {}}
        >
          <Send size={20} />
          Send Invite
        </motion.button>
      </motion.div>

      {/* Voice Mode Modal */}
      <AnimatePresence>
        {showVoiceMode && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowVoiceMode(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 rounded-3xl p-8 max-w-sm mx-auto"
              style={{ backgroundColor: isDark ? '#1E293B' : 'white' }}
            >
              <button
                onClick={() => setShowVoiceMode(false)}
                className="absolute top-4 right-4 p-2 rounded-full"
                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
              >
                <X size={20} style={{ color: theme.textSecondary }} />
              </button>
              <div className="text-center">
                <motion.div
                  className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${theme.cta}20` }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <motion.div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: theme.cta }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Mic size={32} className="text-white" />
                  </motion.div>
                </motion.div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: theme.textPrimary }}>
                  What do you want to do?
                </h3>
                <p className="text-sm mb-4" style={{ color: theme.textSecondary }}>
                  Try saying "Pool day with the Barretts tomorrow afternoon"
                </p>
                <div
                  className="text-xs py-2 px-4 rounded-full inline-block"
                  style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: theme.textSecondary }}
                >
                  Listening...
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
