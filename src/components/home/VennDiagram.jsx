import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusDot } from '../ui/StatusDot';
import { circles, friendHouseholds } from '../../data/seedData';

// Calculate which zone a household belongs to based on their circles
const getZoneKey = (circleIds) => {
  const sorted = [...circleIds].sort();
  return sorted.join('+');
};

export function VennDiagram({ onSelectHousehold, selectedHousehold }) {
  const [hoveredHousehold, setHoveredHousehold] = useState(null);
  const [hoveredCircle, setHoveredCircle] = useState(null);

  // Calculate circle sizes based on member count
  const circleSizes = useMemo(() => {
    const counts = {};
    circles.forEach(c => {
      counts[c.id] = friendHouseholds.filter(h => h.circleIds?.includes(c.id)).length;
    });
    const maxCount = Math.max(...Object.values(counts));
    const minSize = 32;
    const maxSize = 40;

    const sizes = {};
    circles.forEach(c => {
      const ratio = counts[c.id] / maxCount;
      sizes[c.id] = minSize + (maxSize - minSize) * ratio;
    });
    return sizes;
  }, []);

  // Dynamic circle positions based on sizes - adjusted for larger circles
  const circleLayout = useMemo(() => {
    return {
      'rock-academy': {
        cx: 32,
        cy: 38,
        r: circleSizes['rock-academy'],
        labelX: 8,
        labelY: 8
      },
      'woodstock-elementary': {
        cx: 68,
        cy: 38,
        r: circleSizes['woodstock-elementary'],
        labelX: 92,
        labelY: 8
      },
      'nyc-friends': {
        cx: 50,
        cy: 70,
        r: circleSizes['nyc-friends'],
        labelX: 50,
        labelY: 98
      }
    };
  }, [circleSizes]);

  // Group households by their zone
  const householdsByZone = useMemo(() => {
    const zones = {};
    friendHouseholds.forEach(household => {
      const zoneKey = getZoneKey(household.circleIds || []);
      if (!zones[zoneKey]) zones[zoneKey] = [];
      zones[zoneKey].push(household);
    });
    return zones;
  }, []);

  // Smart positioning based on zone type and count
  const getHouseholdPosition = (household, zoneKey, indexInZone, totalInZone) => {
    // Define zone-specific layouts - adjusted for larger circles
    const zoneLayouts = {
      // Single circles - spread along the outer edge
      'rock-academy': {
        base: { x: 12, y: 38 },
        direction: 'vertical',
        spacing: 11
      },
      'woodstock-elementary': {
        base: { x: 88, y: 38 },
        direction: 'vertical',
        spacing: 11
      },
      'nyc-friends': {
        base: { x: 50, y: 90 },
        direction: 'horizontal',
        spacing: 14
      },

      // Two-circle intersections - spread along the intersection
      'rock-academy+woodstock-elementary': {
        base: { x: 50, y: 24 },
        direction: 'horizontal',
        spacing: 12
      },
      'nyc-friends+rock-academy': {
        base: { x: 28, y: 62 },
        direction: 'diagonal-left',
        spacing: 10
      },
      'nyc-friends+woodstock-elementary': {
        base: { x: 72, y: 62 },
        direction: 'diagonal-right',
        spacing: 10
      },

      // All three (center) - just center it
      'nyc-friends+rock-academy+woodstock-elementary': {
        base: { x: 50, y: 50 },
        direction: 'center',
        spacing: 0
      }
    };

    const layout = zoneLayouts[zoneKey] || { base: { x: 50, y: 50 }, direction: 'center', spacing: 0 };
    const { base, direction, spacing } = layout;

    if (totalInZone === 1 || direction === 'center') {
      return base;
    }

    // Calculate offset from center of the group
    const offset = indexInZone - (totalInZone - 1) / 2;

    switch (direction) {
      case 'horizontal':
        return { x: base.x + offset * spacing, y: base.y };
      case 'vertical':
        return { x: base.x, y: base.y + offset * spacing };
      case 'diagonal-left':
        return { x: base.x + offset * spacing * 0.7, y: base.y + offset * spacing * 0.7 };
      case 'diagonal-right':
        return { x: base.x - offset * spacing * 0.7, y: base.y + offset * spacing * 0.7 };
      default:
        return base;
    }
  };

  const highlightedCircles = hoveredHousehold
    ? friendHouseholds.find(h => h.id === hoveredHousehold)?.circleIds || []
    : hoveredCircle ? [hoveredCircle] : [];

  // Convert hex to rgba
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Get label info for each circle
  const circleLabelInfo = useMemo(() => {
    return circles.map(circle => {
      const memberCount = friendHouseholds.filter(h => h.circleIds?.includes(circle.id)).length;
      const availableCount = friendHouseholds.filter(h =>
        h.circleIds?.includes(circle.id) && h.status.state !== 'busy'
      ).length;
      return { ...circle, memberCount, availableCount };
    });
  }, []);

  return (
    <div className="relative w-full aspect-square max-w-[340px] mx-auto">
      {/* SVG for circles and curved labels */}
      <svg
        viewBox="-10 -10 120 120"
        className="absolute inset-0 w-full h-full"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Define curved paths for text to follow - longer arcs for full text */}
          {circleLabelInfo.map(circle => {
            const layout = circleLayout[circle.id];
            const labelRadius = layout.r + 5; // Slightly outside the circle

            // Different arc positions for each circle - extended arcs
            if (circle.id === 'rock-academy') {
              // Top-left arc - wider curve for full text
              return (
                <path
                  key={`path-${circle.id}`}
                  id={`textPath-${circle.id}`}
                  d={`M ${layout.cx - labelRadius} ${layout.cy - labelRadius * 0.2} A ${labelRadius} ${labelRadius} 0 0 1 ${layout.cx - labelRadius * 0.2} ${layout.cy - labelRadius}`}
                  fill="none"
                />
              );
            } else if (circle.id === 'woodstock-elementary') {
              // Top-right arc - wider curve for full text
              return (
                <path
                  key={`path-${circle.id}`}
                  id={`textPath-${circle.id}`}
                  d={`M ${layout.cx + labelRadius * 0.2} ${layout.cy - labelRadius} A ${labelRadius} ${labelRadius} 0 0 1 ${layout.cx + labelRadius} ${layout.cy - labelRadius * 0.2}`}
                  fill="none"
                />
              );
            } else {
              // Bottom arc for NYC Friends - wider curve
              return (
                <path
                  key={`path-${circle.id}`}
                  id={`textPath-${circle.id}`}
                  d={`M ${layout.cx - labelRadius * 0.85} ${layout.cy + labelRadius * 0.6} A ${labelRadius} ${labelRadius} 0 0 0 ${layout.cx + labelRadius * 0.85} ${layout.cy + labelRadius * 0.6}`}
                  fill="none"
                />
              );
            }
          })}
        </defs>

        {/* Draw circles with thin strokes and transparency */}
        {circles.map((circle, index) => {
          const layout = circleLayout[circle.id];
          const isHighlighted = highlightedCircles.includes(circle.id);

          return (
            <motion.circle
              key={circle.id}
              cx={layout.cx}
              cy={layout.cy}
              r={layout.r}
              fill={hexToRgba(circle.color, isHighlighted ? 0.3 : 0.2)}
              stroke={circle.color}
              strokeWidth={isHighlighted ? 0.8 : 0.5}
              strokeOpacity={isHighlighted ? 0.6 : 0.35}
              animate={{
                y: [0, -1, 0, 1, 0],
                x: [0, 0.3, 0, -0.3, 0]
              }}
              transition={{
                y: { duration: 5 + index, repeat: Infinity, ease: "easeInOut" },
                x: { duration: 6 + index, repeat: Infinity, ease: "easeInOut" }
              }}
              onMouseEnter={() => setHoveredCircle(circle.id)}
              onMouseLeave={() => setHoveredCircle(null)}
              style={{ cursor: 'pointer' }}
            />
          );
        })}

        {/* Curved text labels */}
        {circleLabelInfo.map(circle => {
          const isHighlighted = highlightedCircles.includes(circle.id);

          return (
            <text
              key={`label-${circle.id}`}
              fill={circle.color}
              fontSize="3.5"
              fontWeight="600"
              opacity={isHighlighted ? 1 : 0.7}
            >
              <textPath
                href={`#textPath-${circle.id}`}
                startOffset="50%"
                textAnchor="middle"
              >
                {circle.name}
              </textPath>
            </text>
          );
        })}
      </svg>

      {/* Household avatars positioned in zones */}
      <div className="absolute inset-0 z-10">
        {Object.entries(householdsByZone).map(([zoneKey, households]) =>
          households.map((household, idx) => {
            const pos = getHouseholdPosition(household, zoneKey, idx, households.length);
            const isAvailable = household.status.state !== 'busy';
            const isHovered = hoveredHousehold === household.id;
            const isSelected = selectedHousehold?.id === household.id;
            const isInHighlightedCircle = highlightedCircles.some(c =>
              household.circleIds?.includes(c)
            );
            const hasNote = !!household.status.note;
            // Get the color from the household's first circle
            const pulseColor = household.circleIds?.length > 0
              ? circles.find(c => c.id === household.circleIds[0])?.color || '#9CAF88'
              : '#9CAF88';

            return (
              <div
                key={household.id}
                className="absolute"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: isHovered || isSelected ? 30 : 10
                }}
              >
                {/* Pulse rings for households with notes */}
                {hasNote && isAvailable && (
                  <>
                    <motion.div
                      className="absolute inset-0 rounded-full border"
                      style={{ margin: '-4px', borderColor: pulseColor }}
                      animate={{
                        scale: [1, 1.6, 2],
                        opacity: [0, 0.4, 0]
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: 'linear',
                        times: [0, 0.25, 1]
                      }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full border"
                      style={{ margin: '-4px', borderColor: pulseColor }}
                      animate={{
                        scale: [1, 1.6, 2],
                        opacity: [0, 0.4, 0]
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: 'linear',
                        times: [0, 0.25, 1],
                        delay: 1.25
                      }}
                    />
                  </>
                )}

                <motion.button
                  onClick={() => isAvailable && onSelectHousehold(household)}
                  onMouseEnter={() => setHoveredHousehold(household.id)}
                  onMouseLeave={() => setHoveredHousehold(null)}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: 1,
                    scale: isHovered || isSelected ? 1.3 : 1
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className={`relative w-9 h-9 rounded-full flex items-center justify-center text-sm shadow-md border-2 transition-all ${
                    isAvailable
                      ? isSelected
                        ? 'bg-[#9CAF88] border-white cursor-pointer'
                        : isHovered
                        ? 'bg-white border-[#9CAF88] cursor-pointer shadow-lg'
                        : 'bg-white border-white cursor-pointer hover:shadow-lg'
                      : 'bg-gray-100 border-gray-200 opacity-40 cursor-not-allowed'
                  }`}
                  style={{
                    boxShadow: isInHighlightedCircle && !isHovered && !isSelected
                      ? '0 0 0 2px rgba(156, 175, 136, 0.5)'
                      : undefined
                  }}
                >
                  {household.members[0]?.avatar || '👥'}
                  <span className="absolute -bottom-0.5 -right-0.5">
                    <StatusDot status={household.status.state} size="sm" />
                  </span>

                  {/* Multi-circle indicator */}
                  {household.circleIds?.length > 1 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#8B5CF6] text-white text-[8px] font-bold rounded-full flex items-center justify-center shadow-sm">
                      {household.circleIds.length}
                    </span>
                  )}
                </motion.button>
              </div>
            );
          })
        )}
      </div>

      {/* Hover tooltip */}
      <AnimatePresence>
        {hoveredHousehold && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 bg-white px-3 py-2 rounded-xl shadow-lg border border-gray-100 z-40 min-w-[140px]"
          >
            {(() => {
              const h = friendHouseholds.find(h => h.id === hoveredHousehold);
              if (!h) return null;
              const hCircles = circles.filter(c => h.circleIds?.includes(c.id));
              return (
                <>
                  <p className="text-sm font-medium text-[#1F2937]">{h.householdName}</p>
                  {h.status.note && (
                    <p className="text-xs text-[#6B7280] mt-0.5 italic">"{h.status.note}"</p>
                  )}
                  {hCircles.length > 1 && (
                    <div className="flex gap-1.5 mt-1.5">
                      {hCircles.map(c => (
                        <span
                          key={c.id}
                          className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: hexToRgba(c.color, 0.2),
                            color: c.color
                          }}
                        >
                          {c.name.split(' ')[0]}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Circle hover tooltip */}
      <AnimatePresence>
        {hoveredCircle && !hoveredHousehold && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 bg-white px-3 py-2 rounded-xl shadow-lg border border-gray-100 z-40"
          >
            {(() => {
              const circle = circles.find(c => c.id === hoveredCircle);
              const members = friendHouseholds.filter(h => h.circleIds?.includes(hoveredCircle));
              const available = members.filter(m => m.status.state !== 'busy').length;
              return (
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: circle?.color }}
                  />
                  <div>
                    <p className="text-sm font-medium text-[#1F2937]">{circle?.name}</p>
                    <p className="text-xs text-[#6B7280]">{available} of {members.length} available</p>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
