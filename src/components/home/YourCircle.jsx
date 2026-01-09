import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { StatusDot } from '../ui/StatusDot';

const statusLabels = {
  available: 'Available',
  open: 'Open to Plans',
  busy: 'Busy'
};

export function YourCircle({ household, status, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
    >
      <div className="flex items-center gap-4">
        {/* Your circle avatar */}
        <div className="relative">
          <motion.div
            animate={{
              boxShadow: status.state === 'available'
                ? ['0 0 0 0 rgba(34, 197, 94, 0.4)', '0 0 0 8px rgba(34, 197, 94, 0)', '0 0 0 0 rgba(34, 197, 94, 0.4)']
                : status.state === 'open'
                ? ['0 0 0 0 rgba(251, 191, 36, 0.4)', '0 0 0 6px rgba(251, 191, 36, 0)', '0 0 0 0 rgba(251, 191, 36, 0.4)']
                : 'none'
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-[#9CAF88] to-[#7a9468] flex items-center justify-center"
          >
            <span className="text-2xl">{household.members[0]?.avatar}</span>
          </motion.div>
          <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
            <StatusDot status={status.state} size="md" />
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 text-left">
          <p className="font-semibold text-[#1F2937]">{household.householdName}</p>
          <p className="text-sm text-[#6B7280]">{statusLabels[status.state]}</p>
          {status.note && (
            <p className="text-xs text-[#9CAF88] mt-0.5">{status.note}</p>
          )}
        </div>

        <ChevronRight size={20} className="text-[#6B7280]" />
      </div>

      {/* Family members preview */}
      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-100">
        {household.members.slice(0, 5).map((member, i) => (
          <motion.span
            key={member.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="w-7 h-7 rounded-full bg-[#F4F4F5] flex items-center justify-center text-sm border border-white shadow-sm"
          >
            {member.avatar}
          </motion.span>
        ))}
        {household.members.length > 5 && (
          <span className="text-xs text-[#6B7280] ml-1">
            +{household.members.length - 5}
          </span>
        )}
      </div>
    </motion.button>
  );
}
