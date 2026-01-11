import { motion } from 'framer-motion';
import { useMemo } from 'react';

// Weather types with associated visual properties
const weatherStyles = {
  sunny: {
    gradient: 'from-amber-50/30 via-transparent to-transparent',
    particleColor: 'rgba(251, 191, 36, 0.15)',
    particleCount: 8
  },
  cloudy: {
    gradient: 'from-slate-100/40 via-transparent to-transparent',
    particleColor: 'rgba(148, 163, 184, 0.12)',
    particleCount: 5
  },
  rainy: {
    gradient: 'from-blue-100/30 via-transparent to-transparent',
    particleColor: 'rgba(147, 197, 253, 0.2)',
    particleCount: 12
  }
};

// Generate random positions for particles
const generateParticles = (count, weatherType) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: weatherType === 'rainy' ? 2 + Math.random() * 3 : 20 + Math.random() * 40,
    delay: Math.random() * 3,
    duration: weatherType === 'rainy' ? 1 + Math.random() * 0.5 : 4 + Math.random() * 4
  }));
};

export function WeatherBackground({ weather = 'sunny' }) {
  const style = weatherStyles[weather] || weatherStyles.sunny;
  const particles = useMemo(() => generateParticles(style.particleCount, weather), [weather, style.particleCount]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-b ${style.gradient}`} />

      {/* Ambient particles */}
      {particles.map((particle) => (
        weather === 'rainy' ? (
          // Rain drops - vertical falling motion
          <motion.div
            key={particle.id}
            className="absolute rounded-full opacity-40"
            style={{
              left: `${particle.x}%`,
              width: particle.size,
              height: particle.size * 4,
              backgroundColor: style.particleColor,
            }}
            initial={{ top: -20 }}
            animate={{
              top: ['0%', '110%'],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        ) : (
          // Sun rays or cloud puffs - gentle floating motion
          <motion.div
            key={particle.id}
            className="absolute rounded-full blur-xl"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              backgroundColor: style.particleColor,
            }}
            animate={{
              x: [0, 10, 0, -10, 0],
              y: [0, -10, 0, 10, 0],
              opacity: [0.3, 0.5, 0.3, 0.5, 0.3],
              scale: [1, 1.1, 1, 0.9, 1]
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        )
      ))}

      {/* Sun glow effect for sunny weather */}
      {weather === 'sunny' && (
        <motion.div
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl"
          style={{ backgroundColor: 'rgba(251, 191, 36, 0.08)' }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.7, 0.5]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      )}

      {/* Cloud layer for cloudy weather */}
      {weather === 'cloudy' && (
        <>
          <motion.div
            className="absolute top-10 left-10 w-48 h-24 rounded-full blur-2xl"
            style={{ backgroundColor: 'rgba(148, 163, 184, 0.08)' }}
            animate={{
              x: [0, 30, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          <motion.div
            className="absolute top-20 right-20 w-32 h-16 rounded-full blur-2xl"
            style={{ backgroundColor: 'rgba(148, 163, 184, 0.06)' }}
            animate={{
              x: [0, -20, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        </>
      )}
    </div>
  );
}
