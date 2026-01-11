import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const greetings = [
  { time: 'morning', text: 'Good morning', emoji: '☀️' },
  { time: 'afternoon', text: 'Good afternoon', emoji: '🌤️' },
  { time: 'evening', text: 'Good evening', emoji: '🌙' }
];

const weatherMessages = {
  sunny: { temp: '72°', desc: 'Sunny', icon: '☀️', suggestion: 'Perfect day for outdoor plans!' },
  cloudy: { temp: '65°', desc: 'Cloudy', icon: '⛅', suggestion: 'Great for a casual hangout' },
  rainy: { temp: '58°', desc: 'Rainy', icon: '🌧️', suggestion: 'Perfect for indoor activities' }
};

const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
};

export function WelcomeGreeting({ householdName, weather = 'sunny', onComplete }) {
  const [show, setShow] = useState(true);
  const [stage, setStage] = useState(0); // 0: greeting, 1: weather, 2: fade out

  const timeOfDay = getTimeOfDay();
  const greeting = greetings.find(g => g.time === timeOfDay) || greetings[0];
  const weatherInfo = weatherMessages[weather] || weatherMessages.sunny;

  useEffect(() => {
    // Progress through animation stages
    const timers = [
      setTimeout(() => setStage(1), 1200),  // Show weather after greeting
      setTimeout(() => setStage(2), 3000),  // Start fade out
      setTimeout(() => {
        setShow(false);
        onComplete?.();
      }, 3500)  // Complete
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#FAF9F6]"
        initial={{ opacity: 1 }}
        animate={{ opacity: stage === 2 ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center px-8">
          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <span className="text-4xl mb-2 block">{greeting.emoji}</span>
            <h1 className="text-2xl font-semibold text-[#1F2937] mb-1">
              {greeting.text}
            </h1>
            <p className="text-lg text-[#6B7280]">
              {householdName?.replace('The ', '')}
            </p>
          </motion.div>

          {/* Weather info */}
          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: stage >= 1 ? 1 : 0, y: stage >= 1 ? 0 : 10 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <div className="inline-flex items-center gap-3 bg-white/70 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-sm border border-gray-100">
              <span className="text-3xl">{weatherInfo.icon}</span>
              <div className="text-left">
                <p className="text-lg font-semibold text-[#1F2937]">
                  {weatherInfo.temp} · {weatherInfo.desc}
                </p>
                <p className="text-sm text-[#6B7280]">
                  {weatherInfo.suggestion}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Animated dots */}
          <motion.div
            className="mt-8 flex justify-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: stage >= 1 ? 1 : 0 }}
            transition={{ delay: 0.3 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-[#9CAF88]"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
