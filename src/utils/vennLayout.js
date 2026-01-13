/**
 * Venn Layout Utility
 * Handles algorithmic positioning of circles and contacts for 1-10 circles
 */

// Layout configurations for different circle counts
const LAYOUTS = {
  1: {
    circles: [{ x: 50, y: 50, r: 40 }],
    zones: {
      single: { x: 50, y: 50 }
    }
  },
  2: {
    circles: [
      { x: 35, y: 50, r: 35 },
      { x: 65, y: 50, r: 35 }
    ],
    overlap: 15 // How much circles overlap
  },
  3: {
    // Current Venn triangle layout
    circles: [
      { x: 32, y: 38, r: 34 },
      { x: 68, y: 38, r: 34 },
      { x: 50, y: 70, r: 34 }
    ]
  },
  4: {
    // Diamond layout with center overlap
    circles: [
      { x: 50, y: 20, r: 28 },
      { x: 25, y: 50, r: 28 },
      { x: 75, y: 50, r: 28 },
      { x: 50, y: 80, r: 28 }
    ]
  },
  5: {
    // Pentagon arrangement
    circles: (() => {
      const result = [];
      const centerX = 50;
      const centerY = 50;
      const radius = 30; // Distance from center
      const circleRadius = 24;
      for (let i = 0; i < 5; i++) {
        const angle = (i * 72 - 90) * (Math.PI / 180);
        result.push({
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
          r: circleRadius
        });
      }
      return result;
    })()
  },
  6: {
    // Hexagonal arrangement
    circles: (() => {
      const result = [];
      const centerX = 50;
      const centerY = 50;
      const radius = 32;
      const circleRadius = 22;
      for (let i = 0; i < 6; i++) {
        const angle = (i * 60 - 90) * (Math.PI / 180);
        result.push({
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
          r: circleRadius
        });
      }
      return result;
    })()
  },
  7: {
    // 6 around 1 center
    circles: (() => {
      const result = [{ x: 50, y: 50, r: 18 }]; // Center circle
      const centerX = 50;
      const centerY = 50;
      const radius = 32;
      const circleRadius = 20;
      for (let i = 0; i < 6; i++) {
        const angle = (i * 60 - 90) * (Math.PI / 180);
        result.push({
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
          r: circleRadius
        });
      }
      return result;
    })()
  }
};

/**
 * Get circle positions based on count
 */
export function getCircleLayout(circleCount) {
  if (circleCount <= 0) return [];
  if (circleCount > 7) {
    // For 8+ circles, use a grid-like arrangement
    return generateGridLayout(circleCount);
  }
  return LAYOUTS[circleCount]?.circles || LAYOUTS[3].circles;
}

/**
 * Generate grid layout for 8+ circles
 */
function generateGridLayout(count) {
  const circles = [];
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const cellWidth = 100 / (cols + 1);
  const cellHeight = 100 / (rows + 1);
  const radius = Math.min(cellWidth, cellHeight) * 0.4;

  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    circles.push({
      x: (col + 1) * cellWidth,
      y: (row + 1) * cellHeight,
      r: radius
    });
  }

  return circles;
}

/**
 * Calculate zone key from circle IDs
 */
export function getZoneKey(circleIds) {
  return [...circleIds].sort().join('+');
}

/**
 * Calculate position for a contact based on their circles
 */
export function getContactPosition(contact, allCircles, layout, indexInZone, totalInZone) {
  const circleIds = contact.circleIds || [];

  if (circleIds.length === 0) {
    // Contact with no circles - position at edge
    return { x: 95, y: 95 };
  }

  if (circleIds.length === 1) {
    // Single circle - position in that circle's exclusive zone
    const circleIndex = allCircles.findIndex(c => c.id === circleIds[0]);
    if (circleIndex === -1) return { x: 50, y: 50 };

    const circleLayout = layout[circleIndex];
    return getPositionInCircle(circleLayout, indexInZone, totalInZone, 'edge');
  }

  // Multiple circles - position in intersection
  const circleLayouts = circleIds
    .map(id => {
      const index = allCircles.findIndex(c => c.id === id);
      return index >= 0 ? layout[index] : null;
    })
    .filter(Boolean);

  if (circleLayouts.length === 0) return { x: 50, y: 50 };

  // Find center of intersection
  const avgX = circleLayouts.reduce((sum, c) => sum + c.x, 0) / circleLayouts.length;
  const avgY = circleLayouts.reduce((sum, c) => sum + c.y, 0) / circleLayouts.length;

  // Spread contacts in this zone
  return spreadPositions({ x: avgX, y: avgY }, indexInZone, totalInZone, 8);
}

