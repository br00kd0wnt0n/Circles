import { motion } from 'framer-motion';
import { localOffers } from '../../data/seedData';
import { useTheme } from '../../context/ThemeContext';

export function LocalOffers() {
  const { theme, themeId } = useTheme();
  const isDark = themeId === 'midnight';

  // Show all offers in compact format
  const displayOffers = localOffers.slice(0, 4);

  return (
    <div className="py-3">
      <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4">
        {displayOffers.map((offer, index) => (
          <motion.button
            key={offer.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0 flex items-center gap-2 px-2.5 py-1.5 rounded-full border transition-colors"
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'white',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
            }}
          >
            <img
              src={offer.logo}
              alt={offer.business}
              className="w-6 h-6 rounded-full object-cover flex-shrink-0"
            />
            <span className="text-xs font-medium pr-1" style={{ color: theme.textPrimary }}>
              {offer.offer}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
