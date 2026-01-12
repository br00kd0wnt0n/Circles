import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Calendar, Users } from 'lucide-react';
import { StatusDot } from '../ui/StatusDot';
import { CircleBadge } from '../ui/CircleBadge';
import { Button } from '../ui/Button';
import { circles } from '../../data/seedData';

const statusLabels = {
  available: 'Available',
  open: 'Open to Plans',
  busy: 'Busy'
};

export function HouseholdDetail({ household, isOpen, onClose, onInvite }) {
  if (!household) return null;

  const householdCircles = circles.filter(c => household.circleIds?.includes(c.id));

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
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[80vh] overflow-hidden"
          >
            {/* Header */}
            <div className="relative p-6 pb-4">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
              >
                <X size={20} className="text-[#6B7280]" />
              </button>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-[#F4F4F5] flex items-center justify-center text-2xl border-2 border-white shadow-md">
                    {household.members[0]?.avatar || '👥'}
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <StatusDot status={household.status.state} size="md" />
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#1F2937]">
                    {household.householdName}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-[#6B7280]">
                      {statusLabels[household.status.state]}
                    </span>
                    {household.status.timeWindow && (
                      <span className="text-sm px-2 py-0.5 bg-[#E8F0E3] rounded-full text-[#1F2937]">
                        {household.status.timeWindow}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {household.status.note && (
                <div className="mt-4 p-3 bg-[#FAF9F6] rounded-xl">
                  <p className="text-sm text-[#1F2937]">"{household.status.note}"</p>
                </div>
              )}
            </div>

            {/* Members */}
            <div className="px-6 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} className="text-[#6B7280]" />
                <span className="text-sm font-medium text-[#6B7280]">Family Members</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {household.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 px-3 py-2 bg-[#F4F4F5] rounded-full"
                  >
                    <span className="text-lg">{member.avatar}</span>
                    <span className="text-sm font-medium text-[#1F2937]">{member.name}</span>
                    <span className="text-xs text-[#6B7280] capitalize">{member.role}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Circles */}
            {householdCircles.length > 0 && (
              <div className="px-6 pb-4">
                <p className="text-sm font-medium text-[#6B7280] mb-2">Shared Circles</p>
                <div className="flex gap-2">
                  {householdCircles.map(circle => (
                    <CircleBadge key={circle.id} name={circle.name} color={circle.color} size="md" />
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="p-6 pt-2 pb-8 border-t border-gray-100 flex gap-3">
              <Button variant="secondary" className="flex-1 flex items-center justify-center gap-2">
                <MessageCircle size={18} />
                Message
              </Button>
              <Button
                className="flex-1 flex items-center justify-center gap-2"
                onClick={() => {
                  onInvite([household.id]);
                  onClose();
                }}
                disabled={household.status.state === 'busy'}
              >
                <Calendar size={18} />
                Make Plans
              </Button>
            </div>
            {/* Safe area padding for nav bar */}
            <div className="h-16" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
