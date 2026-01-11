import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Mic, X, ChevronLeft } from 'lucide-react';
import { HeaderLockup } from './HeaderLockup';
import { LocalOffers } from './LocalOffers';
import { HouseholdDetail } from './HouseholdDetail';
import { StatusEditor } from './StatusEditor';
import { StatusDot } from '../ui/StatusDot';
import { friendHouseholds, circles } from '../../data/seedData';

// Status colors
const statusColors = {
  available: '#9CAF88',
  open: '#F4D03F',
  busy: '#F4A69A'
};

// Scattered positions for Home view (3x3 organic grid)
const scatteredPositions = {
  'barretts': { x: 18, y: 15 },
  'sachs': { x: 50, y: 10 },
  'smiths': { x: 82, y: 18 },
  'chase-waverly': { x: 12, y: 45 },
  'mandy': { x: 45, y: 40 },
  'sarah': { x: 78, y: 48 },
  'cassie-riley': { x: 22, y: 75 },
  'wangros': { x: 55, y: 72 },
  'asens': { x: 85, y: 78 },
};

// Calculate circle sizes based on member count
const getCircleSizes = () => {
  const counts = {};
  circles.forEach(c => {
    counts[c.id] = friendHouseholds.filter(h => h.circleIds?.includes(c.id)).length;
  });
  const maxCount = Math.max(...Object.values(counts));
  const minSize = 38;
  const maxSize = 46;

  const sizes = {};
  circles.forEach(c => {
    const ratio = counts[c.id] / maxCount;
    sizes[c.id] = minSize + (maxSize - minSize) * ratio;
  });
  return sizes;
};

const circleSizes = getCircleSizes();

// Circle layout - Venn diagram with 3 overlapping circles
// Larger circles with adjusted positions for better overlap
const circleLayout = {
  'rock-academy': { cx: 28, cy: 35, r: circleSizes['rock-academy'] },
  'woodstock-elementary': { cx: 72, cy: 35, r: circleSizes['woodstock-elementary'] },
  'nyc-friends': { cx: 50, cy: 72, r: circleSizes['nyc-friends'] }
};

// Explicit circle positions for each household based on their circle membership
// Positions adjusted for larger circles with good spacing
const circlePositions = {
  // rock-academy only: Barretts - left side of left circle
  'barretts': { x: 8, y: 32 },

  // woodstock-elementary only: Smiths, Wangros - right side of right circle
  'smiths': { x: 92, y: 24 },
  'wangros': { x: 92, y: 44 },

  // nyc-friends only: Chase+Waverly, Cassie+Riley - inside bottom circle
  'chase-waverly': { x: 35, y: 80 },
  'cassie-riley': { x: 65, y: 80 },

  // rock-academy + woodstock-elementary intersection: Sachs - top center
  'sachs': { x: 50, y: 16 },

  // woodstock-elementary + nyc-friends intersection: Sarah - bottom right
  'sarah': { x: 76, y: 58 },

  // nyc-friends + rock-academy intersection: Asens - bottom left
  'asens': { x: 24, y: 58 },

  // All three circles (center): Mandy
  'mandy': { x: 50, y: 42 },
};

// Get short display name
const getShortName = (householdName) => {
  return householdName.replace(/^The\s+/i, '').replace(/s$/i, '');
};

