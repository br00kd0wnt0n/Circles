import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BottomNav } from './components/ui/BottomNav';
import { UnifiedHomeCircles } from './components/home/UnifiedHomeCircles';
import { ActivityScreen } from './components/activity/ActivityScreen';
import { MakePlansOverlay } from './components/hangout/MakePlansOverlay';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { WeatherBackground } from './components/ui/WeatherBackground';
import { WelcomeGreeting } from './components/home/WelcomeGreeting';
import { useAppState } from './hooks/useLocalStorage';
import { useTheme } from './context/ThemeContext';

function App() {
  const [activeTab, setActiveTab] = useState('circles'); // circles is now the main view
  const [viewMode, setViewMode] = useState('venn'); // 'venn' or 'scattered'
  const [showMakePlans, setShowMakePlans] = useState(false);
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
  const isMakePlansView = showMakePlans;

  const handleTabChange = (tab) => {
    // Close Make Plans if open when switching tabs
    if (showMakePlans) {
      setShowMakePlans(false);
      setPreselectedFriends([]);
    }
    // Toggle Activity off if already on it
    if (tab === 'activity' && activeTab === 'activity') {
      setActiveTab('circles');
    } else {
      setActiveTab(tab);
    }
  };

  const handleToggleView = () => {
    // Close Activity when toggling circle view
    if (activeTab === 'activity') {
      setActiveTab('circles');
    }
    // Close Make Plans if open
    if (showMakePlans) {
      setShowMakePlans(false);
      setPreselectedFriends([]);
    }
    setViewMode(prev => prev === 'venn' ? 'scattered' : 'venn');
  };

  const handleMakePlans = (friendIds = []) => {
    // Close Activity when opening Make Plans
    if (activeTab === 'activity') {
      setActiveTab('circles');
    }
    setPreselectedFriends(friendIds);
    setShowMakePlans(true);
  };

  const handleSendInvite = (inviteData) => {
    addInvite({
      createdBy: myHousehold.id,
      ...inviteData
    });
    setShowMakePlans(false);
    setPreselectedFriends([]);
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
          {/* Circles View - always rendered, blurs when overlay is shown */}
          <motion.div
            className="h-full"
            animate={{
              filter: (isActivityView || isMakePlansView) ? 'blur(20px)' : 'blur(0px)',
              scale: (isActivityView || isMakePlansView) ? 1.05 : 1,
              opacity: (isActivityView || isMakePlansView) ? 0.6 : 1,
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <UnifiedHomeCircles
              viewMode={viewMode}
              myHousehold={myHousehold}
              myStatus={myStatus}
              setMyStatus={setMyStatus}
              onCreateHangout={handleMakePlans}
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

          {/* Make Plans Overlay */}
          <AnimatePresence>
            {isMakePlansView && (
              <motion.div
                key="makeplans"
                className="absolute inset-0 z-20 overflow-y-auto"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <MakePlansOverlay
                  onClose={() => {
                    setShowMakePlans(false);
                    setPreselectedFriends([]);
                  }}
                  onSend={handleSendInvite}
                  preselectedFriends={preselectedFriends}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          viewMode={viewMode}
          onTabChange={handleTabChange}
          onMakePlans={() => handleMakePlans()}
          onToggleView={handleToggleView}
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
