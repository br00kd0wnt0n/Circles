import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, ChevronDown, Link2, Pencil, X } from 'lucide-react';
import { circles, friendHouseholds } from '../../data/seedData';
import { StatusDot } from '../ui/StatusDot';
import { Button } from '../ui/Button';

// Convert hex to rgba
const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export function CirclesScreen({ onCreateHangout }) {
  const [selectedCircle, setSelectedCircle] = useState(null);
  const [editingCircle, setEditingCircle] = useState(null);

  const getCircleMembers = (circleId) => {
    return friendHouseholds.filter(h => h.circleIds?.includes(circleId));
  };

  const selectedCircleData = circles.find(c => c.id === selectedCircle);
  const selectedMembers = selectedCircle ? getCircleMembers(selectedCircle) : [];

  return (
    <div className="pb-24">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-[#1F2937]">Your Circles</h1>
        <p className="text-sm text-[#6B7280] mt-1">Tap a circle to see members</p>
      </header>

      {/* Circles displayed in a loose quadrant layout */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-6">
        {circles.map((circle, index) => {
          const members = getCircleMembers(circle.id);
          const availableCount = members.filter(m => m.status.state !== 'busy').length;
          const isSelected = selectedCircle === circle.id;

          // Offset alternating rows for organic feel
          const isOddRow = Math.floor(index / 2) % 2 === 1;

          return (
            <motion.div
              key={circle.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`flex flex-col items-center ${isOddRow ? 'mt-8' : ''}`}
            >
              {/* The Circle */}
              <motion.button
                onClick={() => setSelectedCircle(isSelected ? null : circle.id)}
                className="relative"
                whileTap={{ scale: 0.95 }}
              >
                {/* Main circle */}
                <motion.div
                  className="w-44 h-44 rounded-full flex flex-col items-center justify-center relative"
                  style={{
                    backgroundColor: hexToRgba(circle.color, 0.2),
                    border: isSelected ? `2px solid ${circle.color}` : `1.5px solid ${hexToRgba(circle.color, 0.4)}`
                  }}
                  animate={{
                    scale: isSelected ? 1.05 : 1,
                    boxShadow: isSelected
                      ? `0 8px 30px ${hexToRgba(circle.color, 0.4)}`
                      : `0 4px 15px ${hexToRgba(circle.color, 0.15)}`
                  }}
                >
                  {/* Circle name */}
                  <p
                    className="font-semibold text-base text-center px-4 leading-tight"
                    style={{ color: circle.color }}
                  >
                    {circle.name}
                  </p>

                  {/* Member count */}
                  <p className="text-xs text-[#6B7280] mt-1.5">
                    {members.length} families
                  </p>

                  {/* Available indicator */}
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-[11px] text-green-600 font-medium">{availableCount} available</span>
                  </div>

                  {/* Member avatars around the edge */}
                  {members.slice(0, 6).map((member, i) => {
                    const angle = (i * 60 - 90) * (Math.PI / 180);
                    const radius = 80;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;

                    return (
                      <div
                        key={member.id}
                        className="absolute w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center text-lg border-2"
                        style={{
                          transform: `translate(${x}px, ${y}px)`,
                          borderColor: member.status.state === 'busy' ? '#FDA4AF' :
                                       member.status.state === 'open' ? '#FCD34D' : '#86EFAC'
                        }}
                      >
                        {member.members[0]?.avatar}
                      </div>
                    );
                  })}

                  {members.length > 6 && (
                    <div
                      className="absolute w-9 h-9 rounded-full bg-[#F4F4F5] shadow-md flex items-center justify-center text-xs font-medium text-[#6B7280]"
                      style={{
                        transform: `translate(${Math.cos((6 * 60 - 90) * (Math.PI / 180)) * 80}px, ${Math.sin((6 * 60 - 90) * (Math.PI / 180)) * 80}px)`
                      }}
                    >
                      +{members.length - 6}
                    </div>
                  )}
                </motion.div>

                {/* Edit button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCircle(circle.id);
                  }}
                  className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50"
                >
                  <Pencil size={14} className="text-[#6B7280]" />
                </button>
              </motion.button>

            </motion.div>
          );
        })}

        {/* Add New Circle - matches row offset of its position */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`flex flex-col items-center ${Math.floor(circles.length / 2) % 2 === 1 ? 'mt-8' : ''}`}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-44 h-44 rounded-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 text-[#6B7280] hover:border-[#9CAF88] hover:text-[#9CAF88] transition-colors bg-white/30"
          >
            <Plus size={36} />
            <span className="text-sm font-medium">Add Circle</span>
          </motion.button>
        </motion.div>
      </div>

      {/* Bottom Sheet for Selected Circle */}
      <AnimatePresence>
        {selectedCircle && selectedCircleData && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setSelectedCircle(null)}
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[70vh] overflow-hidden"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>

              {/* Header */}
              <div
                className="px-4 py-3 flex items-center justify-between border-b"
                style={{ borderColor: hexToRgba(selectedCircleData.color, 0.2) }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: hexToRgba(selectedCircleData.color, 0.2) }}
                  >
                    <span className="text-lg font-semibold" style={{ color: selectedCircleData.color }}>
                      {selectedMembers.length}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1F2937]">{selectedCircleData.name}</h3>
                    <p className="text-xs text-[#6B7280]">
                      {selectedMembers.filter(m => m.status.state !== 'busy').length} available now
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    onCreateHangout(selectedMembers.filter(m => m.status.state !== 'busy').map(m => m.id));
                    setSelectedCircle(null);
                  }}
                >
                  Invite All Available
                </Button>
              </div>

              {/* Member List */}
              <div className="overflow-y-auto max-h-[calc(70vh-120px)]">
                <div className="divide-y divide-gray-50">
                  {selectedMembers.map((household) => (
                    <div
                      key={household.id}
                      className="px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-11 h-11 rounded-full bg-[#F4F4F5] flex items-center justify-center text-xl">
                            {household.members[0]?.avatar}
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5">
                            <StatusDot status={household.status.state} size="sm" />
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-[#1F2937]">
                            {household.householdName}
                          </p>
                          <p className="text-xs text-[#6B7280]">
                            {household.members.length} members
                            {household.status.note && ` · "${household.status.note}"`}
                          </p>
                        </div>
                      </div>
                      {household.status.state !== 'busy' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            onCreateHangout([household.id]);
                            setSelectedCircle(null);
                          }}
                        >
                          Invite
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Safe area padding for bottom */}
              <div className="h-6" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Circle Bottom Sheet */}
      <AnimatePresence>
        {editingCircle && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setEditingCircle(null)}
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>

              <div className="px-5 pb-8">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-semibold text-[#1F2937]">Edit Circle</h3>
                  <button
                    onClick={() => setEditingCircle(null)}
                    className="p-2 hover:bg-gray-100 rounded-full -mr-2"
                  >
                    <X size={20} className="text-[#6B7280]" />
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-medium text-[#6B7280] block mb-2">
                      Circle Name
                    </label>
                    <input
                      type="text"
                      defaultValue={circles.find(c => c.id === editingCircle)?.name}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[#1F2937] focus:outline-none focus:border-[#9CAF88]"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[#6B7280] block mb-2">
                      Color
                    </label>
                    <div className="flex gap-3">
                      {['#9CAF88', '#94A3B8', '#F4A69A', '#8B5CF6', '#F59E0B', '#06B6D4'].map(color => (
                        <button
                          key={color}
                          className="w-11 h-11 rounded-full border-2 border-white shadow-md"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <Button className="w-full mt-2" onClick={() => setEditingCircle(null)}>
                    Save Changes
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
