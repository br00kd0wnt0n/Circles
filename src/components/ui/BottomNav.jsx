import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

// Venn diagram icon - shows when in scattered mode (hint: tap for venn)
const VennIcon = ({ size = 28, isActive }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={isActive ? 2.5 : 1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="9" cy="10" r="6" />
    <circle cx="15" cy="10" r="6" />
    <circle cx="12" cy="15" r="6" />
  </svg>
);

// Single circle icon - shows when in venn mode (hint: tap for scattered)
const SingleCircleIcon = ({ size = 28, isActive }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={isActive ? 2.5 : 1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="8" />
  </svg>
);

// Activity icon - rounded square
const ActivityIcon = ({ size = 28, isActive }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={isActive ? 2.5 : 1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="4" y="4" width="16" height="16" rx="3" />
  </svg>
);

export function BottomNav({ activeTab, viewMode, onTabChange, onMakePlans, onToggleView }) {
  const { theme, themeId } = useTheme();
  const isDark = themeId === 'midnight';

  // Show single circle when in venn mode (hint: tap for scattered)
  // Show venn circles when in scattered mode (hint: tap for venn)
  const CircleIcon = viewMode === 'venn' ? SingleCircleIcon : VennIcon;

  return (
    <nav
      className="absolute bottom-0 left-0 right-0 border-t z-30 transition-colors duration-500"
      style={{
        backgroundColor: isDark ? '#1E293B' : 'white',
        borderColor: isDark ? '#334155' : '#E5E7EB',
        paddingBottom: 'max(8px, var(--safe-area-bottom))'
      }}
    >
      <div className="flex justify-center items-center gap-12 sm:gap-16 h-14 max-w-md mx-auto">
        {/* Make Plans Button */}
        <motion.button
          onClick={onMakePlans}
          className="flex items-center justify-center p-3 min-w-[48px] min-h-[48px] transition-colors"
          style={{ color: theme.textSecondary }}
          whileTap={{ scale: 0.9 }}
        >
          <Plus size={28} strokeWidth={1.5} />
        </motion.button>

        {/* Circles Toggle - Center */}
        <motion.button
          onClick={onToggleView}
          className="flex items-center justify-center p-3 min-w-[48px] min-h-[48px] rounded-full transition-colors"
          style={{
            color: activeTab === 'circles' ? theme.cta : theme.textSecondary,
            backgroundColor: activeTab === 'circles' ? `${theme.cta}15` : 'transparent'
          }}
          whileTap={{ scale: 0.9 }}
        >
          <CircleIcon size={28} isActive={activeTab === 'circles'} />
        </motion.button>

        {/* Activity */}
        <motion.button
          onClick={() => onTabChange('activity')}
          className="flex items-center justify-center p-3 min-w-[48px] min-h-[48px] transition-colors"
          style={{ color: activeTab === 'activity' ? theme.cta : theme.textSecondary }}
          whileTap={{ scale: 0.9 }}
        >
          <ActivityIcon size={28} isActive={activeTab === 'activity'} />
        </motion.button>
      </div>
    </nav>
  );
}
