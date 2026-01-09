import { motion } from 'framer-motion';
import { MapPin, Check } from 'lucide-react';

const typeIcons = {
  any: '🤷',
  indoor: '🏠',
  outdoor: '🌳',
  food: '🍽️',
  active: '🎯'
};

export function ActivityCard({ activity, isSelected, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={`flex-shrink-0 w-36 p-3 rounded-xl border-2 transition-all text-left ${
        isSelected
          ? 'border-[#9CAF88] bg-[#E8F0E3]'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{typeIcons[activity.type]}</span>
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-5 h-5 bg-[#9CAF88] rounded-full flex items-center justify-center"
          >
            <Check size={12} className="text-white" />
          </motion.div>
        )}
      </div>
      <p className="font-medium text-sm text-[#1F2937] leading-tight">{activity.name}</p>
      <div className="flex items-center gap-1 mt-1">
        <MapPin size={10} className="text-[#6B7280]" />
        <span className="text-xs text-[#6B7280]">{activity.location}</span>
      </div>
    </motion.button>
  );
}
