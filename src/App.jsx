import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BottomNav } from './components/ui/BottomNav';
import { UnifiedHomeCircles } from './components/home/UnifiedHomeCircles';
import { ActivityScreen } from './components/activity/ActivityScreen';
import { CreateHangout } from './components/hangout/CreateHangout';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { WeatherBackground } from './components/ui/WeatherBackground';
import { WelcomeGreeting } from './components/home/WelcomeGreeting';
import { useAppState } from './hooks/useLocalStorage';
import { useTheme } from './context/ThemeContext';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [showCreateHangout, setShowCreateHangout] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preselectedFriends, setPreselectedFriends] = useState([]);
  const [weather] = useState('sunny'); // sunny, cloudy, rainy
  const [showWelcome, setShowWelcome] = useState(true);

  const {
    myHousehold,
    updateHousehold,
    myStatus,
    setMyStatus,
    invites,
    addInvite,
    respondToInvite
  } = useAppState();

  const { theme } = useTheme();

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
    <div className="min-h-screen transition-colors duration-500" style={{ backgroundColor: theme.background }}>
      {/* Welcome Greeting - shows on first load */}
      {showWelcome && (
        <WelcomeGreeting
          householdName={myHousehold.householdName}
          weather={weather}
          onComplete={() => setShowWelcome(false)}
        />
      )}

      {/* Weather Background */}
      <WeatherBackground weather={weather} />

      {/* Phone Frame for Demo */}
      <div
        className="max-w-[430px] mx-auto h-screen relative backdrop-blur-sm shadow-2xl overflow-hidden transition-colors duration-500"
        style={{ backgroundColor: `rgba(${theme.backgroundRgb}, 0.8)` }}
      >
        {/* Main Content */}
        <main className="pb-20 relative z-10 h-full overflow-hidden">
          {/* Unified Home/Circles View - seamless transition */}
          {(activeTab === 'home' || activeTab === 'circles') && (
            <UnifiedHomeCircles
              viewMode={activeTab}
              myHousehold={myHousehold}
              myStatus={myStatus}
              setMyStatus={setMyStatus}
              onCreateHangout={handleCreateHangout}
              onOpenSettings={() => setShowSettings(true)}
            />
          )}

          {/* Activity Screen - separate view */}
          <AnimatePresence mode="wait">
            {activeTab === 'activity' && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
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
