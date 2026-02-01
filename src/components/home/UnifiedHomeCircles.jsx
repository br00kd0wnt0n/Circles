import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, Plus, MessageCircle } from 'lucide-react';
import { HeaderLockup } from './HeaderLockup';
import { LocalOffers } from './LocalOffers';
import { HouseholdDetail } from './HouseholdDetail';
import { StatusEditor } from './StatusEditor';
import { MessageComposer } from '../messaging/MessageComposer';
import { StatusDot } from '../ui/StatusDot';
import { VennDiagram } from './VennDiagram';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';

// Generate dynamic activity suggestions based on context
const generateSuggestions = (households, offers = [], weather = 'sunny') => {
  const available = households.filter(h => h.status?.state === 'available' || h.status?.state === 'open');
  const suggestions = [];

  // Get short name for suggestions
  const getShortName = (name) => name?.replace(/^The\s+/i, '') || '';

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

  // Add local offer suggestions from API data
  (offers || []).slice(0, 2).forEach(offer => {
    if (available.length > 0) {
      const randomFriend = available[Math.floor(Math.random() * available.length)];
      suggestions.push({
        emoji: offer.icon || '🏪',
        text: `${offer.business?.name || offer.title || 'Local spot'} with ${getShortName(randomFriend.householdName)}?`
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

// Circle sizes - NYC larger (more contacts)
const circleSizes = {
  'rock-academy': 34,
  'woodstock-elementary': 36,
  'nyc-friends': 42
};

// Circle layout - positioned for proper intersection zones
// SVG viewBox is "-15 -15 130 130", coordinates range from -15 to 115
const circleLayout = {
  'rock-academy': { cx: 28, cy: 30, r: circleSizes['rock-academy'] },
  'woodstock-elementary': { cx: 72, cy: 30, r: circleSizes['woodstock-elementary'] },
  'nyc-friends': { cx: 50, cy: 72, r: circleSizes['nyc-friends'] }
};

// Contact positions - based on actual overlap geometry (for demo data)
const circlePositions = {
  // rock-academy only: Barretts - inside Rock circle
  'barretts': { x: 14, y: 26 },

  // woodstock-elementary only: Smiths, Wangros - inside Woodstock
  'smiths': { x: 80, y: 20 },
  'wangros': { x: 78, y: 36 },

  // nyc-friends only: Chase+Waverly, Cassie+Riley - inside NYC (spread apart)
  'chase-waverly': { x: 30, y: 76 },
  'cassie-riley': { x: 64, y: 82 },

  // rock-academy + woodstock-elementary intersection: Sachs - centered in top overlap
  'sachs': { x: 46, y: 22 },

  // woodstock-elementary + nyc-friends intersection: Sarah - in right overlap
  'sarah': { x: 64, y: 52 },

  // nyc-friends + rock-academy intersection: Asens - in left overlap
  'asens': { x: 26, y: 48 },

  // All three circles (center): Mandy - TRUE center of triple overlap
  'mandy': { x: 46, y: 42 },
};

// Generate elegant symmetrical positions for contacts
// Creates an expanding pattern: center -> ring -> outer ring
const generateSymmetricalPositions = (total) => {
  const positions = [];
  const centerX = 50;
  const centerY = 45; // Slightly above center for visual balance

  if (total === 0) return positions;

  if (total === 1) {
    // Single contact at center
    positions.push({ x: centerX, y: centerY });
    return positions;
  }

  if (total === 2) {
    // Two contacts side by side
    positions.push({ x: 35, y: centerY });
    positions.push({ x: 65, y: centerY });
    return positions;
  }

  if (total === 3) {
    // Triangle formation
    positions.push({ x: 50, y: 28 }); // top
    positions.push({ x: 30, y: 58 }); // bottom left
    positions.push({ x: 70, y: 58 }); // bottom right
    return positions;
  }

  if (total === 4) {
    // Diamond formation
    positions.push({ x: 50, y: 22 }); // top
    positions.push({ x: 25, y: 45 }); // left
    positions.push({ x: 75, y: 45 }); // right
    positions.push({ x: 50, y: 68 }); // bottom
    return positions;
  }

  if (total === 5) {
    // Pentagon/star formation
    const radius = 28;
    for (let i = 0; i < 5; i++) {
      const angle = (i * 72 - 90) * (Math.PI / 180); // Start from top
      positions.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      });
    }
    return positions;
  }

  if (total === 6) {
    // Hexagon formation
    const radius = 28;
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60 - 90) * (Math.PI / 180);
      positions.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      });
    }
    return positions;
  }

  // For 7+ contacts: inner ring + outer ring pattern
  // Calculate how many in inner vs outer ring
  let innerCount, outerCount;
  if (total <= 9) {
    // 7-9: 3-4 inner, rest outer
    innerCount = Math.min(4, Math.floor(total / 2));
    outerCount = total - innerCount;
  } else if (total <= 14) {
    // 10-14: 5-6 inner, rest outer
    innerCount = Math.min(6, Math.floor(total * 0.4));
    outerCount = total - innerCount;
  } else {
    // 15+: inner ring, middle ring, outer ring
    innerCount = 6;
    const remaining = total - innerCount;
    const middleCount = Math.min(8, Math.floor(remaining * 0.5));
    outerCount = remaining - middleCount;

    // Inner ring (radius 18)
    for (let i = 0; i < innerCount; i++) {
      const angle = (i * (360 / innerCount) - 90) * (Math.PI / 180);
      positions.push({
        x: centerX + Math.cos(angle) * 18,
        y: centerY + Math.sin(angle) * 18
      });
    }

    // Middle ring (radius 32)
    for (let i = 0; i < middleCount; i++) {
      const angle = (i * (360 / middleCount) - 90 + 15) * (Math.PI / 180); // Offset for visual interest
      positions.push({
        x: centerX + Math.cos(angle) * 32,
        y: centerY + Math.sin(angle) * 32
      });
    }

    // Outer ring (radius 42)
    for (let i = 0; i < outerCount; i++) {
      const angle = (i * (360 / outerCount) - 90) * (Math.PI / 180);
      positions.push({
        x: centerX + Math.cos(angle) * 42,
        y: centerY + Math.sin(angle) * 42
      });
    }

    return positions;
  }

  // Inner ring (radius 20)
  const innerRadius = 20;
  for (let i = 0; i < innerCount; i++) {
    const angle = (i * (360 / innerCount) - 90) * (Math.PI / 180);
    positions.push({
      x: centerX + Math.cos(angle) * innerRadius,
      y: centerY + Math.sin(angle) * innerRadius
    });
  }

  // Outer ring (radius 38)
  const outerRadius = 38;
  for (let i = 0; i < outerCount; i++) {
    const angle = (i * (360 / outerCount) - 90 + 30) * (Math.PI / 180); // Offset for visual interest
    positions.push({
      x: centerX + Math.cos(angle) * outerRadius,
      y: centerY + Math.sin(angle) * outerRadius
    });
  }

  return positions;
};

