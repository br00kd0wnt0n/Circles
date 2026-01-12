import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, Plus, MessageCircle } from 'lucide-react';
import { HeaderLockup } from './HeaderLockup';
import { LocalOffers } from './LocalOffers';
import { HouseholdDetail } from './HouseholdDetail';
import { StatusEditor } from './StatusEditor';
import { MessageComposer } from '../messaging/MessageComposer';
import { StatusDot } from '../ui/StatusDot';
import { friendHouseholds, circles, localOffers } from '../../data/seedData';
import { useTheme } from '../../context/ThemeContext';

// Generate dynamic activity suggestions based on context
const generateSuggestions = (households, weather = 'sunny') => {
  const available = households.filter(h => h.status.state === 'available' || h.status.state === 'open');
  const suggestions = [];

  // Get short name for suggestions
  const getShortName = (name) => name.replace(/^The\s+/i, '');

  // Weather-based activities
  const weatherActivities = {
    sunny: [
      { emoji: '🏊', template: (name) => `Pool day with ${name}?` },
      { emoji: '🌳', template: (name) => `Park hang with ${name}?` },
      { emoji: '🚴', template: (name) => `Bike ride with ${name}?` },
      { emoji: '🍦', template: (name) => `Ice cream with ${name}?` },
    ],
    cloudy: [
      { emoji: '☕', template: (name) => `Coffee with ${name}?` },
      { emoji: '🎨', template: (name) => `Craft day with ${name}?` },
      { emoji: '🌳', template: (name) => `Walk with ${name}?` },
    ],
    rainy: [
      { emoji: '🎬', template: (name) => `Movie day with ${name}?` },
      { emoji: '🎮', template: (name) => `Game night with ${name}?` },
      { emoji: '🧁', template: (name) => `Baking with ${name}?` },
    ]
  };

  const activities = weatherActivities[weather] || weatherActivities.sunny;

  // Add personalized suggestions for available friends
  available.slice(0, 3).forEach((household, i) => {
    const activity = activities[i % activities.length];
    suggestions.push({
      emoji: activity.emoji,
      text: activity.template(getShortName(household.householdName))
    });
  });

  // Add local offer suggestions
  localOffers.slice(0, 2).forEach(offer => {
    if (available.length > 0) {
      const randomFriend = available[Math.floor(Math.random() * available.length)];
      suggestions.push({
        emoji: offer.icon,
        text: `${offer.business} with ${getShortName(randomFriend.householdName)}?`
      });
    }
  });

  // Shuffle and return max 5
  return suggestions.sort(() => Math.random() - 0.5).slice(0, 5);
};

// Sample broadcast notes for demo
const sampleNotes = [
  'Kids are bored!',
  'Anyone around?',
  'Free after 3pm',
  'Pool day?',
  'Looking for playdate',
  'At the park!',
  'Come hang!',
  'Backyard hangout?',
  'Movie night?',
  'Ice cream run!',
  null, // Sometimes clear the note
  null,
];

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

// Circle sizes - balanced for good overlap areas
const circleSizes = {
  'rock-academy': 36,
  'woodstock-elementary': 38,
  'nyc-friends': 38
};

// Circle layout - positioned for proper intersection zones
// SVG viewBox is "-15 -15 130 130", coordinates range from -15 to 115
const circleLayout = {
  'rock-academy': { cx: 28, cy: 30, r: circleSizes['rock-academy'] },
  'woodstock-elementary': { cx: 72, cy: 30, r: circleSizes['woodstock-elementary'] },
  'nyc-friends': { cx: 50, cy: 72, r: circleSizes['nyc-friends'] }
};

// Contact positions - well inside their designated regions
const circlePositions = {
  // rock-academy only: Barretts - inside Rock circle
  'barretts': { x: 14, y: 26 },

  // woodstock-elementary only: Smiths, Wangros - inside Woodstock
  'smiths': { x: 86, y: 18 },
  'wangros': { x: 82, y: 34 },

  // nyc-friends only: Chase+Waverly, Cassie+Riley - inside NYC circle
  'chase-waverly': { x: 40, y: 84 },
  'cassie-riley': { x: 60, y: 84 },

  // rock-academy + woodstock-elementary intersection: Sachs - top center overlap
  'sachs': { x: 50, y: 24 },

  // woodstock-elementary + nyc-friends intersection: Sarah - bottom right overlap
  'sarah': { x: 66, y: 56 },

  // nyc-friends + rock-academy intersection: Asens - bottom left overlap
  'asens': { x: 34, y: 56 },

  // All three circles (center): Mandy - clearly in center
  'mandy': { x: 50, y: 48 },
};

