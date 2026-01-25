import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusDot } from '../ui/StatusDot';
import { useData } from '../../context/DataContext';

// Calculate which zone a household belongs to based on their circles
const getZoneKey = (circleIds) => {
  const sorted = [...circleIds].sort();
  return sorted.join('+');
};

export function VennDiagram({ onSelectHousehold, selectedHousehold, onSelectCircle }) {
  const { circles, friendHouseholds } = useData();
  const [hoveredHousehold, setHoveredHousehold] = useState(null);
  const [hoveredCircle, setHoveredCircle] = useState(null);
  const [selectedCircle, setSelectedCircle] = useState(null);

  // Debug logging
  console.log('[VennDiagram] circles:', circles?.length, circles?.map(c => ({ id: c.id, name: c.name })));
  console.log('[VennDiagram] friendHouseholds:', friendHouseholds?.length, friendHouseholds?.map(h => ({ id: h.id, name: h.householdName, circleIds: h.circleIds })));

  // Handle circle click - toggle selection
  const handleCircleClick = (circleId) => {
    const newSelected = selectedCircle === circleId ? null : circleId;
    setSelectedCircle(newSelected);
    if (onSelectCircle) {
      onSelectCircle(newSelected ? circles.find(c => c.id === newSelected) : null);
    }
  };

  // Calculate circle sizes based on member count
  const circleSizes = useMemo(() => {
    const counts = {};
    circles.forEach(c => {
      counts[c.id] = friendHouseholds.filter(h => h.circleIds?.includes(c.id)).length;
    });
    const maxCount = Math.max(...Object.values(counts), 1); // Min 1 to avoid division by zero
    const minSize = 32;
    const maxSize = 40;

    const sizes = {};
    circles.forEach(c => {
      const ratio = counts[c.id] / maxCount;
      sizes[c.id] = minSize + (maxSize - minSize) * ratio;
    });
    return sizes;
  }, [circles, friendHouseholds]);

  // Dynamic circle positions based on number of circles and sizes
  const circleLayout = useMemo(() => {
    const layout = {};
    const count = circles.length;

    if (count === 0) return layout;

    // Predefined positions for common circle counts (Venn diagram style)
    const positions = {
      1: [{ cx: 50, cy: 50, labelX: 50, labelY: 15 }],
      2: [
        { cx: 35, cy: 50, labelX: 10, labelY: 50 },
        { cx: 65, cy: 50, labelX: 90, labelY: 50 }
      ],
      3: [
        { cx: 32, cy: 38, labelX: 8, labelY: 8 },
        { cx: 68, cy: 38, labelX: 92, labelY: 8 },
        { cx: 50, cy: 70, labelX: 50, labelY: 98 }
      ],
      4: [
        { cx: 30, cy: 30, labelX: 5, labelY: 5 },
        { cx: 70, cy: 30, labelX: 95, labelY: 5 },
        { cx: 30, cy: 70, labelX: 5, labelY: 95 },
        { cx: 70, cy: 70, labelX: 95, labelY: 95 }
      ]
    };

    // Use predefined positions if available, otherwise distribute in a circle
    const positionSet = positions[count] || circles.map((_, i) => {
      const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
      const radius = 25;
      return {
        cx: 50 + radius * Math.cos(angle),
        cy: 50 + radius * Math.sin(angle),
        labelX: 50 + (radius + 15) * Math.cos(angle),
        labelY: 50 + (radius + 15) * Math.sin(angle)
      };
    });

    circles.forEach((circle, i) => {
      const pos = positionSet[i] || { cx: 50, cy: 50, labelX: 50, labelY: 50 };
      layout[circle.id] = {
        cx: pos.cx,
        cy: pos.cy,
        r: circleSizes[circle.id] || 35,
        labelX: pos.labelX,
        labelY: pos.labelY
      };
    });

    return layout;
  }, [circles, circleSizes]);

  // Group households by their zone
  const householdsByZone = useMemo(() => {
    const zones = {};
    friendHouseholds.forEach(household => {
      const zoneKey = getZoneKey(household.circleIds || []);
      if (!zones[zoneKey]) zones[zoneKey] = [];
      zones[zoneKey].push(household);
    });
    return zones;
  }, [friendHouseholds]);

  // Dynamically build zone layouts based on actual circles
  const zoneLayouts = useMemo(() => {
    const layouts = {};
    const count = circles.length;

    if (count === 0) return layouts;

    // For each circle, place households on the outer edge opposite to center
    circles.forEach((circle, i) => {
      const pos = circleLayout[circle.id];
      if (!pos) return;

      // Calculate outer edge position (away from center at 50,50)
      const dx = pos.cx - 50;
      const dy = pos.cy - 50;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const outerX = pos.cx + (dx / dist) * 20;
      const outerY = pos.cy + (dy / dist) * 20;

      layouts[circle.id] = {
        base: { x: Math.max(8, Math.min(92, outerX)), y: Math.max(8, Math.min(92, outerY)) },
        direction: Math.abs(dx) > Math.abs(dy) ? 'vertical' : 'horizontal',
        spacing: 11
      };
    });

    // For multi-circle intersections, place at the average position
    // Generate all possible combinations dynamically
    const circleIds = circles.map(c => c.id);

    // 2-circle intersections
    for (let i = 0; i < circleIds.length; i++) {
      for (let j = i + 1; j < circleIds.length; j++) {
        const key = [circleIds[i], circleIds[j]].sort().join('+');
        const pos1 = circleLayout[circleIds[i]];
        const pos2 = circleLayout[circleIds[j]];
        if (pos1 && pos2) {
          layouts[key] = {
            base: { x: (pos1.cx + pos2.cx) / 2, y: (pos1.cy + pos2.cy) / 2 },
            direction: 'horizontal',
            spacing: 12
          };
        }
      }
    }

    // 3+ circle intersections (center)
    if (circleIds.length >= 3) {
      const allKey = [...circleIds].sort().join('+');
      layouts[allKey] = {
        base: { x: 50, y: 50 },
        direction: 'center',
        spacing: 0
      };
    }

    // Uncircled contacts - position them around the bottom edge
    layouts[''] = {
      base: { x: 50, y: 95 },
      direction: 'horizontal',
      spacing: 12
    };

    return layouts;
  }, [circles, circleLayout]);

  // Smart positioning based on zone type and count
  const getHouseholdPosition = (household, zoneKey, indexInZone, totalInZone) => {
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
        h.circleIds?.includes(circle.id) && h.status?.state !== 'busy'
      ).length;
      return { ...circle, memberCount, availableCount };
    });
  }, [circles, friendHouseholds]);

  return (
    <div className="relative w-full aspect-square max-w-[340px] mx-auto">
      {/* SVG for circles and curved labels */}
      <svg
        viewBox="-10 -10 120 120"
        className="absolute inset-0 w-full h-full"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Define curved paths for text to follow - dynamic positioning */}
          {circleLabelInfo.map((circle, index) => {
            const layout = circleLayout[circle.id];
            if (!layout) return null;

            const labelRadius = (layout.r || 35) + 5;
            const cx = layout.cx || 50;
            const cy = layout.cy || 50;

            // Determine arc direction based on position relative to center
            const isTop = cy < 50;
            const isLeft = cx < 50;
            const isBottom = cy > 55;

            if (isTop && isLeft) {
              // Top-left arc
              return (
                <path
                  key={`path-${circle.id}`}
                  id={`textPath-${circle.id}`}
                  d={`M ${cx - labelRadius} ${cy - labelRadius * 0.2} A ${labelRadius} ${labelRadius} 0 0 1 ${cx - labelRadius * 0.2} ${cy - labelRadius}`}
                  fill="none"
                />
              );
            } else if (isTop && !isLeft) {
              // Top-right arc
              return (
                <path
                  key={`path-${circle.id}`}
                  id={`textPath-${circle.id}`}
                  d={`M ${cx + labelRadius * 0.2} ${cy - labelRadius} A ${labelRadius} ${labelRadius} 0 0 1 ${cx + labelRadius} ${cy - labelRadius * 0.2}`}
                  fill="none"
                />
              );
            } else {
              // Bottom arc (default)
              return (
                <path
                  key={`path-${circle.id}`}
                  id={`textPath-${circle.id}`}
                  d={`M ${cx - labelRadius * 0.85} ${cy + labelRadius * 0.6} A ${labelRadius} ${labelRadius} 0 0 0 ${cx + labelRadius * 0.85} ${cy + labelRadius * 0.6}`}
                  fill="none"
                />
              );
            }
          })}
        </defs>

        {/* Draw circles with thin strokes and transparency */}
        {circles.map((circle, index) => {
          const layout = circleLayout[circle.id];
          if (!layout) return null;

          const isHighlighted = highlightedCircles.includes(circle.id);
          const isSelected = selectedCircle === circle.id;
          const isHovered = hoveredCircle === circle.id;

          return (
            <motion.circle
              key={circle.id}
              cx={layout.cx || 50}
              cy={layout.cy || 50}
              initial={{ r: layout.r || 35 }}
              animate={{
                r: isSelected ? (layout.r || 35) * 1.15 : (layout.r || 35),
                y: [0, -1, 0, 1, 0],
                x: [0, 0.3, 0, -0.3, 0]
              }}
              fill={hexToRgba(circle.color, isSelected ? 0.4 : isHighlighted ? 0.3 : 0.2)}
              stroke={circle.color}
              strokeWidth={isSelected ? 1.2 : isHighlighted ? 0.8 : 0.5}
              strokeOpacity={isSelected ? 0.9 : isHighlighted ? 0.6 : 0.35}
              transition={{
                r: { duration: 0.3, ease: "easeOut" },
                y: { duration: 5 + index, repeat: Infinity, ease: "easeInOut" },
                x: { duration: 6 + index, repeat: Infinity, ease: "easeInOut" }
              }}
              onMouseEnter={() => setHoveredCircle(circle.id)}
              onMouseLeave={() => setHoveredCircle(null)}
              onClick={() => handleCircleClick(circle.id)}
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

      {/* Circle hover tooltip - only show when not selected */}
      <AnimatePresence>
        {hoveredCircle && !hoveredHousehold && !selectedCircle && (
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

      {/* Selected circle panel */}
      <AnimatePresence>
        {selectedCircle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-t-2xl shadow-lg border-t border-gray-100 z-50"
          >
            {(() => {
              const circle = circles.find(c => c.id === selectedCircle);
              const members = friendHouseholds.filter(h => h.circleIds?.includes(selectedCircle));
              const available = members.filter(m => m.status.state !== 'busy');
              return (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: circle?.color }}
                      />
                      <h3 className="font-semibold text-[#1F2937]">{circle?.name}</h3>
                      <span className="text-xs text-[#6B7280]">({members.length} members)</span>
                    </div>
                    <button
                      onClick={() => handleCircleClick(selectedCircle)}
                      className="text-xs text-[#6B7280] hover:text-[#1F2937]"
                    >
                      Close
                    </button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {members.map(member => (
                      <button
                        key={member.id}
                        onClick={() => onSelectHousehold(member)}
                        className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-gray-50 transition-colors flex-shrink-0"
                      >
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                            {member.members?.[0]?.avatar || '👤'}
                          </div>
                          <StatusDot status={member.status?.state} size="sm" className="absolute -bottom-0.5 -right-0.5" />
                        </div>
                        <span className="text-xs text-[#1F2937] font-medium max-w-[60px] truncate">
                          {member.householdName?.replace(/^The\s+/i, '').split(' ')[0]}
                        </span>
                      </button>
                    ))}
                    {members.length === 0 && (
                      <p className="text-sm text-[#6B7280] py-2">No members in this circle yet</p>
                    )}
                  </div>
                  {available.length > 0 && (
                    <p className="text-xs text-green-600 mt-2">
                      {available.length} available to hang out
                    </p>
                  )}
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
