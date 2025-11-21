import React, { useState } from 'react';
import { login, register, requestPasswordReset } from '../services/db';
import { UserRole } from '../types';

interface AuthPageProps {
  onLoginSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.VOLUNTEER);
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isForgot) {
        if (!email) throw new Error('Please enter your email');
        await requestPasswordReset(email);
        setSuccessMsg('Password reset link has been sent to your email.');
        setLoading(false);
        return;
      }

      if (!email || !password) throw new Error('Please fill in all fields');

      if (isLogin) {
        await login(email, password);
      } else {
        if (!name) throw new Error('Name is required');
        if (password.length < 6) throw new Error('Password must be at least 6 characters');
        await register(name, email, password, role);
      }
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setError('');
    setSuccessMsg('');
    setEmail('');
    setPassword('');
    setName('');
    setIsForgot(false);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-sm bg-white p-8 sm:p-10 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
        <div className="text-center mb-8">
           <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-100 text-primary-600 rounded-2xl mb-4 shadow-inner">
              <span className="text-2xl font-bold">U</span>
           </div>
           <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
             {isForgot ? 'Reset Password' : (isLogin ? 'Welcome Back' : 'Join UMission')}
           </h1>
           <p className="text-slate-500 text-sm mt-2">
             {isForgot ? 'Enter your email to receive a reset link' : 'Connect with the campus community'}
           </p>
        </div>

        {successMsg ? (
          <div className="text-center space-y-6">
            <div className="bg-green-50 text-green-700 p-5 rounded-2xl text-sm font-medium border border-green-100">
              {successMsg}
            </div>
            <button
              onClick={() => { resetState(); setIsLogin(true); }}
              className="text-primary-600 hover:text-primary-700 text-sm font-bold hover:underline"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && <div className="text-red-600 text-xs text-center bg-red-50 p-3 rounded-xl border border-red-100">{error}</div>}

            {!isLogin && !isForgot && (
              <input
                type="text"
                required
                className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all text-sm outline-none"
                placeholder="Full Name / Club Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
            
            <input
              type="email"
              required
              className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all text-sm outline-none"
              placeholder={isLogin && !isForgot ? "Siswa Mail / Club Email" : "Email address"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {!isForgot && (
              <div className="space-y-2">
                <input
                  type="password"
                  required
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all text-sm outline-none"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {isLogin && (
                  <div className="text-right">
                    <button 
                      type="button"
                      onClick={() => { resetState(); setIsForgot(true); }}
                      className="text-xs font-medium text-primary-600 hover:text-primary-700"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
              </div>
            )}

            {!isLogin && !isForgot && (
               <div className="grid grid-cols-2 gap-3 bg-slate-50 p-1.5 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setRole(UserRole.VOLUNTEER)}
                    className={`h-9 text-xs font-bold rounded-lg transition-all ${role === UserRole.VOLUNTEER ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole(UserRole.ORGANIZER)}
                    className={`h-9 text-xs font-bold rounded-lg transition-all ${role === UserRole.ORGANIZER ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Club/Admin
                  </button>
               </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary-200 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:translate-y-0"
            >
              {loading ? 'Processing...' : (isForgot ? 'Send Reset Link' : (isLogin ? 'Access Campus Hub' : 'Create Account'))}
            </button>
          </form>
        )}

        {!successMsg && (
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400 mb-2">
                {isForgot ? "Remembered it?" : (isLogin ? "New to UMission?" : "Already have an ID?")}
            </p>
            <button 
              onClick={() => {
                  if (isForgot) {
                    resetState();
                    setIsLogin(true);
                  } else {
                    setIsLogin(!isLogin);
                    resetState();
                  }
              }} 
              className="text-sm font-bold text-slate-700 hover:text-primary-600 transition-colors"
            >
              {isForgot ? "Back to Login" : (isLogin ? "Create Student Account" : "Login Here")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};