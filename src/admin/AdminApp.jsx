import { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';
import AdminLogin from './AdminLogin';
import AdminLayout from './AdminLayout';
import BusinessesPanel from './BusinessesPanel';
import OffersPanel from './OffersPanel';
import EventsPanel from './EventsPanel';

export function AdminApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('businesses');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    if (!adminApi.isAuthenticated()) {
      setLoading(false);
      return;
    }

    try {
      await adminApi.getMe();
      setIsAuthenticated(true);
    } catch (err) {
      adminApi.logout();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <AdminLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={() => setIsAuthenticated(false)}
    >
      {activeTab === 'businesses' && <BusinessesPanel />}
      {activeTab === 'offers' && <OffersPanel />}
      {activeTab === 'events' && <EventsPanel />}
    </AdminLayout>
  );
}

export default AdminApp;
