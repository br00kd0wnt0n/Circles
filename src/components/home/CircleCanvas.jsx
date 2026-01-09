import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusDot } from '../ui/StatusDot';
import { circles, friendHouseholds } from '../../data/seedData';

export function CircleCanvas({ onSelectHousehold, onSelectCircle, selectedCircle }) {
  const [hoveredHousehold, setHoveredHousehold] = useState(null);

  // Position circles in a triangular arrangement around center
  const circlePositions = useMemo(() => {
    const positions = [
      { x: 50, y: 25 },   // top center
      { x: 20, y: 70 },   // bottom left
      { x: 80, y: 70 },   // bottom right
    ];
    return circles.map((circle, i) => ({
      ...circle,
      position: positions[i % positions.length]
    }));
  }, []);

  // Get households for a circle with positions around the circle
  const getHouseholdsInCircle = (circleId, cx, cy) => {
    const members = friendHouseholds.filter(h => h.circleIds?.includes(circleId));
    const angleStep = (2 * Math.PI) / Math.max(members.length, 1);
    const radius = 12; // percentage units

    return members.map((household, i) => {
      const angle = angleStep * i - Math.PI / 2; // Start from top
      return {
        ...household,
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle)
      };
    });
  };

  return (
    <div className="relative w-full aspect-square max-w-[380px] mx-auto">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#E8F0E3]/50 to-transparent rounded-full" />

      {/* Circle groups */}
      {circlePositions.map((circle) => {
        const households = getHouseholdsInCircle(circle.id, circle.position.x, circle.position.y);
        const isSelected = selectedCircle === circle.id;
        const availableCount = households.filter(h => h.status.state !== 'busy').length;

        return (
          <motion.div
            key={circle.id}
            className="absolute"
            style={{
              left: `${circle.position.x}%`,
              top: `${circle.position.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            {/* Circle background */}
            <motion.button
              onClick={() => onSelectCircle(isSelected ? null : circle.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              animate={{
                scale: isSelected ? 1.1 : 1,
                boxShadow: isSelected
                  ? `0 0 0 3px ${circle.color}, 0 8px 32px ${circle.color}40`
                  : `0 4px 16px ${circle.color}30`
              }}
              className="relative w-32 h-32 rounded-full flex items-center justify-center cursor-pointer transition-all"
              style={{
                backgroundColor: `${circle.color}15`,
                border: `2px solid ${circle.color}40`
              }}
            >
              {/* Circle label */}
              <div className="text-center z-10">
                <p className="text-xs font-semibold text-[#1F2937] leading-tight px-2">
                  {circle.name}
                </p>
                <p className="text-[10px] text-[#6B7280] mt-0.5">
                  {availableCount}/{households.length} free
                </p>
              </div>
            </motion.button>

            {/* Household avatars around the circle */}
            <AnimatePresence>
              {households.map((household, idx) => {
                const angle = ((2 * Math.PI) / households.length) * idx - Math.PI / 2;
                const radius = 72; // pixels from center
                const x = radius * Math.cos(angle);
                const y = radius * Math.sin(angle);
                const isAvailable = household.status.state !== 'busy';

                return (
                  <motion.button
                    key={household.id}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: 1,
                      scale: hoveredHousehold === household.id ? 1.2 : 1,
                      x,
                      y
                    }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ delay: idx * 0.05, type: 'spring', stiffness: 300 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isAvailable) onSelectHousehold(household);
                    }}
                    onMouseEnter={() => setHoveredHousehold(household.id)}
                    onMouseLeave={() => setHoveredHousehold(null)}
                    className={`absolute left-1/2 top-1/2 -ml-5 -mt-5 w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-md border-2 border-white transition-all ${
                      isAvailable
                        ? 'bg-white cursor-pointer hover:shadow-lg'
                        : 'bg-gray-100 opacity-50 cursor-not-allowed'
                    }`}
                    style={{
                      zIndex: hoveredHousehold === household.id ? 20 : 10
                    }}
                  >
                    {household.members[0]?.avatar || '👥'}
                    <span className="absolute -bottom-0.5 -right-0.5">
                      <StatusDot status={household.status.state} size="sm" />
                    </span>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* Hover tooltip */}
      <AnimatePresence>
        {hoveredHousehold && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white px-3 py-2 rounded-xl shadow-lg border border-gray-100 z-30"
          >
            <p className="text-sm font-medium text-[#1F2937] whitespace-nowrap">
              {friendHouseholds.find(h => h.id === hoveredHousehold)?.householdName}
            </p>
            {friendHouseholds.find(h => h.id === hoveredHousehold)?.status.note && (
              <p className="text-xs text-[#6B7280]">
                {friendHouseholds.find(h => h.id === hoveredHousehold)?.status.note}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