export function UnifiedHomeCircles({
  viewMode, // 'home' or 'circles'
  myHousehold,
  myStatus,
  setMyStatus,
  onCreateHangout,
  onOpenSettings
}) {
  const [selectedHousehold, setSelectedHousehold] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [showStatusEditor, setShowStatusEditor] = useState(false);
  const [showVoiceMode, setShowVoiceMode] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState(null);

  // Get members of selected circle
  const selectedCircleData = circles.find(c => c.id === selectedCircle);
  const selectedCircleMembers = useMemo(() => {
    if (!selectedCircle) return [];
    return friendHouseholds.filter(h => h.circleIds?.includes(selectedCircle));
  }, [selectedCircle]);

  const availableFriends = useMemo(() => {
    const available = friendHouseholds.filter(h =>
      h.status.state === 'available' || h.status.state === 'open'
    );
    return { available: available.length, total: friendHouseholds.length };
  }, []);

  const isCirclesView = viewMode === 'circles';

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header - slides up when in circles view */}
      <motion.div
        className="flex-shrink-0"
        animate={{
          height: isCirclesView ? 0 : 'auto',
          opacity: isCirclesView ? 0 : 1,
          marginBottom: isCirclesView ? 0 : 16
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <HeaderLockup
          household={myHousehold}
          status={myStatus}
          onStatusChange={setMyStatus}
          onOpenSettings={onOpenSettings}
        />
      </motion.div>

      {/* Info Bar - always visible */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          paddingTop: isCirclesView ? 24 : 0
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex-shrink-0 flex items-start justify-between px-4 mb-3"
      >
        <div className="text-sm text-[#6B7280]">
          <span className="font-medium">72°</span>
          <div className="text-xs">Sunny</div>
        </div>
        <div className="text-sm text-[#6B7280] text-right">
          <span className="font-medium">{availableFriends.available}</span>
          <span className="mx-0.5">/</span>
          <span>{availableFriends.total}</span>
          <div className="text-xs">Friends Available</div>
        </div>
      </motion.div>

      {/* Contacts area with circle outlines */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center overflow-visible px-4">
        <div className="relative w-full aspect-square max-w-[340px] max-h-full">
          {/* Circle outlines - only show in circles view */}
          <AnimatePresence>
            {isCirclesView && (
              <motion.svg
                viewBox="-15 -15 130 130"
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ overflow: 'visible' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <defs>
                  {/* Curved paths for text - positioned outside circles with more offset */}
                  <path
                    id="rockAcademyPath"
                    d={`M ${circleLayout['rock-academy'].cx - circleLayout['rock-academy'].r - 6} ${circleLayout['rock-academy'].cy}
                        A ${circleLayout['rock-academy'].r + 6} ${circleLayout['rock-academy'].r + 6} 0 0 1
                        ${circleLayout['rock-academy'].cx} ${circleLayout['rock-academy'].cy - circleLayout['rock-academy'].r - 6}`}
                    fill="none"
                  />
                  <path
                    id="woodstockPath"
                    d={`M ${circleLayout['woodstock-elementary'].cx} ${circleLayout['woodstock-elementary'].cy - circleLayout['woodstock-elementary'].r - 6}
                        A ${circleLayout['woodstock-elementary'].r + 6} ${circleLayout['woodstock-elementary'].r + 6} 0 0 1
                        ${circleLayout['woodstock-elementary'].cx + circleLayout['woodstock-elementary'].r + 6} ${circleLayout['woodstock-elementary'].cy}`}
                    fill="none"
                  />
                  <path
                    id="nycFriendsPath"
                    d={`M ${circleLayout['nyc-friends'].cx - circleLayout['nyc-friends'].r * 0.7} ${circleLayout['nyc-friends'].cy + circleLayout['nyc-friends'].r + 2}
                        A ${circleLayout['nyc-friends'].r + 2} ${circleLayout['nyc-friends'].r + 2} 0 0 0
                        ${circleLayout['nyc-friends'].cx + circleLayout['nyc-friends'].r * 0.7} ${circleLayout['nyc-friends'].cy + circleLayout['nyc-friends'].r + 2}`}
                    fill="none"
                  />
                </defs>

                {/* Rock Academy - left circle */}
                <circle
                  cx={circleLayout['rock-academy'].cx}
                  cy={circleLayout['rock-academy'].cy}
                  r={circleLayout['rock-academy'].r}
                  fill="#9CAF8820"
                  stroke="#9CAF88"
                  strokeWidth="0.6"
                  strokeOpacity="0.5"
                  style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                  onClick={() => setSelectedCircle('rock-academy')}
                />
                <text fill="#9CAF88" fontSize="4" fontWeight="600" opacity="0.9">
                  <textPath href="#rockAcademyPath" startOffset="50%" textAnchor="middle">
                    Rock Academy
                  </textPath>
                </text>

                {/* Woodstock Elementary - right circle */}
                <circle
                  cx={circleLayout['woodstock-elementary'].cx}
                  cy={circleLayout['woodstock-elementary'].cy}
                  r={circleLayout['woodstock-elementary'].r}
                  fill="#94A3B820"
                  stroke="#94A3B8"
                  strokeWidth="0.6"
                  strokeOpacity="0.5"
                  style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                  onClick={() => setSelectedCircle('woodstock-elementary')}
                />
                <text fill="#94A3B8" fontSize="4" fontWeight="600" opacity="0.9">
                  <textPath href="#woodstockPath" startOffset="50%" textAnchor="middle">
                    Woodstock
                  </textPath>
                </text>

                {/* NYC Friends - bottom circle */}
                <circle
                  cx={circleLayout['nyc-friends'].cx}
                  cy={circleLayout['nyc-friends'].cy}
                  r={circleLayout['nyc-friends'].r}
                  fill="#F4A69A20"
                  stroke="#F4A69A"
                  strokeWidth="0.6"
                  strokeOpacity="0.5"
                  style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                  onClick={() => setSelectedCircle('nyc-friends')}
                />
                <text fill="#F4A69A" fontSize="4" fontWeight="600" opacity="0.9">
                  <textPath href="#nycFriendsPath" startOffset="50%" textAnchor="middle">
                    NYC Friends
                  </textPath>
                </text>
              </motion.svg>
            )}
          </AnimatePresence>

          {/* Contact dots */}
          {friendHouseholds.map((household) => {
          const scatteredPos = scatteredPositions[household.id] || { x: 50, y: 50 };
          const circlePos = circlePositions[household.id] || scatteredPos;
          const targetPos = isCirclesView ? circlePos : scatteredPos;

          const color = statusColors[household.status.state] || statusColors.busy;
          const isSelected = selectedHousehold?.id === household.id;
          const isHovered = hoveredId === household.id;
          const hasNote = !!household.status.note;
          const isAvailable = household.status.state !== 'busy';

          return (
            <motion.div
              key={household.id}
              className="absolute cursor-pointer"
              animate={{
                left: `${targetPos.x}%`,
                top: `${targetPos.y}%`,
                scale: isSelected ? 1.15 : isHovered ? 1.08 : 1
              }}
              initial={false}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 25,
                mass: 1
              }}
              style={{ transform: 'translate(-50%, -50%)' }}
              onClick={() => setSelectedHousehold(household)}
              onMouseEnter={() => setHoveredId(household.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Broadcast Pulse Rings */}
              {hasNote && isAvailable && (
                <>
                  <motion.div
                    className="absolute inset-0 rounded-full border-2"
                    style={{ borderColor: color }}
                    initial={{ scale: 1, opacity: 0 }}
                    animate={{
                      scale: [1, 1.5, 2.2],
                      opacity: [0, 0.5, 0]
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: 'easeOut',
                      times: [0, 0.2, 1]
                    }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full border-2"
                    style={{ borderColor: color }}
                    initial={{ scale: 1, opacity: 0 }}
                    animate={{
                      scale: [1, 1.5, 2.2],
                      opacity: [0, 0.5, 0]
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: 'easeOut',
                      times: [0, 0.2, 1],
                      delay: 1.25
                    }}
                  />
                </>
              )}

              {/* Status Circle */}
              <motion.div
                className="relative w-10 h-10 rounded-full shadow-md"
                style={{ backgroundColor: color }}
                animate={{
                  boxShadow: isSelected
                    ? `0 0 0 3px ${color}50, 0 4px 12px ${color}60`
                    : `0 2px 6px rgba(0,0,0,0.1)`
                }}
              />

              {/* Name Label */}
              <motion.span
                className="absolute left-1/2 -translate-x-1/2 mt-1.5 text-xs font-medium text-[#6B7280] whitespace-nowrap"
              >
                {getShortName(household.householdName)}
              </motion.span>
            </motion.div>
          );
        })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex-shrink-0 py-3 flex justify-center gap-2">
        <motion.button
          onClick={() => onCreateHangout()}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#6366F1] text-white rounded-xl font-medium text-sm shadow-md"
          whileHover={{ backgroundColor: '#4F46E5' }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus size={18} />
          <span>Make Plans</span>
        </motion.button>

        <motion.button
          onClick={() => setShowVoiceMode(true)}
          className="flex items-center justify-center w-11 h-11 bg-[#6366F1] text-white rounded-xl shadow-md"
          whileHover={{ backgroundColor: '#4F46E5' }}
          whileTap={{ scale: 0.98 }}
        >
          <Mic size={20} />
        </motion.button>
      </div>

      {/* Local Offers - slides down when in circles view */}
      <motion.div
        className="flex-shrink-0 overflow-hidden px-4"
        animate={{
          height: isCirclesView ? 0 : 'auto',
          opacity: isCirclesView ? 0 : 1
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <LocalOffers />
      </motion.div>

      {/* Voice Mode Dialog */}
      <AnimatePresence>
        {showVoiceMode && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setShowVoiceMode(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-6"
            >
              <div className="flex justify-center -mt-3 mb-4">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>
              <button
                onClick={() => setShowVoiceMode(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} className="text-[#6B7280]" />
              </button>
              <div className="text-center pb-8">
                <motion.div
                  className="w-20 h-20 mx-auto mb-5 bg-[#9CAF88]/10 rounded-full flex items-center justify-center"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <motion.div
                    className="w-14 h-14 bg-[#9CAF88] rounded-full flex items-center justify-center text-white"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Mic size={28} />
                  </motion.div>
                </motion.div>
                <h3 className="text-lg font-semibold text-[#1F2937] mb-2">
                  What can I help you set up?
                </h3>
                <p className="text-sm text-[#6B7280] max-w-[280px] mx-auto">
                  Just tell me who you want to hang with and I'll find you options that work!
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Circle Detail - Full Screen Zoom */}
      <AnimatePresence mode="wait">
        {selectedCircle && selectedCircleData && (
          <motion.div
            className="absolute inset-0 z-50 flex flex-col overflow-hidden"
          >
            {/* Expanding Circle Background - zooms from circle position */}
            <motion.div
              className="absolute rounded-full"
              style={{
                backgroundColor: selectedCircleData.color,
                // Start from the circle's approximate position in the container
                left: `${circleLayout[selectedCircle]?.cx || 50}%`,
                top: `${(circleLayout[selectedCircle]?.cy || 50) * 0.6 + 15}%`,
                transformOrigin: 'center center',
              }}
              initial={{
                width: 60,
                height: 60,
                x: '-50%',
                y: '-50%',
                scale: 1,
              }}
              animate={{
                width: 60,
                height: 60,
                x: '-50%',
                y: '-50%',
                scale: 25,
              }}
              exit={{
                scale: 1,
              }}
              transition={{
                type: 'spring',
                damping: 28,
                stiffness: 180,
                mass: 0.8,
              }}
            />

            {/* Subtle inner glow overlay */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at 50% 30%, rgba(255,255,255,0.15) 0%, transparent 60%)`
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.15, duration: 0.2 }}
            />

            {/* Header with back button */}
            <motion.div
              className="relative z-10 px-4 pt-4 pb-3"
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, transition: { duration: 0.15 } }}
              transition={{ delay: 0.25, duration: 0.35, ease: 'easeOut' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedCircle(null)}
                    className="p-2 -ml-2 bg-white/20 hover:bg-white/40 rounded-full transition-colors"
                  >
                    <ChevronLeft size={24} className="text-white" />
                  </button>
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      {selectedCircleData.name}
                    </h2>
                    <p className="text-sm text-white/80">
                      {selectedCircleMembers.length} households · {selectedCircleMembers.filter(m => m.status.state !== 'busy').length} available
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onCreateHangout(selectedCircleMembers.filter(m => m.status.state !== 'busy').map(m => m.id));
                    setSelectedCircle(null);
                  }}
                  className="px-4 py-2 bg-white/90 hover:bg-white text-gray-800 rounded-xl font-medium text-sm shadow-sm transition-colors"
                >
                  Invite All
                </button>
              </div>
            </motion.div>

            {/* Member List */}
            <motion.div
              className="relative z-10 flex-1 overflow-y-auto px-4 pb-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={{ delay: 0.3, duration: 0.25 }}
            >
              <div className="space-y-3 pt-2">
                {selectedCircleMembers.map((household, index) => (
                  <motion.div
                    key={household.id}
                    className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.1 } }}
                    transition={{
                      delay: 0.35 + index * 0.05,
                      type: 'spring',
                      damping: 22,
                      stiffness: 280
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-md"
                            style={{ backgroundColor: statusColors[household.status.state] || statusColors.busy }}
                          >
                            {household.members[0]?.avatar}
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5">
                            <StatusDot status={household.status.state} size="sm" />
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-[#1F2937]">
                            {household.householdName}
                          </p>
                          <p className="text-sm text-[#6B7280]">
                            {household.members.map(m => m.name.split(' ')[0]).join(', ')}
                          </p>
                          {household.status.note && (
                            <p className="text-xs mt-1 px-2 py-0.5 bg-gray-100 rounded-full inline-block text-[#6B7280]">
                              "{household.status.note}"
                            </p>
                          )}
                        </div>
                      </div>
                      {household.status.state !== 'busy' && (
                        <button
                          onClick={() => {
                            onCreateHangout([household.id]);
                            setSelectedCircle(null);
                          }}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm transition-colors"
                        >
                          Invite
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Editor */}
      <StatusEditor
        isOpen={showStatusEditor}
        onClose={() => setShowStatusEditor(false)}
        status={myStatus}
        onSave={(newStatus) => {
          setMyStatus(newStatus);
          setShowStatusEditor(false);
        }}
      />

      {/* Household Detail Sheet */}
      <HouseholdDetail
        household={selectedHousehold}
        isOpen={!!selectedHousehold}
        onClose={() => setSelectedHousehold(null)}
        onInvite={onCreateHangout}
      />
    </div>
  );
}
