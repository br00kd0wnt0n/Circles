import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Mic, X } from 'lucide-react';
import { ScatteredContacts } from './ScatteredContacts';
import { HeaderLockup } from './HeaderLockup';
import { StatusEditor } from './StatusEditor';
import { HouseholdDetail } from './HouseholdDetail';
import { LocalOffers } from './LocalOffers';
import { friendHouseholds } from '../../data/seedData';

export function HomeScreen({ myHousehold, myStatus, setMyStatus, onCreateHangout, onOpenSettings }) {
  const [showStatusEditor, setShowStatusEditor] = useState(false);
  const [selectedHousehold, setSelectedHousehold] = useState(null);
  const [showVoiceMode, setShowVoiceMode] = useState(false);

  // Calculate available friends
  const availableFriends = useMemo(() => {
    const available = friendHouseholds.filter(h =>
      h.status.state === 'available' || h.status.state === 'open'
    );
    return { available: available.length, total: friendHouseholds.length };
  }, []);

  return (
    <div className="pb-24">
      {/* Header with green arc */}
      <HeaderLockup
        household={myHousehold}
        status={myStatus}
        onStatusChange={setMyStatus}
        onOpenSettings={onOpenSettings}
      />

      {/* Info Bar - Weather left, Friends Available right */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-start justify-between px-1 mb-4"
      >
        <div className="text-sm text-[#6B7280]">
          <span className="font-medium">72</span>
          <div className="text-xs">Sunny</div>
        </div>
        <div className="text-sm text-[#6B7280] text-right">
          <span className="font-medium">{availableFriends.available}</span>
          <span className="mx-0.5">/</span>
          <span>{availableFriends.total}</span>
          <div className="text-xs">Friends Available</div>
        </div>
      </motion.div>

      {/* Scattered Contacts - Home Level 1 */}
      <ScatteredContacts
        onSelectHousehold={(household) => setSelectedHousehold(household)}
        selectedHousehold={selectedHousehold}
      />

      {/* Action Buttons - matching wireframe style */}
      <div className="mt-8 flex justify-center gap-2">
        <motion.button
          onClick={() => onCreateHangout()}
          className="flex items-center gap-2 px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm border border-gray-200"
          whileHover={{ backgroundColor: '#e5e5e5' }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus size={18} />
          <span>Make Plans</span>
        </motion.button>

        <motion.button
          onClick={() => setShowVoiceMode(true)}
          className="flex items-center justify-center w-12 h-12 bg-gray-100 text-gray-700 rounded-xl border border-gray-200"
          whileHover={{ backgroundColor: '#e5e5e5' }}
          whileTap={{ scale: 0.98 }}
        >
          <Mic size={20} />
        </motion.button>
      </div>

      {/* Local Business Offers */}
      <LocalOffers />

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
