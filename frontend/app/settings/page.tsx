"use client";

import { useState } from 'react';
import { Settings, Palette, Bell, Shield, Trash2, Download } from 'lucide-react';

export default function SettingsPage() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [notifications, setNotifications] = useState(true);
  const [dataRetention, setDataRetention] = useState<'30' | '90' | '365'>('90');

  return (
    <div className="pb-12 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#15171A] flex items-center gap-3">
          <Settings className="text-[#1677FF]" size={28} />
          Settings
        </h1>
        <p className="text-[#69707A] mt-2 max-w-xl">
          Configure your preferences and manage your data.
        </p>
      </header>

      <div className="space-y-6 max-w-2xl">
        {/* Appearance */}
        <section className="bg-white rounded-[28px] p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#E5E8EC]">
          <h2 className="text-lg font-bold text-[#15171A] mb-6 flex items-center gap-2">
            <Palette className="text-[#1677FF]" size={20} />
            Appearance
          </h2>
          <div className="space-y-4">
            <label className="block">
              <span className="block text-sm font-medium text-[#15171A] mb-2">Theme</span>
              <div className="grid grid-cols-3 gap-3">
                {(['light', 'dark', 'system'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTheme(t)}
                    className={`p-4 rounded-2xl border-2 transition-all text-left ${
                      theme === t
                        ? 'border-[#1677FF] bg-[#EAF3FF]'
                        : 'border-[#E5E8EC] hover:border-[#1677FF]'
                    }`}
                  >
                    <span className="capitalize font-medium text-[#15171A]">{t}</span>
                    <span className="block text-xs text-[#69707A] mt-1">
                      {t === 'light' ? 'Always light' : t === 'dark' ? 'Always dark' : 'Match system'}
                    </span>
                  </button>
                ))}
              </div>
            </label>
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-white rounded-[28px] p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#E5E8EC]">
          <h2 className="text-lg font-bold text-[#15171A] mb-6 flex items-center gap-2">
            <Bell className="text-[#1677FF]" size={20} />
            Notifications
          </h2>
          <label className="flex items-center justify-between p-4 bg-[#F4F5F7] rounded-2xl border border-[#E5E8EC] cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#1677FF] border border-[#E5E8EC]">
                <Bell size={20} />
              </div>
              <div>
                <span className="block font-medium text-[#15171A]">Push Notifications</span>
                <span className="block text-sm text-[#69707A]">Receive alerts for high-risk foods</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
              className="w-5 h-5 text-[#1677FF] border-[#E5E8EC] rounded focus:ring-[#EAF3FF]"
            />
          </label>
        </section>

        {/* Privacy & Data */}
        <section className="bg-white rounded-[28px] p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#E5E8EC]">
          <h2 className="text-lg font-bold text-[#15171A] mb-6 flex items-center gap-2">
            <Shield className="text-[#1677FF]" size={20} />
            Privacy & Data
          </h2>
          <div className="space-y-4">
            <div>
              <span className="block text-sm font-medium text-[#15171A] mb-2">Data Retention</span>
              <select
                value={dataRetention}
                onChange={(e) => setDataRetention(e.target.value as typeof dataRetention)}
                className="w-full bg-[#F4F5F7] border border-[#E5E8EC] rounded-2xl py-3 px-4 text-[#15171A] focus:outline-none focus:ring-2 focus:ring-[#EAF3FF] focus:border-[#1677FF] transition-all"
              >
                <option value="30">30 Days</option>
                <option value="90">90 Days</option>
                <option value="365">1 Year</option>
              </select>
            </div>
            <div className="flex gap-4">
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-[#E5E8EC] rounded-2xl text-[#15171A] hover:border-[#1677FF] hover:text-[#1677FF] transition-all">
                <Download size={18} />
                Export Data
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-[#FF4D4F]/30 rounded-2xl text-[#FF4D4F] hover:bg-[#FFF1F0] hover:border-[#FF4D4F] transition-all">
                <Trash2 size={18} />
                Delete Account
              </button>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="bg-white rounded-[28px] p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#E5E8EC]">
          <h2 className="text-lg font-bold text-[#15171A] mb-4">About</h2>
          <div className="text-sm text-[#69707A] space-y-2">
            <p><span className="font-medium text-[#15171A]">Version:</span> 1.0.0</p>
            <p><span className="font-medium text-[#15171A]">Build:</span> PS1 - Dietary Risk Alert System</p>
            <p className="pt-2 border-t border-[#E5E8EC]">
              This system provides dietary decision support based on ingredient analysis.
              It is not a substitute for professional medical advice.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}