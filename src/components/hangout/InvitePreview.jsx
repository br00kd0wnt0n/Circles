import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';

export function InvitePreview({ when, timeSlot, activity, friends, isValid }) {
  if (!when && !timeSlot && !activity && friends.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white rounded-xl p-4 shadow-md border border-gray-100"
      >
        <p className="text-xs font-medium text-[#6B7280] mb-2 uppercase tracking-wide">
          Invite Preview
        </p>
        <div className="space-y-2">
          {when && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={14} className="text-[#9CAF88]" />
              <span className="text-[#1F2937]">{when}</span>
            </div>
          )}
          {timeSlot && (
            <div className="flex items-center gap-2 text-sm">
              <Clock size={14} className="text-[#9CAF88]" />
              <span className="text-[#1F2937]">{timeSlot.label} ({timeSlot.time})</span>
            </div>
          )}
          {activity && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={14} className="text-[#9CAF88]" />
              <span className="text-[#1F2937]">{activity.name}</span>
            </div>
          )}
          {friends.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Users size={14} className="text-[#9CAF88]" />
              <span className="text-[#1F2937]">
                {friends.map(f => f.householdName).join(', ')}
              </span>
            </div>
          )}
        </div>
        {!isValid && (
          <p className="text-xs text-[#6B7280] mt-3 pt-3 border-t border-gray-100">
            Select a time and at least one friend to send invite
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
