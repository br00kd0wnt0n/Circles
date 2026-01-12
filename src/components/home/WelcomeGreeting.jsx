import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const weatherDescriptions = {
  sunny: 'beautiful and sunny',
  cloudy: 'nice and cloudy',
  rainy: 'a bit rainy'
};

const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
};

// Animated circles logo component - morphs between single and venn
// Matches bottom nav icon: viewBox 0 0 24 24, single circle r=8 at center
const CirclesLogo = ({ size = 60, color, showVenn = true }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <motion.circle
      animate={{
        cx: showVenn ? 9 : 12,
        cy: showVenn ? 10 : 12,
        r: showVenn ? 6 : 8
      }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
      stroke={color}
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <motion.circle
      animate={{
        cx: showVenn ? 15 : 12,
        cy: showVenn ? 10 : 12,
        r: showVenn ? 6 : 8,
        opacity: showVenn ? 1 : 0
      }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
      stroke={color}
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <motion.circle
      animate={{
        cx: showVenn ? 12 : 12,
        cy: showVenn ? 15 : 12,
        r: showVenn ? 6 : 8,
        opacity: showVenn ? 1 : 0
      }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
      stroke={color}
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function WelcomeGreeting({ householdName, weather = 'sunny', onComplete, onStartReveal }) {
  const { theme } = useTheme();
  const [phase, setPhase] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [logoAnimating, setLogoAnimating] = useState(false);
  const [showVenn, setShowVenn] = useState(false); // Start as single circle

  const timeOfDay = getTimeOfDay();
  const weatherDesc = weatherDescriptions[weather] || weatherDescriptions.sunny;
  const shortName = householdName?.replace('The ', '') || 'Friend';

  // Phase timings (total ~7 seconds)
  // 0: Logo appears (0-0.8s)
  // 1: Welcome to Circles (0.8-1.8s)
  // 2: Good morning/afternoon/evening (1.8-2.8s)
  // 3: Weather message (2.8-4s)
  // 4: Let's see what your friends are up to (4-5.2s)
  // 5: Logo animates down, start reveal (5.2-6.5s)
  // 6: Fade out (6.5-7s)

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 1800),
      setTimeout(() => setPhase(3), 2800),
      setTimeout(() => setPhase(4), 4000),
      setTimeout(() => {
        setPhase(5);
        setLogoAnimating(true);
        setIsExiting(true); // Start fading overlay immediately
        onStartReveal?.();
      }, 5200),
      setTimeout(() => onComplete?.(), 6000)
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete, onStartReveal]);

  // Single transition: single -> venn -> single (when moving down)
  useEffect(() => {
    // After logo appears, transition to venn
    const toVenn = setTimeout(() => setShowVenn(true), 1500);
    return () => clearTimeout(toVenn);
  }, []);

  // When logo starts animating down, transition back to single
  useEffect(() => {
    if (logoAnimating) {
      setShowVenn(false);
    }
  }, [logoAnimating]);

  return (
    <>
      {/* Circles Logo - stays visible and animates to bottom nav position */}
      <motion.div
        className="fixed z-[60]"
        initial={{
          top: '35%',
          left: '50%',
          x: '-50%',
          y: '-50%',
          scale: 1,
          opacity: 0
        }}
        animate={{
          opacity: logoAnimating ? 0 : 1,
          top: logoAnimating ? 'calc(100% - 36px)' : '35%',
          scale: logoAnimating ? 0.4 : 1,
        }}
        transition={{
          opacity: { duration: 0.5, delay: logoAnimating ? 0.5 : 0 },
          top: { duration: 0.7, ease: [0.32, 0.72, 0, 1] },
          scale: { duration: 0.7, ease: [0.32, 0.72, 0, 1] }
        }}
      >
        <CirclesLogo size={70} color={theme.cta} showVenn={showVenn} />
      </motion.div>

      <AnimatePresence>
        {!isExiting && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center"
            style={{ backgroundColor: theme.background }}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            {/* Text content */}
            <motion.div
              className="text-center px-8 max-w-sm mt-16"
              animate={{
                opacity: logoAnimating ? 0 : 1,
                y: logoAnimating ? -20 : 0
              }}
              transition={{ duration: 0.3 }}
            >
            {/* Phase 1: Welcome to Circles */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: phase >= 1 ? 1 : 0,
                y: phase >= 1 ? 0 : 20
              }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <h1
                className="text-3xl font-light tracking-tight"
                style={{ color: theme.textPrimary }}
              >
                Welcome to <span className="font-semibold">Circles</span>
              </h1>
            </motion.div>

            {/* Phase 2: Good morning/afternoon/evening */}
            <motion.div
              className="mt-5"
              initial={{ opacity: 0, y: 15 }}
              animate={{
                opacity: phase >= 2 ? 1 : 0,
                y: phase >= 2 ? 0 : 15
              }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <p
                className="text-xl"
                style={{ color: theme.textSecondary }}
              >
                Good {timeOfDay}, <span style={{ color: theme.textPrimary }} className="font-medium">{shortName}</span>
              </p>
            </motion.div>

            {/* Phase 3: Weather */}
            <motion.div
              className="mt-3"
              initial={{ opacity: 0, y: 15 }}
              animate={{
                opacity: phase >= 3 ? 1 : 0,
                y: phase >= 3 ? 0 : 15
              }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <p
                className="text-lg"
                style={{ color: theme.textSecondary }}
              >
                Looks like today is going to be{' '}
                <span style={{ color: theme.cta }} className="font-medium">{weatherDesc}</span>
              </p>
            </motion.div>

            {/* Phase 4: Let's see what your friends are up to */}
            <motion.div
              className="mt-6"
              initial={{ opacity: 0, y: 15 }}
              animate={{
                opacity: phase >= 4 ? 1 : 0,
                y: phase >= 4 ? 0 : 15
              }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <p
                className="text-base font-medium"
                style={{ color: theme.textPrimary }}
              >
                Let's see what your friends are up to...
              </p>

              {/* Animated loader dots */}
              <motion.div
                className="mt-4 flex justify-center gap-1.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: phase >= 4 ? 1 : 0 }}
                transition={{ delay: 0.2 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: theme.cta }}
                    animate={{
                      scale: [1, 1.4, 1],
                      opacity: [0.4, 1, 0.4]
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.15
                    }}
                  />
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
