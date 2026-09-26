"use client";

import { useState, useEffect } from 'react';
import { User, Shield, Bell, Save } from 'lucide-react';
import { useUserStore } from '../../store/userStore';

export default function ProfilePage() {
  const user = useUserStore((state) => state.user);

  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    notifications: true,
    dataSharing: false,
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.displayName || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : e.target.value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save profile
    console.log('Profile saved:', formData);
  };

  return (
    <div className="pb-12 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#15171A] flex items-center gap-3">
          <User className="text-[#1677FF]" size={28} />
          My Profile
        </h1>
        <p className="text-[#69707A] mt-2 max-w-xl">
          Manage your personal information and preferences.
        </p>
      </header>

      <div className="bg-white rounded-[28px] p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#E5E8EC] max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          <section>
            <h2 className="text-lg font-bold text-[#15171A] mb-6 flex items-center gap-2">
              <User className="text-[#1677FF]" size={20} />
              Personal Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#15171A] mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  className="w-full bg-[#F4F5F7] border border-[#E5E8EC] rounded-2xl py-3 px-4 text-[#15171A] focus:outline-none focus:ring-2 focus:ring-[#EAF3FF] focus:border-[#1677FF] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#15171A] mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="w-full bg-[#F4F5F7] border border-[#E5E8EC] rounded-2xl py-3 px-4 text-[#15171A] focus:outline-none focus:ring-2 focus:ring-[#EAF3FF] focus:border-[#1677FF] transition-all"
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#15171A] mb-6 flex items-center gap-2">
              <Bell className="text-[#1677FF]" size={20} />
              Preferences
            </h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-[#F4F5F7] rounded-2xl border border-[#E5E8EC] cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#1677FF] border border-[#E5E8EC]">
                    <Bell size={20} />
                  </div>
                  <div>
                    <span className="block font-medium text-[#15171A]">Email Notifications</span>
                    <span className="block text-sm text-[#69707A]">Receive analysis summaries and tips</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  name="notifications"
                  checked={formData.notifications}
                  onChange={handleChange}
                  className="w-5 h-5 text-[#1677FF] border-[#E5E8EC] rounded focus:ring-[#EAF3FF]"
                />
              </label>
              <label className="flex items-center justify-between p-4 bg-[#F4F5F7] rounded-2xl border border-[#E5E8EC] cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#1677FF] border border-[#E5E8EC]">
                    <Shield size={20} />
                  </div>
                  <div>
                    <span className="block font-medium text-[#15171A]">Anonymous Data Sharing</span>
                    <span className="block text-sm text-[#69707A]">Help improve the system (no personal data)</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  name="dataSharing"
                  checked={formData.dataSharing}
                  onChange={handleChange}
                  className="w-5 h-5 text-[#1677FF] border-[#E5E8EC] rounded focus:ring-[#EAF3FF]"
                />
              </label>
            </div>
          </section>

          <button
            type="submit"
            className="w-full py-4 bg-[#1677FF] text-white font-bold rounded-2xl hover:bg-[#155ACC] transition-all flex items-center justify-center gap-2"
          >
            <Save size={18} />
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}