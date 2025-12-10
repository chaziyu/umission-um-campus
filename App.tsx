import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { EventFeed } from './pages/EventFeed';
import { AuthPage } from './pages/AuthPage';
import { OrganizerDashboard } from './pages/OrganizerDashboard';
import { VolunteerDashboard } from './pages/VolunteerDashboard';
import { getCurrentUser, logout } from './services/db';
import { User, UserRole } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    const loggedInUser = getCurrentUser();
    if (loggedInUser) setUser(loggedInUser);
  }, []);

  const handleLoginSuccess = () => {
    const loggedInUser = getCurrentUser();
    setUser(loggedInUser);
    setCurrentPage('dashboard');
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setCurrentPage('home');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'auth':
        return <AuthPage onLoginSuccess={handleLoginSuccess} />;
      case 'dashboard':
        if (!user) return <AuthPage onLoginSuccess={handleLoginSuccess} />;
        return user.role === UserRole.ORGANIZER 
          ? <OrganizerDashboard user={user} /> 
          : <VolunteerDashboard user={user} />;
      case 'home':
      default:
        return <EventFeed user={user} onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans relative">
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        currentPage={currentPage} 
        onNavigate={setCurrentPage} 
      />
      
      <main>
        {renderPage()}
      </main>
      
      {/* Privacy Policy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowPrivacy(false)}>
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-slate-900">Privacy Policy</h2>
              <button onClick={() => setShowPrivacy(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500">✕</button>
            </div>
            <div className="text-sm text-slate-600 space-y-4 overflow-y-auto max-h-[60vh] pr-2">
              <p className="font-medium text-primary-600">Effective Date: 2025</p>
              <p>At UMission, we are committed to protecting the privacy of the Universiti Malaya community.</p>
              
              <h3 className="font-bold text-slate-800 mt-4">1. Data Collection</h3>
              <p>We collect limited personal information, including your Name, Siswa Mail/Email address, and profile picture, solely to facilitate volunteer coordination.</p>
              
              <h3 className="font-bold text-slate-800 mt-4">2. How We Use Your Data</h3>
              <p>Your information is used to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Verify your status as a UM student or staff.</li>
                <li>Connect you with Event Organizers (Residential Colleges, Clubs, etc.).</li>
                <li>Track your volunteer merit hours for university records.</li>
              </ul>

              <h3 className="font-bold text-slate-800 mt-4">3. Data Sharing</h3>
              <p>We do not sell your data. Your contact details are shared <strong>only</strong> with the specific Organizers of the events you choose to join.</p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
               <button onClick={() => setShowPrivacy(false)} className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors">Understood</button>
            </div>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      {showTerms && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowTerms(false)}>
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-slate-900">Terms of Service</h2>
              <button onClick={() => setShowTerms(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500">✕</button>
            </div>
            <div className="text-sm text-slate-600 space-y-4 overflow-y-auto max-h-[60vh] pr-2">
              <p>By using UMission, you agree to the following terms:</p>
              
              <h3 className="font-bold text-slate-800 mt-4">1. Eligibility</h3>
              <p>You must be a current student, staff member, or authorized affiliate of Universiti Malaya to use this platform.</p>
              
              <h3 className="font-bold text-slate-800 mt-4">2. Code of Conduct</h3>
              <p>Users must adhere to the <span className="italic">Universiti Malaya Student Code of Conduct (AUKU)</span>. Harassment, falsification of attendance, or inappropriate behavior during events will result in an immediate ban.</p>

              <h3 className="font-bold text-slate-800 mt-4">3. Voluntary Participation</h3>
              <p>Participation in events is strictly voluntary. UMission acts solely as a connecting platform and is not liable for any injuries, accidents, or disputes occurring during events.</p>

              <h3 className="font-bold text-slate-800 mt-4">4. Accuracy</h3>
              <p>Organizers must provide accurate details about event tasks and safety requirements. Volunteers must provide accurate personal details.</p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
               <button onClick={() => setShowTerms(false)} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">I Agree</button>
            </div>
          </div>
        </div>
      )}
      
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <button onClick={() => setShowPrivacy(true)} className="text-gray-400 hover:text-gray-500 text-sm">Privacy Policy</button>
            <button onClick={() => setShowTerms(true)} className="text-gray-400 hover:text-gray-500 text-sm">Terms of Service</button>
          </div>
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-base text-gray-400">
              &copy; 2025 UMission. All rights reserved.
            </p>
            <p className="text-center text-xs text-gray-300 mt-2">
               Supporting UN SDG 11: Sustainable Cities and Communities
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
