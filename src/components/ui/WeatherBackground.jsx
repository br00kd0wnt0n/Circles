import { motion } from 'framer-motion';
import { useMemo } from 'react';

// Weather types with associated visual properties
const weatherStyles = {
  sunny: {
    gradient: 'from-amber-100/50 via-amber-50/20 to-transparent',
    particleColor: 'rgba(251, 191, 36, 0.4)',
    particleCount: 12
  },
  cloudy: {
    gradient: 'from-slate-200/50 via-slate-100/30 to-transparent',
    particleColor: 'rgba(148, 163, 184, 0.3)',
    particleCount: 8
  },
  rainy: {
    gradient: 'from-blue-200/40 via-blue-100/20 to-transparent',
    particleColor: 'rgba(147, 197, 253, 0.5)',
    particleCount: 20
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
            className="absolute rounded-full blur-lg"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              backgroundColor: style.particleColor,
            }}
            animate={{
              x: [0, 15, 0, -15, 0],
              y: [0, -15, 0, 15, 0],
              opacity: [0.5, 0.9, 0.5, 0.9, 0.5],
              scale: [1, 1.2, 1, 0.9, 1]
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
          className="absolute -top-10 -right-10 w-80 h-80 rounded-full blur-3xl"
          style={{ backgroundColor: 'rgba(251, 191, 36, 0.25)' }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.6, 0.9, 0.6]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      )}

      {/* Cloud layer for cloudy weather */}
      {weather === 'cloudy' && (
        <>
          <motion.div
            className="absolute top-10 left-10 w-64 h-32 rounded-full blur-2xl"
            style={{ backgroundColor: 'rgba(148, 163, 184, 0.25)' }}
            animate={{
              x: [0, 40, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          <motion.div
            className="absolute top-24 right-10 w-48 h-24 rounded-full blur-2xl"
            style={{ backgroundColor: 'rgba(148, 163, 184, 0.2)' }}
            animate={{
              x: [0, -30, 0],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        </>
      )}
    </div>
  );
}
