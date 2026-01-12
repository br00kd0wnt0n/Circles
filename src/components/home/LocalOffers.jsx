import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { localOffers } from '../../data/seedData';
import { useTheme } from '../../context/ThemeContext';

export function LocalOffers() {
  const { theme, themeId } = useTheme();
  const isDark = themeId === 'midnight';
  const [selectedIndex, setSelectedIndex] = useState(null);

  // Show all offers in compact format
  const displayOffers = localOffers.slice(0, 4);
  const selectedOffer = selectedIndex !== null ? displayOffers[selectedIndex] : null;

  const goToPrev = () => {
    setSelectedIndex(prev => (prev === 0 ? displayOffers.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setSelectedIndex(prev => (prev === displayOffers.length - 1 ? 0 : prev + 1));
  };

  const handleDragEnd = (event, info) => {
    const swipeThreshold = 50;
    if (info.offset.x > swipeThreshold) {
      goToPrev();
    } else if (info.offset.x < -swipeThreshold) {
      goToNext();
    }
  };

  return (
    <>
      <div className="py-3">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4">
          {displayOffers.map((offer, index) => (
            <motion.button
              key={offer.id}
              onClick={() => setSelectedIndex(index)}
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

      {/* Expanded Offer Overlay */}
      <AnimatePresence mode="wait">
        {selectedOffer && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              onClick={() => setSelectedIndex(null)}
            />

            {/* Navigation Arrows */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={goToPrev}
              className="fixed left-2 top-1/2 -translate-y-1/2 z-50 p-2 rounded-full"
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }}
            >
              <ChevronLeft size={24} style={{ color: isDark ? 'white' : '#1F2937' }} />
            </motion.button>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={goToNext}
              className="fixed right-2 top-1/2 -translate-y-1/2 z-50 p-2 rounded-full"
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }}
            >
              <ChevronRight size={24} style={{ color: isDark ? 'white' : '#1F2937' }} />
            </motion.button>

            {/* Floating Card - Swipeable */}
            <motion.div
              key={selectedOffer.id}
              initial={{ opacity: 0, scale: 0.9, x: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: -50 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className="fixed left-4 right-4 bottom-24 z-50 rounded-2xl p-5 shadow-xl max-w-sm mx-auto cursor-grab active:cursor-grabbing"
              style={{
                backgroundColor: isDark ? '#1E293B' : 'white',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`
              }}
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedIndex(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full transition-colors"
                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
              >
                <X size={16} style={{ color: theme.textSecondary }} />
              </button>

              {/* Carousel Indicators */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {displayOffers.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedIndex(idx)}
                    className="w-1.5 h-1.5 rounded-full transition-all"
                    style={{
                      backgroundColor: idx === selectedIndex ? selectedOffer.color : (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'),
                      transform: idx === selectedIndex ? 'scale(1.3)' : 'scale(1)'
                    }}
                  />
                ))}
              </div>

              {/* Header */}
              <div className="flex items-center gap-3 mb-4 mt-2">
                <img
                  src={selectedOffer.logo}
                  alt={selectedOffer.business}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold" style={{ color: theme.textPrimary }}>
                    {selectedOffer.business}
                  </h3>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${selectedOffer.color}20`, color: selectedOffer.color }}
                  >
                    Special Offer
                  </span>
                </div>
              </div>

              {/* Offer Details */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Tag size={16} className="mt-0.5 flex-shrink-0" style={{ color: selectedOffer.color }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: theme.textPrimary }}>
                      {selectedOffer.offer}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: theme.textSecondary }}>
                      {selectedOffer.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock size={16} className="flex-shrink-0" style={{ color: theme.textSecondary }} />
                  <p className="text-sm" style={{ color: theme.textSecondary }}>
                    {selectedOffer.validUntil}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin size={16} className="flex-shrink-0" style={{ color: theme.textSecondary }} />
                  <p className="text-sm" style={{ color: theme.textSecondary }}>
                    Woodstock, NY
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                className="w-full mt-4 py-3 rounded-xl font-medium text-sm text-white"
                style={{ backgroundColor: selectedOffer.color }}
              >
                Get Directions
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
