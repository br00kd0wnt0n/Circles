import { motion } from 'framer-motion';
import { Home, Circle, Calendar } from 'lucide-react';

const tabs = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'circles', label: 'Circles', icon: Circle },
  { id: 'activity', label: 'Activity', icon: Calendar }
];

export function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-100 pb-safe z-30">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center justify-center w-16 h-full relative"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#9CAF88] rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <Icon
                size={24}
                className={isActive ? 'text-[#9CAF88]' : 'text-[#6B7280]'}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-xs mt-1 ${isActive ? 'text-[#9CAF88] font-medium' : 'text-[#6B7280]'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
