import { motion } from 'framer-motion';

export function WeatherSuggestion({ weather }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-[#E8F0E3] to-[#F4F9F2] rounded-2xl p-4 mb-4"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{weather.icon}</span>
        <div>
          <p className="font-medium text-[#1F2937]">{weather.weather}</p>
          <p className="text-sm text-[#6B7280] mt-0.5">{weather.suggestion}</p>
        </div>
      </div>
    </motion.div>
  );
}
