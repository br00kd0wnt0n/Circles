import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, Tag, ArrowLeft, Navigation } from 'lucide-react';
import { localOffers } from '../../data/seedData';
import { useTheme } from '../../context/ThemeContext';

// Mock coordinates for demo - would come from seedData in production
const offerLocations = {
  'skate-time-deal': { lat: 41.9270, lng: -74.0261, address: '1000 Ulster Ave, Kingston, NY' },
  'shelter-happy': { lat: 42.0825, lng: -74.3107, address: '2 Church St, Phoenicia, NY' },
  'bounce-group': { lat: 41.9270, lng: -74.0261, address: '1200 Ulster Ave, Kingston, NY' },
  'bread-alone': { lat: 42.0412, lng: -74.1179, address: '22 Mill Hill Rd, Woodstock, NY' }
};

export function LocalOffers() {
  const { theme, themeId } = useTheme();
  const isDark = themeId === 'midnight';
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showMap, setShowMap] = useState(false);

  // Show all offers in compact format
  const displayOffers = localOffers.slice(0, 4);
  const selectedOffer = selectedIndex !== null ? displayOffers[selectedIndex] : null;
  const location = selectedOffer ? offerLocations[selectedOffer.id] : null;

  const goToPrev = () => {
    setShowMap(false); // Reset to details view when navigating
    setSelectedIndex(prev => (prev === 0 ? displayOffers.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setShowMap(false); // Reset to details view when navigating
    setSelectedIndex(prev => (prev === displayOffers.length - 1 ? 0 : prev + 1));
  };

  const handleDragEnd = (event, info) => {
    if (showMap) return; // Disable swipe in map view
    const swipeThreshold = 50;
    if (info.offset.x > swipeThreshold) {
      goToPrev();
    } else if (info.offset.x < -swipeThreshold) {
      goToNext();
    }
  };

  const handleClose = () => {
    setSelectedIndex(null);
    setShowMap(false);
  };

  const openInGoogleMaps = () => {
    if (location) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;
      window.open(url, '_blank');
    }
  };

  return (
    <>
      <div className="py-3">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4">
          {displayOffers.map((offer, index) => (
            <motion.button
              key={offer.id}
              onClick={() => {
                setSelectedIndex(index);
                setShowMap(false);
              }}
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
              onClick={handleClose}
            />

            {/* Floating Card - Swipeable */}
            <motion.div
              key={`${selectedOffer.id}-${showMap ? 'map' : 'details'}`}
              initial={{ opacity: 0, scale: 0.9, x: showMap ? 0 : 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: -50 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              drag={showMap ? false : "x"}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className="fixed left-4 right-4 bottom-24 z-50 rounded-2xl shadow-xl max-w-sm mx-auto overflow-hidden"
              style={{
                backgroundColor: isDark ? '#1E293B' : 'white',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                cursor: showMap ? 'default' : 'grab'
              }}
            >
              <AnimatePresence mode="wait">
                {showMap ? (
                  /* Map View */
                  <motion.div
                    key="map"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative"
                  >
                    {/* Map Header */}
                    <div
                      className="absolute top-0 left-0 right-0 z-10 p-3 flex items-center gap-3"
                      style={{
                        background: `linear-gradient(to bottom, ${isDark ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.95)'} 0%, transparent 100%)`
                      }}
                    >
                      <button
                        onClick={() => setShowMap(false)}
                        className="p-2 rounded-full transition-colors"
                        style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
                      >
                        <ArrowLeft size={18} style={{ color: theme.textPrimary }} />
                      </button>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm" style={{ color: theme.textPrimary }}>
                          {selectedOffer.business}
                        </h3>
                        <p className="text-xs" style={{ color: theme.textSecondary }}>
                          {location?.address}
                        </p>
                      </div>
                      <button
                        onClick={handleClose}
                        className="p-1.5 rounded-full transition-colors"
                        style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
                      >
                        <X size={16} style={{ color: theme.textSecondary }} />
                      </button>
                    </div>

                    {/* Map Embed */}
                    <div className="h-64 bg-gray-200">
                      <iframe
                        title={`Map of ${selectedOffer.business}`}
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        style={{ border: 0 }}
                        src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${location?.lat},${location?.lng}&zoom=15`}
                        allowFullScreen
                      />
                    </div>

                    {/* Map Footer with Directions */}
                    <div className="p-4">
                      <motion.button
                        onClick={openInGoogleMaps}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-3 rounded-xl font-medium text-sm text-white flex items-center justify-center gap-2"
                        style={{ backgroundColor: selectedOffer.color }}
                      >
                        <Navigation size={18} />
                        Get Directions
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  /* Details View */
                  <motion.div
                    key="details"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-5"
                  >
                    {/* Close button */}
                    <button
                      onClick={handleClose}
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
                          onClick={() => {
                            setSelectedIndex(idx);
                            setShowMap(false);
                          }}
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
                          {location?.address || 'Woodstock, NY'}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 py-3 rounded-xl font-medium text-sm text-white"
                        style={{ backgroundColor: selectedOffer.color }}
                      >
                        Make Plans
                      </motion.button>
                      <motion.button
                        onClick={() => setShowMap(true)}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-1.5"
                        style={{
                          backgroundColor: `${selectedOffer.color}20`,
                          color: selectedOffer.color
                        }}
                      >
                        <MapPin size={16} />
                        View Map
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
