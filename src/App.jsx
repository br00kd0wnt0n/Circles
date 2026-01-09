import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BottomNav } from './components/ui/BottomNav';
import { HomeScreen } from './components/home/HomeScreen';
import { CirclesScreen } from './components/circles/CirclesScreen';
import { ActivityScreen } from './components/activity/ActivityScreen';
import { CreateHangout } from './components/hangout/CreateHangout';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { useAppState } from './hooks/useLocalStorage';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [showCreateHangout, setShowCreateHangout] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preselectedFriends, setPreselectedFriends] = useState([]);

  const {
    myHousehold,
    updateHousehold,
    myStatus,
    setMyStatus,
    invites,
    addInvite,
    respondToInvite
  } = useAppState();

  const handleCreateHangout = (friendIds = []) => {
    setPreselectedFriends(friendIds);
    setShowCreateHangout(true);
  };

  const handleSendInvite = (inviteData) => {
    addInvite({
      createdBy: myHousehold.id,
      ...inviteData
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Phone Frame for Demo */}
      <div className="max-w-[430px] mx-auto min-h-screen relative bg-[#FAF9F6] shadow-2xl">
        {/* Main Content */}
        <main className="p-4 pt-6">
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <HomeScreen
                  myHousehold={myHousehold}
                  myStatus={myStatus}
                  setMyStatus={setMyStatus}
                  onCreateHangout={handleCreateHangout}
                  onOpenSettings={() => setShowSettings(true)}
                />
              </motion.div>
            )}

            {activeTab === 'circles' && (
              <motion.div
                key="circles"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <CirclesScreen onCreateHangout={handleCreateHangout} />
              </motion.div>
            )}

            {activeTab === 'activity' && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <ActivityScreen
                  invites={invites}
                  onRespond={respondToInvite}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Bottom Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Create Hangout Modal */}
        <CreateHangout
          isOpen={showCreateHangout}
          onClose={() => {
            setShowCreateHangout(false);
            setPreselectedFriends([]);
          }}
          onSend={handleSendInvite}
          preselectedFriends={preselectedFriends}
        />

        {/* Settings Screen */}
        <SettingsScreen
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          household={myHousehold}
          onUpdateHousehold={updateHousehold}
        />
      </div>
    </div>
  );
}

export default App;
