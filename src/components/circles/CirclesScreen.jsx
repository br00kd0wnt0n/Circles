import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, ChevronRight, Link2 } from 'lucide-react';
import { circles, friendHouseholds } from '../../data/seedData';
import { StatusDot } from '../ui/StatusDot';
import { Button } from '../ui/Button';

// Get the zone key for sorting/grouping
const getZoneKey = (circleIds) => [...circleIds].sort().join('+');

export function CirclesScreen({ onCreateHangout }) {
  const [selectedCircle, setSelectedCircle] = useState(null);
  const [expandedHousehold, setExpandedHousehold] = useState(null);
  const [viewMode, setViewMode] = useState('circles'); // 'circles' or 'overlaps'

  // Compute overlap statistics
  const overlapStats = useMemo(() => {
    const stats = {};
    friendHouseholds.forEach(h => {
      if (h.circleIds?.length > 1) {
        const key = getZoneKey(h.circleIds);
        if (!stats[key]) {
          stats[key] = {
            circles: h.circleIds,
            circleNames: h.circleIds.map(id => circles.find(c => c.id === id)?.name),
            households: []
          };
        }
        stats[key].households.push(h);
      }
    });
    return Object.values(stats);
  }, []);

  const getCircleMembers = (circleId) => {
    return friendHouseholds.filter(h => h.circleIds?.includes(circleId));
  };

  const selectedCircleData = circles.find(c => c.id === selectedCircle);
  const selectedMembers = selectedCircle ? getCircleMembers(selectedCircle) : [];

  return (
    <div className="pb-24">
      <header className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight text-[#1F2937]">Your Circles</h1>
        <p className="text-sm text-[#6B7280] mt-1">Manage your friend groups</p>
      </header>

      {/* View Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setViewMode('circles')}
          className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
            viewMode === 'circles'
              ? 'bg-[#9CAF88] text-white'
              : 'bg-white text-[#6B7280] border border-gray-200'
          }`}
        >
          By Circle
        </button>
        <button
          onClick={() => setViewMode('overlaps')}
          className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            viewMode === 'overlaps'
              ? 'bg-[#9CAF88] text-white'
              : 'bg-white text-[#6B7280] border border-gray-200'
          }`}
        >
          <Link2 size={16} />
          Connections
        </button>
      </div>

      {viewMode === 'circles' ? (
        <>
          {/* Circle Cards */}
          <div className="space-y-3 mb-6">
            {circles.map((circle, index) => {
              const members = getCircleMembers(circle.id);
              const availableCount = members.filter(m => m.status.state !== 'busy').length;
              const multiCircleCount = members.filter(m => m.circleIds?.length > 1).length;
              const isSelected = selectedCircle === circle.id;

              return (
                <motion.button
                  key={circle.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedCircle(isSelected ? null : circle.id)}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                    isSelected
                      ? 'border-[#9CAF88] bg-white shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${circle.color}20` }}
                    >
                      <div
                        className="w-8 h-8 rounded-full"
                        style={{ backgroundColor: circle.color }}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-[#1F2937]">{circle.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-sm text-[#6B7280]">
                          {members.length} families
                        </span>
                        <span className="text-sm text-green-600">
                          {availableCount} available
                        </span>
                        {multiCircleCount > 0 && (
                          <span className="text-xs px-2 py-0.5 bg-[#F4A69A]/20 text-[#F4A69A] rounded-full">
                            {multiCircleCount} shared
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight
                      size={20}
                      className={`text-[#6B7280] transition-transform ${isSelected ? 'rotate-90' : ''}`}
                    />
                  </div>

                  {/* Member previews */}
                  <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-100">
                    {members.slice(0, 6).map((member, i) => (
                      <div
                        key={member.id}
                        className="relative w-8 h-8 rounded-full bg-[#F4F4F5] flex items-center justify-center text-sm border-2 border-white shadow-sm"
                      >
                        {member.members[0]?.avatar}
                        {member.circleIds?.length > 1 && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#F4A69A] rounded-full" />
                        )}
                      </div>
                    ))}
                    {members.length > 6 && (
                      <span className="text-xs text-[#6B7280] ml-1">+{members.length - 6}</span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Selected Circle Detail */}
          <AnimatePresence>
            {selectedCircle && selectedCircleData && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
                  <div
                    className="p-4 flex items-center justify-between"
                    style={{ backgroundColor: `${selectedCircleData.color}10` }}
                  >
                    <h3 className="font-semibold text-[#1F2937]">
                      {selectedCircleData.name} Members
                    </h3>
                    <Button
                      size="sm"
                      onClick={() => onCreateHangout(
                        selectedMembers.filter(m => m.status.state !== 'busy').map(m => m.id)
                      )}
                    >
                      Invite Available
                    </Button>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {selectedMembers.map((household) => (
                      <div key={household.id} className="p-4">
                        <button
                          onClick={() => setExpandedHousehold(
                            expandedHousehold === household.id ? null : household.id
                          )}
                          className="w-full flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-full bg-[#F4F4F5] flex items-center justify-center text-lg">
                                {household.members[0]?.avatar}
                              </div>
                              <StatusDot status={household.status.state} size="sm" />
                              {household.circleIds?.length > 1 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#F4A69A] text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                                  {household.circleIds.length}
                                </span>
                              )}
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-[#1F2937]">{household.householdName}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-[#6B7280]">
                                  {household.status.state === 'available' ? 'Available' :
                                   household.status.state === 'open' ? 'Open to plans' : 'Busy'}
                                </span>
                                {household.circleIds?.length > 1 && (
                                  <span className="text-xs text-[#F4A69A]">
                                    Also in: {household.circleIds
                                      .filter(id => id !== selectedCircle)
                                      .map(id => circles.find(c => c.id === id)?.name.split(' ')[0])
                                      .join(', ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <ChevronRight
                            size={18}
                            className={`text-[#6B7280] transition-transform ${
                              expandedHousehold === household.id ? 'rotate-90' : ''
                            }`}
                          />
                        </button>

                        <AnimatePresence>
                          {expandedHousehold === household.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                            >
                              <div className="pt-3 mt-3 border-t border-gray-100">
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {household.members.map(member => (
                                    <span
                                      key={member.id}
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-[#F4F4F5] rounded-full text-sm"
                                    >
                                      {member.avatar} {member.name}
                                    </span>
                                  ))}
                                </div>
                                {household.status.state !== 'busy' && (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => onCreateHangout([household.id])}
                                  >
                                    Invite to Hangout
                                  </Button>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        /* Connections/Overlaps View */
        <div className="space-y-4">
          <p className="text-sm text-[#6B7280] mb-4">
            Friends who belong to multiple circles - great for bringing groups together!
          </p>

          {overlapStats.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <Link2 size={32} className="mx-auto text-[#6B7280] mb-3" />
              <p className="text-[#6B7280]">No overlapping connections yet</p>
              <p className="text-sm text-[#9CAF88] mt-1">
                Add friends to multiple circles to see connections
              </p>
            </div>
          ) : (
            overlapStats.map((overlap, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
              >
                {/* Overlap header */}
                <div className="p-4 bg-gradient-to-r from-[#F4A69A]/10 to-transparent">
                  <div className="flex items-center gap-2 flex-wrap">
                    {overlap.circles.map((circleId, i) => {
                      const circle = circles.find(c => c.id === circleId);
                      return (
                        <span key={circleId} className="flex items-center gap-1">
                          {i > 0 && <span className="text-[#6B7280]">+</span>}
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${circle?.color}20`,
                              color: circle?.color
                            }}
                          >
                            {circle?.name}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                  <p className="text-sm text-[#6B7280] mt-2">
                    {overlap.households.length} {overlap.households.length === 1 ? 'family' : 'families'} in both
                  </p>
                </div>

                {/* Members in this overlap */}
                <div className="p-4 pt-2 space-y-2">
                  {overlap.households.map(household => (
                    <div
                      key={household.id}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#F4F4F5] flex items-center justify-center text-lg">
                          {household.members[0]?.avatar}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-[#1F2937]">{household.householdName}</p>
                          <div className="flex items-center gap-1">
                            <StatusDot status={household.status.state} size="sm" />
                            <span className="text-xs text-[#6B7280]">
                              {household.status.state === 'available' ? 'Available' :
                               household.status.state === 'open' ? 'Open' : 'Busy'}
                            </span>
                          </div>
                        </div>
                      </div>
                      {household.status.state !== 'busy' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onCreateHangout([household.id])}
                        >
                          Invite
                        </Button>
                      )}
                    </div>
                  ))}

                  {/* Quick action for this overlap group */}
                  <Button
                    className="w-full mt-2"
                    onClick={() => onCreateHangout(
                      overlap.households
                        .filter(h => h.status.state !== 'busy')
                        .map(h => h.id)
                    )}
                  >
                    Invite All Available ({overlap.households.filter(h => h.status.state !== 'busy').length})
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Add New Circle */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full mt-4 p-4 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center gap-2 text-[#6B7280] hover:border-[#9CAF88] hover:text-[#9CAF88] transition-all"
      >
        <Plus size={20} />
        <span className="font-medium">Create New Circle</span>
      </motion.button>
    </div>
  );
}
