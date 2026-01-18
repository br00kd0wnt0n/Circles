import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { friendHouseholds } from '../../data/seedData';

// Status colors matching wireframes
const statusColors = {
  available: '#9CAF88', // Sage green
  open: '#F4D03F',      // Soft yellow/amber
  busy: '#F4A69A'       // Soft coral/pink
};

// Generate consistent scattered positions - well-spaced grid with slight randomization
const generatePositions = (count) => {
  // Positions designed for 9 contacts in a 3x3-ish organic layout
  // Each position is carefully spaced to avoid overlap (min ~20% apart)
  const positions = [
    { x: 18, y: 15 },   // Top left
    { x: 50, y: 10 },   // Top center
    { x: 82, y: 18 },   // Top right
    { x: 12, y: 45 },   // Middle left
    { x: 45, y: 40 },   // Center
    { x: 78, y: 48 },   // Middle right
    { x: 22, y: 75 },   // Bottom left
    { x: 55, y: 72 },   // Bottom center
    { x: 85, y: 78 },   // Bottom right
  ];

  return positions.slice(0, count);
};

// Get short display name (remove "The " prefix and trailing "s")
const getShortName = (householdName) => {
  if (!householdName) return '';
  return householdName
    .replace(/^The\s+/i, '')
    .replace(/s$/i, '');
};

export function ScatteredContacts({ onSelectHousehold, selectedHousehold }) {
  const [hoveredId, setHoveredId] = useState(null);

  const positions = useMemo(() => generatePositions(friendHouseholds.length), []);

  return (
    <div className="relative w-full h-[320px] rounded-2xl overflow-visible px-2 py-4">
      {friendHouseholds.map((household, index) => {
        const pos = positions[index] || { x: 50, y: 50 };
        const color = statusColors[household.status.state] || statusColors.busy;
        const isSelected = selectedHousehold?.id === household.id;
        const isHovered = hoveredId === household.id;
        const hasNote = !!household.status.note;
        const isAvailable = household.status.state !== 'busy';

        return (
          <motion.div
            key={household.id}
            className="absolute cursor-pointer"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: 1,
              scale: isSelected ? 1.15 : isHovered ? 1.08 : 1
            }}
            transition={{
              delay: index * 0.06,
              type: 'spring',
              stiffness: 300,
              damping: 20
            }}
            onClick={() => onSelectHousehold(household)}
            onMouseEnter={() => setHoveredId(household.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Broadcast Pulse Rings - for contacts with notes */}
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.06 + 0.15 }}
            >
              {getShortName(household.householdName)}
            </motion.span>
          </motion.div>
        );
      })}
    </div>
  );
}
