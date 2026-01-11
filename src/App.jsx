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
  const [backgroundView, setBackgroundView] = useState('home'); // tracks home/circles for when activity is shown
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

  const isActivityView = activeTab === 'activity';

  const handleTabChange = (tab) => {
    if (tab === 'home' || tab === 'circles') {
      setBackgroundView(tab);
    }
    setActiveTab(tab);
  };

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
    <div className="h-full transition-colors duration-500" style={{ backgroundColor: theme.background }}>
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

      {/* App Container - full screen on mobile, centered frame on desktop */}
      <div
        className="w-full h-full sm:max-w-[430px] sm:mx-auto relative sm:shadow-2xl overflow-hidden transition-colors duration-500"
        style={{
          backgroundColor: `rgba(${theme.backgroundRgb}, 0.95)`,
          paddingTop: 'var(--safe-area-top)',
          paddingBottom: 'var(--safe-area-bottom)',
        }}
      >
        {/* Main Content */}
        <main className="pb-20 relative z-10 h-full overflow-hidden">
          {/* Unified Home/Circles View - always rendered, blurs when activity is shown */}
          <motion.div
            className="h-full"
            animate={{
              filter: isActivityView ? 'blur(20px)' : 'blur(0px)',
              scale: isActivityView ? 1.05 : 1,
              opacity: isActivityView ? 0.6 : 1,
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <UnifiedHomeCircles
              viewMode={isActivityView ? backgroundView : activeTab}
              myHousehold={myHousehold}
              myStatus={myStatus}
              setMyStatus={setMyStatus}
              onCreateHangout={handleCreateHangout}
              onOpenSettings={() => setShowSettings(true)}
            />
          </motion.div>

          {/* Activity Screen - overlay on top of blurred background */}
          <AnimatePresence>
            {isActivityView && (
              <motion.div
                key="activity"
                className="absolute inset-0 z-20 overflow-y-auto"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
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
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

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
