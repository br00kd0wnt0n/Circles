import { motion } from 'framer-motion';
import { StatusDot } from '../ui/StatusDot';
import { Check } from 'lucide-react';

export function FriendCard({ household, isSelected, onClick }) {
  const isAvailable = household.status.state !== 'busy';

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      disabled={!isAvailable}
      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
        isSelected
          ? 'border-[#9CAF88] bg-[#E8F0E3]'
          : isAvailable
          ? 'border-gray-200 bg-white hover:border-gray-300'
          : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
      }`}
    >
      <div className="w-10 h-10 rounded-full bg-[#F4F4F5] flex items-center justify-center text-lg">
        {household.members[0]?.avatar || '👥'}
      </div>
      <div className="flex-1 text-left">
        <p className="font-medium text-[#1F2937] text-sm">{household.householdName}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <StatusDot status={household.status.state} size="sm" />
          {household.status.note && (
            <span className="text-xs text-[#6B7280]">{household.status.note}</span>
          )}
          {household.status.timeWindow && (
            <span className="text-xs text-[#6B7280]">{household.status.timeWindow}</span>
          )}
        </div>
      </div>
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-6 h-6 bg-[#9CAF88] rounded-full flex items-center justify-center"
        >
          <Check size={14} className="text-white" />
        </motion.div>
      )}
    </motion.button>
  );
}
