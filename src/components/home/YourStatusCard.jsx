import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { StatusDot } from '../ui/StatusDot';
import { currentHousehold } from '../../data/seedData';

const statusLabels = {
  available: 'Available',
  open: 'Open to Plans',
  busy: 'Busy'
};

export function YourStatusCard({ status, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#E8F0E3] flex items-center justify-center text-xl">
            {currentHousehold.members[0].avatar}
          </div>
          <div>
            <p className="text-sm text-[#6B7280]">Your Status</p>
            <div className="flex items-center gap-2">
              <StatusDot status={status.state} />
              <span className="font-semibold text-[#1F2937]">
                {statusLabels[status.state]}
              </span>
            </div>
          </div>
        </div>
        <ChevronRight size={20} className="text-[#6B7280]" />
      </div>

      {(status.timeWindow || status.note) && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          {status.timeWindow && (
            <p className="text-sm text-[#6B7280]">{status.timeWindow}</p>
          )}
          {status.note && (
            <p className="text-sm text-[#1F2937] mt-1">{status.note}</p>
          )}
        </div>
      )}
    </motion.button>
  );
}
