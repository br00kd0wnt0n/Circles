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
            className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-full border transition-colors"
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'white',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
            }}
          >
            <span className="text-base">{offer.icon}</span>
            <span className="text-xs font-medium" style={{ color: theme.textPrimary }}>
              {offer.offer}
            </span>
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: `${offer.color}15`,
                color: offer.color
              }}
            >
              {offer.business.split(' ')[0]}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
