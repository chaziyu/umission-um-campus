import React, { useState } from 'react';
import { User, UserRole } from '../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, currentPage, onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNav = (page: string) => {
    onNavigate(page);
    setIsMenuOpen(false);
  };

  const navLinkClass = (page: string) => 
    `block w-full text-left px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
      currentPage === page 
        ? 'bg-primary-50 text-primary-700' 
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
    }`;

  const desktopLinkClass = (page: string) => 
    `px-5 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
      currentPage === page 
        ? 'bg-primary-50 text-primary-700' 
        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
    }`;

  return (
    <nav className="bg-white/90 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo */}
          <div className="flex items-center gap-8">
            <div className="flex-shrink-0 flex items-center cursor-pointer group" onClick={() => handleNav('home')}>
              <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center mr-2.5 shadow-lg shadow-primary-200/50 transition-transform group-hover:scale-105">
                 <span className="text-white font-bold text-xl">U</span>
              </div>
              <span className="font-bold text-xl text-gray-900 tracking-tight">UMission</span>
            </div>
            
            {/* Desktop Nav */}
            {user && (
              <div className="hidden md:flex space-x-2">
                <button onClick={() => handleNav('home')} className={desktopLinkClass('home')}>
                  Browse
                </button>
                <button onClick={() => handleNav('dashboard')} className={desktopLinkClass('dashboard')}>
                  {user.role === UserRole.ORGANIZER ? 'Dashboard' : 'My Impact'}
                </button>
              </div>
            )}
          </div>

          {/* Desktop User Profile */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-semibold text-gray-900 leading-none mb-1">{user.name}</span>
                  <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{user.role}</span>
                </div>
                <img className="h-10 w-10 rounded-full bg-gray-100 ring-2 ring-white shadow-sm object-cover" src={user.avatar} alt="" />
                <button 
                  onClick={onLogout}
                  className="ml-2 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="Logout"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex space-x-3">
                <button onClick={() => handleNav('auth')} className="text-gray-600 hover:text-gray-900 font-medium text-sm px-4 py-2">Log in</button>
                <button onClick={() => handleNav('auth')} className="bg-primary-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-primary-700 shadow-md shadow-primary-200 transition-all hover:shadow-lg hover:-translate-y-0.5">Sign up</button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none"
            >
              {isMenuOpen ? (
                 <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
              ) : (
                 <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                 </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 shadow-lg animate-fade-in-down">
          <div className="px-4 pt-2 pb-4 space-y-1">
            {user ? (
              <>
                <div className="flex items-center gap-3 p-3 mb-3 bg-gray-50 rounded-xl">
                  <img className="h-10 w-10 rounded-full object-cover" src={user.avatar} alt="" />
                  <div>
                    <p className="font-bold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500 uppercase">{user.role}</p>
                  </div>
                </div>
                <button onClick={() => handleNav('home')} className={navLinkClass('home')}>Browse Events</button>
                <button onClick={() => handleNav('dashboard')} className={navLinkClass('dashboard')}>
                   {user.role === UserRole.ORGANIZER ? 'Organizer Dashboard' : 'My Profile & Impact'}
                </button>
                <div className="h-px bg-gray-100 my-2"></div>
                <button 
                  onClick={() => { onLogout(); setIsMenuOpen(false); }}
                  className="block w-full text-left px-4 py-3 text-red-600 font-medium hover:bg-red-50 rounded-lg"
                >
                  Log Out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 p-2">
                <button onClick={() => handleNav('auth')} className="w-full py-3 text-center text-gray-700 font-medium bg-gray-50 rounded-xl">Log in</button>
                <button onClick={() => handleNav('auth')} className="w-full py-3 text-center text-white font-bold bg-primary-600 rounded-xl shadow-lg shadow-primary-200">Sign up</button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};