// Legacy function for backwards compatibility with demo data
const generateDynamicPosition = (index, total) => {
  const positions = generateSymmetricalPositions(total);
  return positions[index] || { x: 50, y: 50 };
};

// Get short display name
const getShortName = (householdName) => {
  // Remove "The " prefix, keep everything else
  return householdName?.replace(/^The\s+/i, '') || '';
};

export function UnifiedHomeCircles({
  viewMode, // 'venn' or 'scattered'
  myHousehold,
  myStatus,
  setMyStatus,
  onCreateHangout,
  onOpenSettings,
  onOpenContacts,
  onOpenCircles,
  introRevealed = true, // Controls intro animation
  weather = 'sunny',
  temperature = 72
}) {
  const { theme } = useTheme();
  const { friendHouseholds, circles, offers, demoMode } = useData();
  const [selectedHousehold, setSelectedHousehold] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [showStatusEditor, setShowStatusEditor] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState(null);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [showMessageComposer, setShowMessageComposer] = useState(false);

  // Live households from context (updates via socket)
  const [liveHouseholds, setLiveHouseholds] = useState(friendHouseholds);

  // Generate intro delays dynamically based on actual households
  const introDelays = useMemo(() => {
    const delays = {};
    (friendHouseholds || []).forEach((h) => {
      delays[h.id] = Math.random() * 0.4; // Random delay between 0 and 0.4s
    });
    return delays;
  }, [friendHouseholds]);

  // Sync with context when friendHouseholds changes
  useEffect(() => {
    if (friendHouseholds?.length > 0) {
      setLiveHouseholds(friendHouseholds);
    }
  }, [friendHouseholds]);

  // Generate dynamic suggestions based on available friends and weather
  const activitySuggestions = useMemo(() => {
    return generateSuggestions(liveHouseholds, offers, weather);
  }, [liveHouseholds, offers, weather]);

  // Auto-cycle activity suggestions (slower pace)
  useEffect(() => {
    if (activitySuggestions.length === 0) return;
    const interval = setInterval(() => {
      setSuggestionIndex(prev => (prev + 1) % activitySuggestions.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [activitySuggestions.length]);

  // Simulate random status updates (ONLY in demo mode)
  useEffect(() => {
    // Only run status simulation in demo mode
    if (!demoMode) return;

    const simulateUpdate = () => {
      setLiveHouseholds(prev => {
        if (!prev || prev.length === 0) return prev;
        const newHouseholds = [...prev];
        const randomIndex = Math.floor(Math.random() * newHouseholds.length);
        const household = { ...newHouseholds[randomIndex] };

        // Randomly decide what to update
        const updateType = Math.random();

        if (updateType < 0.6) {
          // 60% chance: change status
          const statuses = ['available', 'open', 'busy'];
          const currentIndex = statuses.indexOf(household.status?.state);
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
  }, [demoMode]);

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
      h.status?.state === 'available' || h.status?.state === 'open'
    );
    return { available: available.length, total: liveHouseholds.length };
  }, [liveHouseholds]);

  // Only show Venn diagram if we have circles (demo or real)
  const hasDemoCircles = demoMode && circles.some(c =>
    ['rock-academy', 'woodstock-elementary', 'nyc-friends'].includes(c.id)
  );
  const hasUserCircles = !demoMode && circles.length > 0;

  // Venn view works with both demo circles and real user circles
  const isVennView = viewMode === 'venn' && (hasDemoCircles || hasUserCircles);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header - animates from top */}
      <motion.div
        className="flex-shrink-0"
        initial={{ opacity: 0, y: -30 }}
        animate={{
          opacity: introRevealed ? 1 : 0,
          y: introRevealed ? 0 : -30,
          marginBottom: 16
        }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <HeaderLockup
          household={myHousehold}
          status={myStatus}
          onStatusChange={setMyStatus}
          onOpenSettings={onOpenSettings}
        />
      </motion.div>

      {/* Info Bar - fades in, only show when there are friends */}
      {liveHouseholds.length > 0 && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: introRevealed ? 1 : 0 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
        className="flex-shrink-0 flex items-center justify-between px-4 mb-3"
      >
        {/* Weather + Cycling Suggestion */}
        <div className="flex items-center gap-2">
          <div className="text-sm" style={{ color: theme.textSecondary }}>
            <span className="font-medium">{temperature}°</span>
            <div className="text-xs capitalize">{weather}</div>
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
      )}

      {/* Circle Legend - shows user circles when not in demo mode and not in venn view */}
      {!demoMode && circles.length > 0 && liveHouseholds.length > 0 && !isVennView && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: introRevealed ? 1 : 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.25 }}
          className="flex-shrink-0 flex flex-wrap items-center gap-2 px-4 mb-2"
        >
          <span className="text-xs font-medium flex-shrink-0" style={{ color: theme.textSecondary }}>
            Circles:
          </span>
          {circles.map(circle => {
            const memberCount = liveHouseholds.filter(h => h.circleIds?.includes(circle.id)).length;
            return (
              <button
                key={circle.id}
                onClick={() => setSelectedCircle(circle.id)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors active:opacity-80"
                style={{ backgroundColor: `${circle.color}20`, color: circle.color }}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: circle.color }} />
                {circle.name}
                <span className="opacity-70">({memberCount})</span>
              </button>
            );
          })}
        </motion.div>
      )}

      {/* Contacts area with circle outlines */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center overflow-visible -mt-4">
        <div className="relative aspect-square max-w-[340px] max-h-[85%] mx-auto" style={{ width: 'min(100% - 32px, 340px)' }}>
          {/* Empty State */}
          {liveHouseholds.length === 0 && introRevealed && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center text-center px-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              {circles.length === 0 ? (
                <>
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${theme.primary}20` }}>
                    <span className="text-4xl">🫧</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: theme.text }}>
                    Set up your circles
                  </h3>
                  <p className="text-sm mb-6" style={{ color: theme.textSecondary }}>
                    Create circles to organize friends by group — neighbors, school parents, sports teams
                  </p>
                  <button
                    onClick={onOpenCircles}
                    className="px-6 py-3 rounded-xl font-medium text-white transition-colors"
                    style={{ backgroundColor: theme.primary }}
                  >
                    Get Started
                  </button>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${theme.primary}20` }}>
                    <span className="text-4xl">+</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: theme.text }}>
                    Add your first friends
                  </h3>
                  <p className="text-sm mb-6" style={{ color: theme.textSecondary }}>
                    Connect with friends and family to see when they're available to hang out
                  </p>
                  <button
                    onClick={onOpenContacts}
                    className="px-6 py-3 rounded-xl font-medium text-white transition-colors"
                    style={{ backgroundColor: theme.primary }}
                  >
                    Add Friends
                  </button>
                </>
              )}
            </motion.div>
          )}

          {/* Venn Diagram - shows circles with contacts positioned inside */}
          {isVennView && introRevealed && liveHouseholds.length > 0 && (
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <VennDiagram
                onSelectHousehold={setSelectedHousehold}
                selectedHousehold={selectedHousehold}
                onSelectCircle={(circle) => setSelectedCircle(circle?.id || null)}
              />
            </motion.div>
          )}

          {/* Contact dots - only show in scattered view (not venn view) */}
          {!isVennView && liveHouseholds.map((household, index) => {
          // Generate symmetrical positions for all contacts
          const symmetricalPos = generateDynamicPosition(index, liveHouseholds.length);

          // For demo mode, use hardcoded positions if available
          // For production, always use symmetrical positions
          let targetPos;
          if (demoMode) {
            const scatteredPos = scatteredPositions[household.id] || symmetricalPos;
            const circlePos = circlePositions[household.id] || symmetricalPos;
            targetPos = isVennView ? circlePos : scatteredPos;
          } else {
            // Production mode: always use elegant symmetrical layout
            targetPos = symmetricalPos;
          }

          const statusState = household.status?.state || 'available';
          const color = statusColors[statusState] || statusColors.available;
          const isSelected = selectedHousehold?.id === household.id;
          const isHovered = hoveredId === household.id;
          const hasNote = !!household.status?.note;
          const isAvailable = statusState !== 'busy';

          // Unique float animation parameters for each contact
          const floatDuration = 4 + (index % 3) * 0.8;
          const floatDelay = index * 0.4;

          // Random intro delay for this contact
          const contactIntroDelay = introDelays[household.id] || 0.3;

          return (
            <motion.div
              key={household.id}
              className="absolute cursor-pointer"
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{
                left: `${targetPos.x}%`,
                top: `${targetPos.y}%`,
                scale: introRevealed ? (isSelected ? 1.15 : isHovered ? 1.08 : 1) : 0.3,
                opacity: introRevealed ? 1 : 0,
              }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 25,
                mass: 1,
                opacity: { duration: 0.5, ease: 'easeOut', delay: contactIntroDelay },
                scale: { duration: 0.5, ease: 'easeOut', delay: contactIntroDelay }
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
                  width: statusState === 'busy' ? 24 : statusState === 'open' ? 36 : 40,
                  height: statusState === 'busy' ? 24 : statusState === 'open' ? 36 : 40,
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

              {/* Circle membership indicators (for user circles) */}
              {!demoMode && household.circleIds?.length > 0 && (
                <div className="absolute left-1/2 -translate-x-1/2 mt-7 flex gap-0.5">
                  {household.circleIds.slice(0, 3).map(circleId => {
                    const circle = circles.find(c => c.id === circleId);
                    if (!circle) return null;
                    return (
                      <div
                        key={circleId}
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: circle.color }}
                        title={circle.name}
                      />
                    );
                  })}
                  {household.circleIds.length > 3 && (
                    <span className="text-[8px] ml-0.5" style={{ color: theme.textSecondary }}>
                      +{household.circleIds.length - 3}
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
        </div>
      </div>

      {/* Local Offers - fades in */}
      <motion.div
        className="flex-shrink-0 overflow-hidden px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: introRevealed ? 1 : 0 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
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
            {/* Expanding Circle Background - zooms from center for user circles, or circle position for demo */}
            <motion.div
              className="absolute rounded-full"
              style={{
                backgroundColor: selectedCircleData.color,
                // For demo circles use their position, for user circles zoom from center
                left: circleLayout[selectedCircle]?.cx ? `${circleLayout[selectedCircle].cx}%` : '50%',
                top: circleLayout[selectedCircle]?.cy ? `${circleLayout[selectedCircle].cy * 0.6 + 15}%` : '40%',
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
                    {selectedCircleMembers.length} households · {selectedCircleMembers.filter(m => (m.status?.state || 'available') !== 'busy').length} available
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
                            style={{ backgroundColor: statusColors[household.status?.state] || statusColors.available }}
                          >
                            {household.members?.[0]?.avatar || '👤'}
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5">
                            <StatusDot status={household.status?.state || 'available'} size="sm" />
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-[#1F2937]">
                            {household.householdName}
                          </p>
                          <p className="text-sm text-[#6B7280]">
                            {(household.members || []).map(m => m.name?.split(' ')[0] || 'Unknown').join(', ')}
                          </p>
                          {household.status?.note && (
                            <p className="text-xs mt-1 px-2 py-0.5 bg-gray-100 rounded-full inline-block text-[#6B7280]">
                              "{household.status.note}"
                            </p>
                          )}
                        </div>
                      </div>
                      {(household.status?.state || 'available') !== 'busy' && (
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
                    onCreateHangout(selectedCircleMembers.filter(m => (m.status?.state || 'available') !== 'busy').map(m => m.id));
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
