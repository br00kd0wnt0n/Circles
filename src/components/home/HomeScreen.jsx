import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Mic, X } from 'lucide-react';
import { VennDiagram } from './VennDiagram';
import { HeaderLockup } from './HeaderLockup';
import { StatusEditor } from './StatusEditor';
import { HouseholdDetail } from './HouseholdDetail';
import { LocalOffers } from './LocalOffers';
import { getWeatherSuggestion } from '../../data/seedData';

export function HomeScreen({ myHousehold, myStatus, setMyStatus, onCreateHangout, onOpenSettings }) {
  const [showStatusEditor, setShowStatusEditor] = useState(false);
  const [selectedHousehold, setSelectedHousehold] = useState(null);
  const [showVoiceMode, setShowVoiceMode] = useState(false);
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
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          <span>Busy</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-[#8B5CF6] text-white text-[7px] font-bold flex items-center justify-center">2</span>
          <span>In 2+ circles</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex justify-center gap-3">
        <motion.button
          onClick={() => onCreateHangout()}
          className="flex items-center gap-2 px-6 py-3 bg-[#F4A69A] text-white rounded-full shadow-md font-medium"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus size={20} />
          <span>Make Plans</span>
        </motion.button>

        <motion.button
          onClick={() => setShowVoiceMode(true)}
          className="flex items-center justify-center w-12 h-12 bg-white border border-gray-200 rounded-full shadow-md text-[#6B7280] hover:text-[#9CAF88] hover:border-[#9CAF88] transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Mic size={20} />
        </motion.button>
      </div>

      {/* Voice Mode Dialog */}
      <AnimatePresence>
        {showVoiceMode && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setShowVoiceMode(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-6"
            >
              {/* Handle */}
              <div className="flex justify-center -mt-3 mb-4">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>

              {/* Close button */}
              <button
                onClick={() => setShowVoiceMode(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} className="text-[#6B7280]" />
              </button>

              {/* Voice UI */}
              <div className="text-center pb-8">
                <motion.div
                  className="w-20 h-20 mx-auto mb-5 bg-[#9CAF88]/10 rounded-full flex items-center justify-center"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <motion.div
                    className="w-14 h-14 bg-[#9CAF88] rounded-full flex items-center justify-center text-white"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Mic size={28} />
                  </motion.div>
                </motion.div>

                <h3 className="text-lg font-semibold text-[#1F2937] mb-2">
                  What can I help you set up?
                </h3>
                <p className="text-sm text-[#6B7280] max-w-[280px] mx-auto">
                  Just tell me who you want to hang with and I'll find you options that work!
                </p>

                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <span className="px-3 py-1.5 bg-gray-100 rounded-full text-xs text-[#6B7280]">
                    "Dinner with the Johnsons"
                  </span>
                  <span className="px-3 py-1.5 bg-gray-100 rounded-full text-xs text-[#6B7280]">
                    "Playdate this weekend"
                  </span>
                  <span className="px-3 py-1.5 bg-gray-100 rounded-full text-xs text-[#6B7280]">
                    "Who's free tonight?"
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Local Offers */}
      <LocalOffers />

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
