import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { Button } from '../ui/Button';
import { ActivityCard } from './ActivityCard';
import { FriendCard } from './FriendCard';
import { InvitePreview } from './InvitePreview';
import { friendHouseholds, activities, timeSlots } from '../../data/seedData';

const dateOptions = [
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'weekend', label: 'This Weekend' }
];

export function CreateHangout({ isOpen, onClose, onSend, preselectedFriends = [] }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedFriends, setSelectedFriends] = useState([]);

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

  const isValid = selectedTimeSlot && selectedFriends.length > 0;

  const handleSend = () => {
    if (!isValid) return;

    onSend({
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      activity: selectedActivity,
      invitedHouseholds: selectedFriends
    });

    // Reset
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    setSelectedActivity(null);
    setSelectedFriends([]);
    onClose();
  };

  const selectedFriendObjects = friendHouseholds.filter(h =>
    selectedFriends.includes(h.id)
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 bg-[#FAF9F6] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
              <h2 className="text-lg font-semibold text-[#1F2937]">Create Hangout</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-[#6B7280]" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 pb-48">
              {/* When */}
              <section className="mb-6">
                <h3 className="text-sm font-medium text-[#6B7280] mb-3">When?</h3>
                <div className="flex gap-2">
                  {dateOptions.map(option => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedDate(selectedDate === option.label ? null : option.label)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedDate === option.label
                          ? 'bg-[#9CAF88] text-white'
                          : 'bg-white text-[#6B7280] border border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Time Slot */}
              <section className="mb-6">
                <h3 className="text-sm font-medium text-[#6B7280] mb-3">What time?</h3>
                <div className="flex flex-wrap gap-2">
                  {timeSlots.map(slot => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedTimeSlot(selectedTimeSlot?.id === slot.id ? null : slot)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedTimeSlot?.id === slot.id
                          ? 'bg-[#9CAF88] text-white'
                          : 'bg-white text-[#6B7280] border border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Activity */}
              <section className="mb-6">
                <h3 className="text-sm font-medium text-[#6B7280] mb-3">What's the plan?</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar -mx-4 px-4">
                  {activities.map(activity => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      isSelected={selectedActivity?.id === activity.id}
                      onClick={() => setSelectedActivity(selectedActivity?.id === activity.id ? null : activity)}
                    />
                  ))}
                </div>
              </section>

              {/* Friends */}
              <section>
                <h3 className="text-sm font-medium text-[#6B7280] mb-3">Who's invited?</h3>
                <div className="space-y-2">
                  {friendHouseholds.map(household => (
                    <FriendCard
                      key={household.id}
                      household={household}
                      isSelected={selectedFriends.includes(household.id)}
                      onClick={() => {
                        if (household.status.state !== 'busy') {
                          toggleFriend(household.id);
                        }
                      }}
                    />
                  ))}
                </div>
              </section>
            </div>

            {/* Fixed Bottom Preview + Send */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#FAF9F6] via-[#FAF9F6] to-transparent pt-8">
              <InvitePreview
                when={selectedDate}
                timeSlot={selectedTimeSlot}
                activity={selectedActivity}
                friends={selectedFriendObjects}
                isValid={isValid}
              />
              <Button
                onClick={handleSend}
                disabled={!isValid}
                className={`w-full mt-3 flex items-center justify-center gap-2 ${
                  !isValid ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                size="lg"
              >
                <Send size={18} />
                Send Invite
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
