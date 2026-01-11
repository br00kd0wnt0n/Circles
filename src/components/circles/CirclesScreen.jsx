import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { circles, friendHouseholds } from '../../data/seedData';
import { VennDiagram } from '../home/VennDiagram';
import { StatusDot } from '../ui/StatusDot';
import { Button } from '../ui/Button';
import { HouseholdDetail } from '../home/HouseholdDetail';

// Convert hex to rgba
const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export function CirclesScreen({ onCreateHangout }) {
  const [selectedCircle, setSelectedCircle] = useState(null);
  const [selectedHousehold, setSelectedHousehold] = useState(null);
  const [editingCircle, setEditingCircle] = useState(null);

  const getCircleMembers = (circleId) => {
    return friendHouseholds.filter(h => h.circleIds?.includes(circleId));
  };

  const selectedCircleData = circles.find(c => c.id === selectedCircle);
  const selectedMembers = selectedCircle ? getCircleMembers(selectedCircle) : [];

  // Calculate available friends
  const availableFriends = useMemo(() => {
    const available = friendHouseholds.filter(h =>
      h.status.state === 'available' || h.status.state === 'open'
    );
    return { available: available.length, total: friendHouseholds.length };
  }, []);

  return (
    <div className="pb-24">
      {/* Info Bar - same as Home */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-start justify-between px-1 mb-4"
      >
        <div className="text-sm text-[#6B7280]">
          <span className="font-medium">72</span>
          <div className="text-xs">Sunny</div>
        </div>
        <div className="text-sm text-[#6B7280] text-right">
          <span className="font-medium">{availableFriends.available}</span>
          <span className="mx-0.5">/</span>
          <span>{availableFriends.total}</span>
          <div className="text-xs">Friends Available</div>
        </div>
      </motion.div>

      {/* Venn Diagram - organized view of contacts in their circles */}
      <VennDiagram
        onSelectHousehold={(household) => setSelectedHousehold(household)}
        selectedHousehold={selectedHousehold}
        onSelectCircle={(circleId) => setSelectedCircle(circleId)}
      />

      {/* Action Buttons */}
      <div className="mt-6 flex justify-center gap-2">
        <motion.button
          onClick={() => onCreateHangout()}
          className="flex items-center gap-2 px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm border border-gray-200"
          whileHover={{ backgroundColor: '#e5e5e5' }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus size={18} />
          <span>Make Plans</span>
        </motion.button>

        <motion.button
          className="flex items-center justify-center px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm border border-gray-200"
          whileHover={{ backgroundColor: '#e5e5e5' }}
          whileTap={{ scale: 0.98 }}
        >
          <span>Mic</span>
        </motion.button>
      </div>

      {/* Household Detail Sheet */}
      <HouseholdDetail
        household={selectedHousehold}
        isOpen={!!selectedHousehold}
        onClose={() => setSelectedHousehold(null)}
        onInvite={onCreateHangout}
      />

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
