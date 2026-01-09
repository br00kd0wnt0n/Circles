import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { VennDiagram } from './VennDiagram';
import { HeaderLockup } from './HeaderLockup';
import { StatusEditor } from './StatusEditor';
import { HouseholdDetail } from './HouseholdDetail';
import { LocalOffers } from './LocalOffers';
import { getWeatherSuggestion } from '../../data/seedData';

export function HomeScreen({ myHousehold, myStatus, setMyStatus, onCreateHangout, onOpenSettings }) {
  const [showStatusEditor, setShowStatusEditor] = useState(false);
  const [selectedHousehold, setSelectedHousehold] = useState(null);
  const weather = useMemo(() => getWeatherSuggestion(), []);

  return (
    <div className="pb-24">
      {/* Unified Header Lockup */}
      <HeaderLockup
        household={myHousehold}
        status={myStatus}
        onStatusChange={setMyStatus}
        onOpenSettings={onOpenSettings}
      />

      {/* Weather Suggestion - Compact */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#F4F4F5] to-transparent rounded-xl mb-4"
      >
        <span className="text-lg">{weather.icon}</span>
        <p className="text-sm text-[#6B7280] flex-1">{weather.weather} — {weather.suggestion}</p>
      </motion.div>

      {/* Venn Diagram */}
      <div>
        <VennDiagram
          onSelectHousehold={(household) => setSelectedHousehold(household)}
          selectedHousehold={selectedHousehold}
        />
      </div>

      {/* Legend - compact */}
      <div className="mt-8 flex items-center justify-center gap-5 text-[10px] text-[#6B7280]">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span>Open</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
          <span>Busy</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-[#F4A69A] text-white text-[7px] font-bold flex items-center justify-center">2</span>
          <span>In 2+ circles</span>
        </div>
      </div>

      {/* Local Offers */}
      <LocalOffers />

      {/* Floating Action Button */}
      <motion.button
        onClick={() => onCreateHangout()}
        className="fixed bottom-24 right-6 w-14 h-14 bg-[#F4A69A] text-white rounded-full shadow-lg flex items-center justify-center float-animation z-20"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Plus size={28} />
      </motion.button>

      {/* Status Editor Modal - for adding notes */}
      <StatusEditor
        isOpen={showStatusEditor}
        onClose={() => setShowStatusEditor(false)}
        status={myStatus}
        onSave={(newStatus) => {
          setMyStatus(newStatus);
          setShowStatusEditor(false);
        }}
      />

      {/* Household Detail Sheet */}
      <HouseholdDetail
        household={selectedHousehold}
        isOpen={!!selectedHousehold}
        onClose={() => setSelectedHousehold(null)}
        onInvite={onCreateHangout}
      />
    </div>
  );
}
