import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusDot } from '../ui/StatusDot';
import { useData } from '../../context/DataContext';
import {
  getCircleLayout,
  getContactPosition,
  getZoneKey,
  resolveOverlaps,
  getLabelPath,
  getBestLabelPosition
} from '../../utils/vennLayout';

/**
 * Scalable Venn Diagram that handles 1-10 circles algorithmically
 */
export function VennDiagramScaled({ onSelectHousehold, selectedHousehold }) {
  const { circles, friendHouseholds } = useData();
  const [hoveredHousehold, setHoveredHousehold] = useState(null);
  const [hoveredCircle, setHoveredCircle] = useState(null);

  // Get layout for current circle count
  const circleLayout = useMemo(() => {
    return getCircleLayout(circles.length);
  }, [circles.length]);

  // Combine layout with circle data
  const circlePositions = useMemo(() => {
    return circles.map((circle, index) => ({
      ...circle,
      ...circleLayout[index]
    }));
  }, [circles, circleLayout]);

  // Group households by zone and calculate positions
  const householdPositions = useMemo(() => {
    // Group by zone
    const zones = {};
    friendHouseholds.forEach(household => {
      const zoneKey = getZoneKey(household.circleIds || []);
      if (!zones[zoneKey]) zones[zoneKey] = [];
      zones[zoneKey].push(household);
    });

    // Calculate positions for each household
    const positions = [];
    Object.entries(zones).forEach(([zoneKey, households]) => {
      households.forEach((household, index) => {
        const pos = getContactPosition(
          household,
          circles,
          circleLayout,
          index,
          households.length
        );
        positions.push({
          household,
          ...pos,
          zoneKey
        });
      });
    });

    // Resolve overlaps
    const resolvedPositions = resolveOverlaps(positions, 10);
    return resolvedPositions.map((pos, i) => ({
      ...positions[i],
      x: pos.x,
      y: pos.y
    }));
  }, [friendHouseholds, circles, circleLayout]);

  // Highlighted circles (from hover)
  const highlightedCircles = useMemo(() => {
    if (hoveredHousehold) {
      const household = friendHouseholds.find(h => h.id === hoveredHousehold);
      return household?.circleIds || [];
    }
    if (hoveredCircle) {
      return [hoveredCircle];
    }
    return [];
  }, [hoveredHousehold, hoveredCircle, friendHouseholds]);

  // Helper: hex to rgba
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // If too many circles, suggest alternative view
  if (circles.length > 7) {
    return (
      <div className="relative w-full aspect-square max-w-[340px] mx-auto flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-2">You have {circles.length} circles</p>
          <p className="text-sm text-gray-400">Switch to list view for better visibility</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-square max-w-[340px] mx-auto">
      {/* SVG for circles */}
      <svg
        viewBox="-10 -10 120 120"
        className="absolute inset-0 w-full h-full"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Curved paths for labels */}
          {circlePositions.map(circle => {
            const labelPos = getBestLabelPosition(circle, circlePositions);
            const pathD = getLabelPath(circle, labelPos);
            return (
              <path
                key={`path-${circle.id}`}
                id={`textPath-${circle.id}`}
                d={pathD}
                fill="none"
              />
            );
          })}
        </defs>

        {/* Draw circles */}
        {circlePositions.map((circle, index) => {
          const isHighlighted = highlightedCircles.includes(circle.id);

          return (
            <motion.circle
              key={circle.id}
              cx={circle.x}
              cy={circle.y}
              r={circle.r}
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

        {/* Circle labels */}
        {circlePositions.map(circle => {
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

      {/* Household avatars */}
      <div className="absolute inset-0 z-10">
        {householdPositions.map(({ household, x, y, zoneKey }) => {
          const isAvailable = household.status?.state !== 'busy';
          const isHovered = hoveredHousehold === household.id;
          const isSelected = selectedHousehold?.id === household.id;
          const isInHighlightedCircle = highlightedCircles.some(c =>
            household.circleIds?.includes(c)
          );
          const hasNote = !!household.status?.note;
          const pulseColor = household.circleIds?.length > 0
            ? circles.find(c => c.id === household.circleIds[0])?.color || '#9CAF88'
            : '#9CAF88';

          return (
            <div
              key={household.id}
              className="absolute"
              style={{
                left: `${x}%`,
                top: `${y}%`,
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
                {household.members?.[0]?.avatar || '👥'}
                <span className="absolute -bottom-0.5 -right-0.5">
                  <StatusDot status={household.status?.state} size="sm" />
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
        })}
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
                  {h.status?.note && (
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
              const available = members.filter(m => m.status?.state !== 'busy').length;
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

export default VennDiagramScaled;
