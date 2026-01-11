import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

// Home icon - house outline
const HomeIcon = ({ size = 28, isActive }) => (
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
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>
);

// Circle icon - simple circle
const CircleIcon = ({ size = 28, isActive }) => (
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
    <circle cx="12" cy="12" r="9" />
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

const tabs = [
  { id: 'home', icon: HomeIcon },
  { id: 'circles', icon: CircleIcon },
  { id: 'activity', icon: ActivityIcon }
];

export function BottomNav({ activeTab, onTabChange }) {
  const { theme, themeId } = useTheme();
  const isDark = themeId === 'midnight';

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
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex items-center justify-center p-3 min-w-[48px] min-h-[48px] transition-colors"
              style={{ color: isActive ? theme.cta : theme.textSecondary }}
              whileTap={{ scale: 0.9 }}
            >
              <Icon
                size={28}
                isActive={isActive}
              />
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
