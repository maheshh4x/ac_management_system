'use client';

import React, { useState } from 'react';
import { useAuth, User } from '@/contexts/AuthContext';
import { ShieldCheck, Mail, Lock, LogIn, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const users: User[] = [
    { id: 'u1', name: 'Super Admin', email: 'admin@college.com', role: 'SUPER_ADMIN' },
    { id: 'u2', name: 'Facility Manager', email: 'manager@college.com', role: 'FACILITY_MANAGER' },
    { id: 'u3', name: 'Technician', email: 'technician@college.com', role: 'TECHNICIAN' },
    { id: 'u4', name: 'Viewer', email: 'viewer@college.com', role: 'VIEWER' }
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== 'Admin@123') {
      setError('Invalid email or password');
      return;
    }

    const foundUser = users.find(u => u.email === email);
    if (foundUser) {
      setIsSubmitting(true);
      login(foundUser);
    } else {
      setError('Invalid email or password');
    }
  };

  // Demo helper
  const populate = (u: User) => {
     setEmail(u.email);
     setPassword('Admin@123');
  }

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* Left side: Beautiful image and branding overlay */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="https://commons.wikimedia.org/wiki/Special:FilePath/NITTTR_Chennai-02.jpg"
          alt="NITTTR Chennai Campus"
        />
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/60 to-slate-900/30 mix-blend-multiply" />
        
        <div className="absolute bottom-0 left-0 p-16 text-white max-w-2xl">
          <div className="mb-6 flex gap-3 items-center">
            <div className="p-2.5 bg-blue-600/20 backdrop-blur-md rounded-xl border border-blue-400/30">
              <ShieldCheck size={32} className="text-blue-400" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">NITTTR Chennai</h1>
          </div>
          <p className="text-4xl font-bold leading-tight mb-4 text-white">
            Smart Campus Asset & Command Center
          </p>
          <p className="text-lg text-slate-200">
             Welcome to the National Institute of Technical Teachers Training and Research unified command interface. Manage facilities, track maintenance, and oversee equipment with real-time intelligence.
          </p>
        </div>
      </div>

      {/* Right side: Login form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          
          <div className="lg:hidden mb-10 flex flex-col items-center">
             <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm mb-4">
               <ShieldCheck size={32} />
             </div>
             <h2 className="text-2xl font-bold tracking-tight text-slate-900">NITTTR Command Center</h2>
          </div>

          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Sign in
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Please enter your credentials to access your dashboard.
            </p>
          </div>

          <div className="mt-8">
            <div className="mt-6">
              <form onSubmit={handleLogin} className="space-y-6">
                {error && (
                  <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-200 text-center font-medium shadow-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">
                    Email address
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="block w-full rounded-xl border-0 py-2.5 pl-11 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm bg-slate-50 focus:bg-white transition-all shadow-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-900 mb-1">
                    Password
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full rounded-xl border-0 py-2.5 pl-11 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm bg-slate-50 focus:bg-white transition-all shadow-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full justify-center items-center rounded-xl bg-blue-600 px-3 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-700 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <LogIn className="w-5 h-5 mr-2" />}
                    {isSubmitting ? 'Opening dashboard...' : 'Sign in to Dashboard'}
                  </button>
                </div>
              </form>

              <div className="mt-10">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-4 text-slate-500 font-medium">Fast-track Demo Logins</span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  {users.map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => populate(u)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:ring-blue-200 focus-visible:ring-transparent truncate transition-all"
                    >
                      {u.role.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