/**
 * Get position within a single circle
 */
function getPositionInCircle(circle, index, total, zone = 'center') {
  if (total === 1) {
    if (zone === 'edge') {
      return { x: circle.x - circle.r * 0.5, y: circle.y };
    }
    return { x: circle.x, y: circle.y };
  }

  // Spread contacts around the zone
  const spreadRadius = zone === 'edge' ? circle.r * 0.6 : circle.r * 0.4;
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;

  return {
    x: circle.x + Math.cos(angle) * spreadRadius * (zone === 'edge' ? 0.7 : 0.5),
    y: circle.y + Math.sin(angle) * spreadRadius
  };
}

/**
 * Spread multiple contacts around a center point
 */
function spreadPositions(center, index, total, spacing = 10) {
  if (total === 1) return center;

  // Offset from center based on index
  const offset = index - (total - 1) / 2;
  const angle = (index / total) * Math.PI * 2;

  return {
    x: center.x + Math.cos(angle) * spacing,
    y: center.y + Math.sin(angle) * spacing
  };
}

/**
 * Check if two positions overlap
 */
export function checkOverlap(pos1, pos2, minDistance = 12) {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  return Math.sqrt(dx * dx + dy * dy) < minDistance;
}

/**
 * Resolve overlapping positions by nudging
 */
export function resolveOverlaps(positions, minDistance = 12, maxIterations = 50) {
  const resolved = [...positions];

  for (let iter = 0; iter < maxIterations; iter++) {
    let hasOverlap = false;

    for (let i = 0; i < resolved.length; i++) {
      for (let j = i + 1; j < resolved.length; j++) {
        if (checkOverlap(resolved[i], resolved[j], minDistance)) {
          hasOverlap = true;

          // Calculate push direction
          const dx = resolved[j].x - resolved[i].x;
          const dy = resolved[j].y - resolved[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
          const pushDist = (minDistance - dist) / 2 + 0.5;

          // Normalize and push apart
          const nx = dx / dist;
          const ny = dy / dist;

          resolved[i] = {
            ...resolved[i],
            x: Math.max(5, Math.min(95, resolved[i].x - nx * pushDist)),
            y: Math.max(5, Math.min(95, resolved[i].y - ny * pushDist))
          };
          resolved[j] = {
            ...resolved[j],
            x: Math.max(5, Math.min(95, resolved[j].x + nx * pushDist)),
            y: Math.max(5, Math.min(95, resolved[j].y + ny * pushDist))
          };
        }
      }
    }

    if (!hasOverlap) break;
  }

  return resolved;
}

/**
 * Get curved path for circle label
 */
export function getLabelPath(circle, position = 'top') {
  const r = circle.r + 5;
  const cx = circle.x;
  const cy = circle.y;

  switch (position) {
    case 'top':
      return `M ${cx - r * 0.7} ${cy - r * 0.7} A ${r} ${r} 0 0 1 ${cx + r * 0.7} ${cy - r * 0.7}`;
    case 'bottom':
      return `M ${cx - r * 0.7} ${cy + r * 0.7} A ${r} ${r} 0 0 0 ${cx + r * 0.7} ${cy + r * 0.7}`;
    case 'left':
      return `M ${cx - r} ${cy - r * 0.5} A ${r} ${r} 0 0 0 ${cx - r} ${cy + r * 0.5}`;
    case 'right':
      return `M ${cx + r} ${cy - r * 0.5} A ${r} ${r} 0 0 1 ${cx + r} ${cy + r * 0.5}`;
    default:
      return `M ${cx - r * 0.7} ${cy - r * 0.7} A ${r} ${r} 0 0 1 ${cx + r * 0.7} ${cy - r * 0.7}`;
  }
}

/**
 * Determine best label position for a circle based on its position
 */
export function getBestLabelPosition(circle, allCircles) {
  const cx = circle.x;
  const cy = circle.y;

  // Check which quadrant the circle is in
  if (cx < 40 && cy < 50) return 'left';
  if (cx > 60 && cy < 50) return 'right';
  if (cy > 60) return 'bottom';
  return 'top';
}

export default {
  getCircleLayout,
  getContactPosition,
  getZoneKey,
  checkOverlap,
  resolveOverlaps,
  getLabelPath,
  getBestLabelPosition
};