// Get short display name
const getShortName = (householdName) => {
  // Remove "The " prefix, keep everything else
  return householdName.replace(/^The\s+/i, '');
};

export function UnifiedHomeCircles({
  viewMode, // 'venn' or 'scattered'
  myHousehold,
  myStatus,
  setMyStatus,
  onCreateHangout,
  onOpenSettings
}) {
  const { theme } = useTheme();
  const [selectedHousehold, setSelectedHousehold] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [showStatusEditor, setShowStatusEditor] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState(null);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [showMessageComposer, setShowMessageComposer] = useState(false);

  // Local state for simulated household updates
  const [liveHouseholds, setLiveHouseholds] = useState(friendHouseholds);

  // Generate dynamic suggestions based on available friends and weather
  const activitySuggestions = useMemo(() => {
    return generateSuggestions(liveHouseholds, 'sunny');
  }, [liveHouseholds]);

  // Auto-cycle activity suggestions (slower pace)
  useEffect(() => {
    if (activitySuggestions.length === 0) return;
    const interval = setInterval(() => {
      setSuggestionIndex(prev => (prev + 1) % activitySuggestions.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [activitySuggestions.length]);

  // Simulate random status updates (demo mode)
  useEffect(() => {
    const simulateUpdate = () => {
      setLiveHouseholds(prev => {
        const newHouseholds = [...prev];
        const randomIndex = Math.floor(Math.random() * newHouseholds.length);
        const household = { ...newHouseholds[randomIndex] };

        // Randomly decide what to update
        const updateType = Math.random();

        if (updateType < 0.6) {
          // 60% chance: change status
          const statuses = ['available', 'open', 'busy'];
          const currentIndex = statuses.indexOf(household.status.state);
          // Bias towards adjacent statuses for more realistic transitions
          const direction = Math.random() < 0.5 ? 1 : -1;
          const newIndex = Math.max(0, Math.min(2, currentIndex + direction));
          household.status = {
            ...household.status,
            state: statuses[newIndex]
          };
        } else {
          // 40% chance: change note
          const newNote = sampleNotes[Math.floor(Math.random() * sampleNotes.length)];
          household.status = {
            ...household.status,
            note: newNote
          };
        }

        newHouseholds[randomIndex] = household;
        return newHouseholds;
      });
    };

    // Update every 20 seconds
    const interval = setInterval(simulateUpdate, 20000);
    return () => clearInterval(interval);
  }, []);

  // Status colors from theme
  const statusColors = {
    available: theme.statusAvailable,
    open: theme.statusOpen,
    busy: theme.statusBusy
  };

  // Circle colors from theme
  const circleColors = {
    'rock-academy': theme.circleRock,
    'woodstock-elementary': theme.circleWoodstock,
    'nyc-friends': theme.circleNyc
  };

  // Get members of selected circle
  const selectedCircleData = circles.find(c => c.id === selectedCircle);
  const selectedCircleMembers = useMemo(() => {
    if (!selectedCircle) return [];
    return liveHouseholds.filter(h => h.circleIds?.includes(selectedCircle));
  }, [selectedCircle, liveHouseholds]);

  const availableFriends = useMemo(() => {
    const available = liveHouseholds.filter(h =>
      h.status.state === 'available' || h.status.state === 'open'
    );
    return { available: available.length, total: liveHouseholds.length };
  }, [liveHouseholds]);

  const isVennView = viewMode === 'venn';

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header - always visible */}
      <motion.div
        className="flex-shrink-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, marginBottom: 16 }}
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
        animate={{ opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex-shrink-0 flex items-center justify-between px-4 mb-3"
      >
        {/* Weather + Cycling Suggestion */}
        <div className="flex items-center gap-2">
          <div className="text-sm" style={{ color: theme.textSecondary }}>
            <span className="font-medium">72°</span>
            <div className="text-xs">Sunny</div>
          </div>
          {activitySuggestions.length > 0 && (
            <>
              <div className="h-6 w-px" style={{ backgroundColor: `${theme.textSecondary}30` }} />
              <AnimatePresence mode="wait">
                <motion.div
                  key={suggestionIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="flex items-center gap-1"
                >
                  <span className="text-sm">{activitySuggestions[suggestionIndex % activitySuggestions.length]?.emoji}</span>
                  <span className="text-[11px] font-medium" style={{ color: theme.textSecondary }}>
                    {activitySuggestions[suggestionIndex % activitySuggestions.length]?.text}
                  </span>
                </motion.div>
              </AnimatePresence>
            </>
          )}
        </div>
        <div className="text-sm text-right" style={{ color: theme.textSecondary }}>
          <span className="font-medium">{availableFriends.available}</span>
          <span className="mx-0.5">/</span>
          <span>{availableFriends.total}</span>
          <div className="text-xs">Friends Available</div>
        </div>
      </motion.div>

      {/* Contacts area with circle outlines */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center overflow-visible px-4 -mt-4">
        <div className="relative w-full aspect-square max-w-[340px] max-h-[85%]">
          {/* Circle outlines - only show in circles view */}
          <AnimatePresence>
            {isVennView && (
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
                    d={`M ${circleLayout['nyc-friends'].cx - circleLayout['nyc-friends'].r * 0.7} ${circleLayout['nyc-friends'].cy + circleLayout['nyc-friends'].r + 1}
                        A ${circleLayout['nyc-friends'].r + 1} ${circleLayout['nyc-friends'].r + 1} 0 0 0
                        ${circleLayout['nyc-friends'].cx + circleLayout['nyc-friends'].r * 0.7} ${circleLayout['nyc-friends'].cy + circleLayout['nyc-friends'].r + 1}`}
                    fill="none"
                  />
                </defs>

                {/* Rock Academy - left circle */}
                <circle
                  cx={circleLayout['rock-academy'].cx}
                  cy={circleLayout['rock-academy'].cy}
                  r={circleLayout['rock-academy'].r}
                  fill={`${circleColors['rock-academy']}20`}
                  stroke={circleColors['rock-academy']}
                  strokeWidth="0.6"
                  strokeOpacity="0.5"
                  style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                  onClick={() => setSelectedCircle('rock-academy')}
                />
                <text fill={circleColors['rock-academy']} fontSize="4" fontWeight="600" opacity="0.9">
                  <textPath href="#rockAcademyPath" startOffset="50%" textAnchor="middle">
                    Rock Academy
                  </textPath>
                </text>

                {/* Woodstock Elementary - right circle */}
                <circle
                  cx={circleLayout['woodstock-elementary'].cx}
                  cy={circleLayout['woodstock-elementary'].cy}
                  r={circleLayout['woodstock-elementary'].r}
                  fill={`${circleColors['woodstock-elementary']}20`}
                  stroke={circleColors['woodstock-elementary']}
                  strokeWidth="0.6"
                  strokeOpacity="0.5"
                  style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                  onClick={() => setSelectedCircle('woodstock-elementary')}
                />
                <text fill={circleColors['woodstock-elementary']} fontSize="4" fontWeight="600" opacity="0.9">
                  <textPath href="#woodstockPath" startOffset="50%" textAnchor="middle">
                    Woodstock
                  </textPath>
                </text>

                {/* NYC Friends - bottom circle */}
                <circle
                  cx={circleLayout['nyc-friends'].cx}
                  cy={circleLayout['nyc-friends'].cy}
                  r={circleLayout['nyc-friends'].r}
                  fill={`${circleColors['nyc-friends']}20`}
                  stroke={circleColors['nyc-friends']}
                  strokeWidth="0.6"
                  strokeOpacity="0.5"
                  style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                  onClick={() => setSelectedCircle('nyc-friends')}
                />
                <text fill={circleColors['nyc-friends']} fontSize="4" fontWeight="600" opacity="0.9">
                  <textPath href="#nycFriendsPath" startOffset="50%" textAnchor="middle">
                    NYC Friends
                  </textPath>
                </text>
              </motion.svg>
            )}
          </AnimatePresence>

          {/* Contact dots */}
          {liveHouseholds.map((household, index) => {
          const scatteredPos = scatteredPositions[household.id] || { x: 50, y: 50 };
          const circlePos = circlePositions[household.id] || scatteredPos;
          const targetPos = isVennView ? circlePos : scatteredPos;

          const color = statusColors[household.status.state] || statusColors.busy;
          const isSelected = selectedHousehold?.id === household.id;
          const isHovered = hoveredId === household.id;
          const hasNote = !!household.status.note;
          const isAvailable = household.status.state !== 'busy';

          // Unique float animation parameters for each contact
          const floatDuration = 4 + (index % 3) * 0.8;
          const floatDelay = index * 0.4;

          return (
            <motion.div
              key={household.id}
              className="absolute cursor-pointer"
              animate={{
                left: `${targetPos.x}%`,
                top: `${targetPos.y}%`,
                scale: isSelected ? 1.15 : isHovered ? 1.08 : 1,
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

              {/* Status Circle - size varies by status, subtle floating */}
              <motion.div
                className="relative rounded-full shadow-md"
                style={{ backgroundColor: color }}
                animate={{
                  width: household.status.state === 'busy' ? 24 : household.status.state === 'open' ? 36 : 40,
                  height: household.status.state === 'busy' ? 24 : household.status.state === 'open' ? 36 : 40,
                  boxShadow: isSelected
                    ? `0 0 0 3px ${color}50, 0 4px 12px ${color}60`
                    : `0 2px 6px rgba(0,0,0,0.1)`,
                  y: isSelected || isHovered ? 0 : [0, -1.5, 0, 1, 0],
                }}
                transition={{
                  width: { type: 'spring', stiffness: 300, damping: 25 },
                  height: { type: 'spring', stiffness: 300, damping: 25 },
                  boxShadow: { duration: 0.2 },
                  y: { duration: floatDuration, repeat: Infinity, ease: 'easeInOut', delay: floatDelay },
                }}
              />

              {/* Name Label */}
              <motion.span
                className="absolute left-1/2 -translate-x-1/2 mt-1.5 text-xs font-medium whitespace-nowrap"
                style={{ color: theme.textSecondary }}
              >
                {getShortName(household.householdName)}
              </motion.span>
            </motion.div>
          );
        })}
        </div>
      </div>

      {/* Local Offers - always visible */}
      <motion.div
        className="flex-shrink-0 overflow-hidden px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <LocalOffers />
      </motion.div>

      {/* Circle Detail - Full Screen Zoom */}
      <AnimatePresence mode="sync">
        {selectedCircle && selectedCircleData && (
          <motion.div
            className="absolute inset-0 z-50 flex flex-col overflow-hidden"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
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
                opacity: 1,
              }}
              animate={{
                width: 60,
                height: 60,
                x: '-50%',
                y: '-50%',
                scale: 25,
                opacity: 1,
              }}
              exit={{
                scale: 3,
                opacity: 0,
              }}
              transition={{
                type: 'spring',
                damping: 28,
                stiffness: 180,
                mass: 0.8,
                opacity: { duration: 0.35, ease: 'easeOut' }
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
              transition={{ duration: 0.2 }}
            />

            {/* Header with back button */}
            <motion.div
              className="relative z-10 px-4 pt-4 pb-3"
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, transition: { duration: 0.15 } }}
              transition={{ delay: 0.25, duration: 0.35, ease: 'easeOut' }}
            >
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
            </motion.div>

            {/* Member List */}
            <motion.div
              className="relative z-10 flex-1 overflow-y-auto px-4 pb-32"
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
                          Make Plans
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Bottom Action Bar */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-6 pt-4"
              style={{
                background: `linear-gradient(to top, ${selectedCircleData.color} 70%, transparent)`
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20, transition: { duration: 0.1 } }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onCreateHangout(selectedCircleMembers.filter(m => m.status.state !== 'busy').map(m => m.id));
                    setSelectedCircle(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/90 hover:bg-white text-gray-800 rounded-xl font-medium shadow-lg transition-colors"
                >
                  <Plus size={20} />
                  Invite All
                </button>
                <button
                  onClick={() => setShowMessageComposer(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-medium transition-colors"
                >
                  <MessageCircle size={20} />
                  Message All
                </button>
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

      {/* Message Composer */}
      <MessageComposer
        isOpen={showMessageComposer}
        onClose={() => setShowMessageComposer(false)}
        recipients={selectedCircleMembers}
        circleName={selectedCircleData?.name || ''}
      />
    </div>
  );
}
