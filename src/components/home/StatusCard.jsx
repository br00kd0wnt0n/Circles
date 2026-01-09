import { motion } from 'framer-motion';
import { StatusDot } from '../ui/StatusDot';
import { CircleBadge } from '../ui/CircleBadge';
import { circles } from '../../data/seedData';

const statusLabels = {
  available: 'Available',
  open: 'Open to Plans',
  busy: 'Busy'
};

export function StatusCard({ household, onClick, index = 0 }) {
  const householdCircles = circles.filter(c =>
    household.circleIds?.includes(c.id)
  );

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
      whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
      whileTap={{ scale: 0.98 }}
      className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[#F4F4F5] flex items-center justify-center text-lg border-2 border-white shadow-sm">
            {household.members[0]?.avatar || '👥'}
          </div>
          <div>
            <p className="font-semibold text-[#1F2937]">{household.householdName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusDot status={household.status.state} size="sm" />
              <span className="text-sm text-[#6B7280]">
                {statusLabels[household.status.state]}
              </span>
            </div>
          </div>
        </div>

        {householdCircles.length > 0 && (
          <div className="flex gap-1">
            {householdCircles.slice(0, 2).map(circle => (
              <CircleBadge key={circle.id} name={circle.name.split(' ')[0]} color={circle.color} />
            ))}
          </div>
        )}
      </div>

      {(household.status.timeWindow || household.status.note) && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2 items-center">
          {household.status.timeWindow && (
            <span className="text-sm px-2 py-0.5 bg-[#E8F0E3] text-[#1F2937] rounded-full">
              {household.status.timeWindow}
            </span>
          )}
          {household.status.note && (
            <span className="text-sm text-[#6B7280]">{household.status.note}</span>
          )}
        </div>
      )}
    </motion.button>
  );
}
