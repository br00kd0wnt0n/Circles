import { motion } from 'framer-motion';
import { Tag, ChevronRight } from 'lucide-react';
import { localOffers } from '../../data/seedData';
import { useTheme } from '../../context/ThemeContext';

export function LocalOffers() {
  const { theme, themeId } = useTheme();
  const isDark = themeId === 'midnight';

  // Show 2-3 random offers
  const displayOffers = localOffers.slice(0, 3);

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Tag size={14} style={{ color: theme.statusBusy }} />
          <h3 className="text-sm font-medium" style={{ color: theme.textPrimary }}>Local Offers</h3>
        </div>
        <button
          className="text-xs font-medium flex items-center gap-0.5"
          style={{ color: theme.cta }}
        >
          See all
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-4 px-4 pb-2">
        {displayOffers.map((offer, index) => (
          <motion.button
            key={offer.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-shrink-0 w-[160px] rounded-xl p-3 border shadow-sm text-left transition-colors"
            style={{
              backgroundColor: isDark ? '#1E293B' : 'white',
              borderColor: isDark ? '#334155' : '#F3F4F6'
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-2xl">{offer.icon}</span>
              <span
                className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${offer.color}20`,
                  color: offer.color
                }}
              >
                DEAL
              </span>
            </div>
            <p className="text-xs font-semibold leading-tight" style={{ color: theme.textPrimary }}>
              {offer.offer}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: theme.textSecondary }}>
              {offer.business}
            </p>
            <p className="text-[10px] mt-1.5" style={{ color: theme.cta }}>
              {offer.validUntil}
            </p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
