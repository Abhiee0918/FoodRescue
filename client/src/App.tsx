import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { RestaurantDashboard } from './pages/RestaurantDashboard';
import { NGODashboard } from './pages/NGODashboard';
import { VolunteerDashboard } from './pages/VolunteerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { DonationWizardModal } from './components/DonationWizardModal';
import { LiveTrackingModal } from './components/LiveTrackingModal';
import { AuthModal } from './components/AuthModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { FoodRescueHeatmap } from './components/FoodRescueHeatmap';
import { AIDemandForecast } from './components/AIDemandForecast';
import { LiveImpactCounter } from './components/LiveImpactCounter';
import { User, Donation, ImpactStats, Notification, HeatmapZone, UserRole } from './types';
import { api } from './services/api';
import { getSocket } from './services/socket';

export function App() {
  // Current user state
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('fra_user');
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      if (
        parsed.name === 'Antigravity Admin' ||
        parsed.organizationName?.includes('FoodRescue AI') ||
        parsed.organizationName?.includes('HQ Operations') ||
        parsed.name?.includes('Antigravity')
      ) {
        parsed.name = 'FoodRescue Operations';
        parsed.organizationName = 'FoodRescue Operations';
        localStorage.setItem('fra_user', JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const [activeView, setActiveView] = useState<string>('landing');
  const [donations, setDonations] = useState<Donation[]>([]);
  const [impactStats, setImpactStats] = useState<ImpactStats | undefined>(undefined);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [heatmapZones, setHeatmapZones] = useState<HeatmapZone[]>([]);

  // Modals state
  const [donateModalOpen, setDonateModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalRole, setAuthModalRole] = useState<UserRole>('restaurant');
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingDonationId, setTrackingDonationId] = useState<string>('');

  // Toast banner
  const [toastMessage, setToastMessage] = useState<{ title: string; body: string } | null>(null);

  const showToast = (title: string, body: string) => {
    setToastMessage({ title, body });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Initial load
  useEffect(() => {
    api.getDonations()
      .then(res => setDonations(res.donations))
      .catch(err => console.warn('Using local donations data', err));

    api.getImpactStats()
      .then(res => setImpactStats(res.stats))
      .catch(err => console.warn('Using local impact stats', err));

    api.getHeatmapZones()
      .then(res => setHeatmapZones(res.zones))
      .catch(err => console.warn('Using local heatmap zones', err));

    if (currentUser) {
      api.getNotifications()
        .then(res => setNotifications(res.notifications))
        .catch(err => console.warn('Using local notifs', err));
    }
  }, [currentUser]);

  // Real-time Socket.IO listeners
  useEffect(() => {
    const socket = getSocket();

    const handleNewDonation = (newDon: Donation) => {
      setDonations(prev => [newDon, ...prev.filter(d => d.id !== newDon.id)]);
      showToast('🍲 New Food Surplus Listed', `${newDon.mealCount} meals from ${newDon.donorName}`);
    };

    const handleUpdatedDonation = (updatedDon: Donation) => {
      setDonations(prev => prev.map(d => d.id === updatedDon.id ? updatedDon : d));
    };

    const handleDeletedDonation = ({ id }: { id: string }) => {
      setDonations(prev => prev.filter(d => d.id !== id));
    };

    const handleNewNotif = (notif: Notification) => {
      setNotifications(prev => [notif, ...prev]);
      showToast(notif.title, notif.message);
    };

    const handleStatsUpdated = (stats: ImpactStats) => {
      setImpactStats(stats);
    };

    socket.on('donation:new', handleNewDonation);
    socket.on('donation:updated', handleUpdatedDonation);
    socket.on('donation:deleted', handleDeletedDonation);
    socket.on('notification:new', handleNewNotif);
    socket.on('stats:updated', handleStatsUpdated);

    return () => {
      socket.off('donation:new', handleNewDonation);
      socket.off('donation:updated', handleUpdatedDonation);
      socket.off('donation:deleted', handleDeletedDonation);
      socket.off('notification:new', handleNewNotif);
      socket.off('stats:updated', handleStatsUpdated);
    };
  }, []);

  // 1-Click Fast Role Switcher
  const handleSwitchRole = async (targetRole: UserRole) => {
    const emails: Record<UserRole, string> = {
      restaurant: 'restaurant@demo.com',
      ngo: 'ngo@demo.com',
      volunteer: 'volunteer@demo.com',
      admin: 'admin@demo.com'
    };

    try {
      const res = await api.login(emails[targetRole], 'demo123');
      localStorage.setItem('fra_token', res.token);
      localStorage.setItem('fra_user', JSON.stringify(res.user));
      setCurrentUser(res.user);
      setActiveView(`dashboard-${targetRole}`);
      showToast('⚡ Persona Switched', `Logged in as ${res.user.name} (${targetRole.toUpperCase()})`);
    } catch (err) {
      console.error('Role switch failed', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('fra_token');
    localStorage.removeItem('fra_user');
    setCurrentUser(null);
    setActiveView('landing');
    showToast('Signed Out', 'You have been safely signed out.');
  };

  const handleAcceptDonation = async (id: string) => {
    try {
      const res = await api.acceptDonation(id);
      setDonations(prev => prev.map(d => d.id === id ? res.donation : d));
      showToast('✅ Donation Accepted', 'Volunteer transportation dispatch initiated.');
    } catch (err: any) {
      alert(err.message || 'Failed to accept donation');
    }
  };

  const handleAssignVolunteer = async (id: string) => {
    try {
      const res = await api.assignVolunteer(id);
      setDonations(prev => prev.map(d => d.id === id ? res.donation : d));
      showToast('🚴 Mission Assigned', 'Pickup route activated. Proceed to restaurant.');
    } catch (err: any) {
      alert(err.message || 'Failed to assign volunteer');
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark text-slate-100 flex flex-col justify-between selection:bg-brand-emerald selection:text-white">
      
      {/* Navigation */}
      <Navbar
        currentUser={currentUser}
        activeView={activeView}
        onNavigate={setActiveView}
        onOpenAuth={(role) => {
          if (role) setAuthModalRole(role);
          setAuthModalOpen(true);
        }}
        onOpenDonate={() => {
          if (!currentUser) {
            setAuthModalRole('restaurant');
            setAuthModalOpen(true);
          } else {
            setDonateModalOpen(true);
          }
        }}
        onOpenNotifications={() => setNotifDrawerOpen(true)}
                onLogout={handleLogout}
        onSwitchRole={handleSwitchRole}
        notifications={notifications}
      />

      {/* Main Content Area */}
      <main className="flex-grow pt-20">
        
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 glass-panel p-4 rounded-2xl border-brand-emerald/40 shadow-2xl bg-slate-900/95 max-w-sm animate-in fade-in slide-in-from-bottom-5">
            <h4 className="text-xs font-bold text-white mb-0.5">{toastMessage.title}</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{toastMessage.body}</p>
          </div>
        )}

        {/* Dynamic Route View */}
        {activeView === 'landing' && (
          <LandingPage
            stats={impactStats}
            zones={heatmapZones}
            donations={donations}
            onOpenDonate={() => {
              if (!currentUser) {
                setAuthModalRole('restaurant');
                setAuthModalOpen(true);
              } else {
                setDonateModalOpen(true);
              }
            }}
            onExploreDonations={() => setActiveView('heatmap')}
            onSelectRole={(role) => {
              handleSwitchRole(role);
            }}
            onSelectDonation={(don) => {
              setTrackingDonationId(don.id);
              setTrackingModalOpen(true);
            }}
          />
        )}

        {activeView === 'heatmap' && (
          <div className="pt-6">
            <FoodRescueHeatmap
              zones={heatmapZones}
              donations={donations}
              onSelectDonation={(don) => {
                setTrackingDonationId(don.id);
                setTrackingModalOpen(true);
              }}
            />
          </div>
        )}

        {activeView === 'forecast' && (
          <div className="pt-6">
            <AIDemandForecast />
          </div>
        )}

        {activeView === 'impact' && (
          <div className="pt-6">
            <LiveImpactCounter stats={impactStats} />
          </div>
        )}

        {activeView === 'dashboard-restaurant' && currentUser && (
          <RestaurantDashboard
            user={currentUser}
            donations={donations}
            onOpenDonate={() => setDonateModalOpen(true)}
            onOpenTracking={(id) => {
              setTrackingDonationId(id);
              setTrackingModalOpen(true);
            }}
            onDonationDeleted={(id) => {
              setDonations(prev => prev.filter(d => d.id !== id));
              showToast('🗑️ Post Deleted', 'The donation post has been permanently removed.');
            }}
          />
        )}

        {activeView === 'dashboard-ngo' && currentUser && (
          <NGODashboard
            user={currentUser}
            donations={donations}
            onAcceptDonation={handleAcceptDonation}
            onOpenTracking={(id) => {
              setTrackingDonationId(id);
              setTrackingModalOpen(true);
            }}
            onSelectDonation={(don) => {
              setTrackingDonationId(don.id);
              setTrackingModalOpen(true);
            }}
          />
        )}

        {activeView === 'dashboard-volunteer' && currentUser && (
          <VolunteerDashboard
            user={currentUser}
            donations={donations}
            onAssignVolunteer={handleAssignVolunteer}
            onOpenTracking={(id) => {
              setTrackingDonationId(id);
              setTrackingModalOpen(true);
            }}
          />
        )}

        {activeView === 'dashboard-admin' && currentUser && (
          <AdminDashboard
            donations={donations}
            onOpenTracking={(id) => {
              setTrackingDonationId(id);
              setTrackingModalOpen(true);
            }}
          />
        )}

      </main>

      {/* Footer */}
      <Footer
        onNavigate={setActiveView}
        onOpenDonate={() => {
          if (!currentUser) {
            setAuthModalRole('restaurant');
            setAuthModalOpen(true);
          } else {
            setDonateModalOpen(true);
          }
        }}
      />

      {/* Global Modals */}
      <DonationWizardModal
        isOpen={donateModalOpen}
        onClose={() => setDonateModalOpen(false)}
        onSuccess={(newDon) => {
          setDonations(prev => [newDon, ...prev]);
          showToast('🍲 Donation Published!', `${newDon.mealCount} meals are now discoverable by nearby NGOs.`);
          confetti({ particleCount: 70, spread: 60 });
        }}
      />

      <LiveTrackingModal
        isOpen={trackingModalOpen}
        onClose={() => setTrackingModalOpen(false)}
        donationId={trackingDonationId}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialRole={authModalRole}
        onSuccess={(user) => {
          setCurrentUser(user);
          setActiveView(`dashboard-${user.role}`);
          showToast('Welcome!', `Logged in as ${user.name}`);
        }}
      />

      <NotificationDrawer
        isOpen={notifDrawerOpen}
        onClose={() => setNotifDrawerOpen(false)}
        notifications={notifications}
        onMarkRead={(id) => {
          api.markNotificationRead(id).catch(console.error);
          setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        }}
        onNotificationClick={(link) => {
          setNotifDrawerOpen(false);
          if (link) {
            if (link.includes('restaurant')) setActiveView('dashboard-restaurant');
            else if (link.includes('ngo')) setActiveView('dashboard-ngo');
            else if (link.includes('volunteer')) setActiveView('dashboard-volunteer');
            else if (link.includes('admin')) setActiveView('dashboard-admin');
          }
        }}
      />

      
    </div>
  );
}

export default App;
