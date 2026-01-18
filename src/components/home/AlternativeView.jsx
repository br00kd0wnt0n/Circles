import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid3X3, List, Users } from 'lucide-react';
import { StatusDot } from '../ui/StatusDot';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';

/**
 * Alternative view for when Venn diagram becomes too complex (8+ circles)
 * Provides list and grid views organized by circle
 */
export function AlternativeView({ onSelectHousehold, selectedHousehold }) {
  const { circles, friendHouseholds } = useData();
  const { theme, themeId } = useTheme();
  const isDark = themeId === 'midnight';

  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [expandedCircle, setExpandedCircle] = useState(null);

  // Group households by circle
  const householdsByCircle = useMemo(() => {
    const grouped = {};
    circles.forEach(circle => {
      grouped[circle.id] = {
        circle,
        households: friendHouseholds.filter(h => h.circleIds?.includes(circle.id))
      };
    });
    return grouped;
  }, [circles, friendHouseholds]);

  // Get overall stats
  const stats = useMemo(() => {
    const total = friendHouseholds.length;
    const available = friendHouseholds.filter(h => h.status?.state !== 'busy').length;
    return { total, available };
  }, [friendHouseholds]);

  return (
    <div className="w-full max-w-[400px] mx-auto px-4">
      {/* Header with view toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-500'}`}>
          {stats.available} of {stats.total} friends available
        </div>
        <div className="flex gap-1 p-1 rounded-lg" style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
        }}>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-[#9CAF88] text-white'
                : isDark ? 'text-white/50' : 'text-gray-500'
            }`}
          >
            <Grid3X3 size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-[#9CAF88] text-white'
                : isDark ? 'text-white/50' : 'text-gray-500'
            }`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {circles.map(circle => {
          const { households } = householdsByCircle[circle.id];
          const availableCount = households.filter(h => h.status?.state !== 'busy').length;
          const isExpanded = expandedCircle === circle.id;

          return (
            <motion.div
              key={circle.id}
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'white',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`
              }}
            >
              {/* Circle header */}
              <button
                onClick={() => setExpandedCircle(isExpanded ? null : circle.id)}
                className="w-full flex items-center gap-3 p-3"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: circle.color + '30' }}
                >
                  <div
                    className="w-5 h-5 rounded-full"
                    style={{ backgroundColor: circle.color }}
                  />
                </div>
                <div className="flex-1 text-left">
                  <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {circle.name}
                  </div>
                  <div className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                    {households.length} friends
                    {availableCount > 0 && (
                      <span className="text-[#9CAF88]"> • {availableCount} available</span>
                    )}
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  className={isDark ? 'text-white/50' : 'text-gray-400'}
                >
                  <Users size={16} />
                </motion.div>
              </button>

              {/* Expanded content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className={`px-3 pb-3 ${
                      viewMode === 'grid' ? 'grid grid-cols-4 gap-2' : 'space-y-1'
                    }`}>
                      {households.map(household => (
                        viewMode === 'grid' ? (
                          <GridItem
                            key={household.id}
                            household={household}
                            isSelected={selectedHousehold?.id === household.id}
                            onSelect={onSelectHousehold}
                            isDark={isDark}
                          />
                        ) : (
                          <ListItem
                            key={household.id}
                            household={household}
                            isSelected={selectedHousehold?.id === household.id}
                            onSelect={onSelectHousehold}
                            isDark={isDark}
                          />
                        )
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function GridItem({ household, isSelected, onSelect, isDark }) {
  const isAvailable = household.status?.state !== 'busy';

  return (
    <motion.button
      onClick={() => isAvailable && onSelect(household)}
      className={`flex flex-col items-center p-2 rounded-xl transition-colors ${
        isSelected
          ? 'bg-[#9CAF88]/20 ring-2 ring-[#9CAF88]'
          : isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
      } ${!isAvailable ? 'opacity-40' : ''}`}
      whileTap={isAvailable ? { scale: 0.95 } : {}}
    >
      <div className="relative">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
          isDark ? 'bg-white/10' : 'bg-gray-100'
        }`}>
          {household.members?.[0]?.avatar || '👤'}
        </div>
        <span className="absolute -bottom-0.5 -right-0.5">
          <StatusDot status={household.status?.state} size="sm" />
        </span>
      </div>
      <p className={`text-xs mt-1 truncate w-full text-center ${
        isDark ? 'text-white' : 'text-gray-900'
      }`}>
        {household.householdName?.replace(/^The\s+/i, '') || ''}
      </p>
    </motion.button>
  );
}

function ListItem({ household, isSelected, onSelect, isDark }) {
  const isAvailable = household.status?.state !== 'busy';

  return (
    <motion.button
      onClick={() => isAvailable && onSelect(household)}
      className={`w-full flex items-center gap-3 p-2 rounded-xl transition-colors ${
        isSelected
          ? 'bg-[#9CAF88]/20 ring-2 ring-[#9CAF88]'
          : isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
      } ${!isAvailable ? 'opacity-40' : ''}`}
      whileTap={isAvailable ? { scale: 0.98 } : {}}
    >
      <div className="relative">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
          isDark ? 'bg-white/10' : 'bg-gray-100'
        }`}>
          {household.members?.[0]?.avatar || '👤'}
        </div>
        <span className="absolute -bottom-0.5 -right-0.5">
          <StatusDot status={household.status?.state} size="sm" />
        </span>
      </div>
      <div className="flex-1 text-left">
        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {household.householdName}
        </p>
        {household.status?.note && (
          <p className={`text-xs truncate ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
            {household.status.note}
          </p>
        )}
      </div>
    </motion.button>
  );
}

export default AlternativeView;
