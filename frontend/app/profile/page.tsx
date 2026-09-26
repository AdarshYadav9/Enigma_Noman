"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Shield, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { getProfile, createProfile, updateProfile } from '../../services/api';
import AllergyInput from '../../components/AllergyInput';
import RestrictionInput from '../../components/RestrictionInput';
import ProfileCompletionCard from '../../components/ProfileCompletionCard';
import { UserHealthProfile, Condition } from '../../types';

const COMMON_CONDITIONS: { id: Condition; label: string; desc: string }[] = [
  { id: "diabetes", label: "Diabetes / Blood Sugar", desc: "Monitors simple carbohydrates and sugars" },
  { id: "hypertension", label: "Hypertension / High BP", desc: "Monitors sodium & processed salt content" },
  { id: "ckd", label: "Chronic Kidney Disease", desc: "Monitors potassium, phosphorus & excessive protein" },
  { id: "pcos", label: "PCOS / Hormonal Risk", desc: "Monitors inflammatory oils, refined flour & sugar" }
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, setProfile } = useUserStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<UserHealthProfile>({
    age: null,
    height_cm: null,
    allergies: [],
    conditions: [],
    diseases: [],
    health_issues: [],
    dietary_restrictions: [],
    health_restrictions: [],
    doctor_advised_restrictions: []
  });

  // Load existing profile from backend
  useEffect(() => {
    async function loadData() {
      if (!user) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const data = await getProfile();
        if (data) {
          setFormData({
            age: data.age ?? null,
            height_cm: data.height_cm ?? null,
            allergies: data.allergies || [],
            conditions: data.conditions || [],
            diseases: data.diseases || [],
            health_issues: data.health_issues || [],
            dietary_restrictions: data.dietary_restrictions || [],
            health_restrictions: data.health_restrictions || [],
            doctor_advised_restrictions: data.doctor_advised_restrictions || []
          });
          setProfile(data);
        }
      } catch (err: any) {
        // If 404, profile not created yet, which is expected for new users
        console.log("No profile found or error fetching profile:", err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [user, setProfile]);

  const handleConditionToggle = (condId: string) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.includes(condId)
        ? prev.conditions.filter(c => c !== condId)
        : [...prev.conditions, condId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Frontend Range Validations matching backend constraints
    if (formData.age !== null && formData.age !== undefined) {
      if (formData.age < 0 || formData.age > 120) {
        setErrorMessage("Age must be between 0 and 120 years.");
        return;
      }
    }

    if (formData.height_cm !== null && formData.height_cm !== undefined) {
      if (formData.height_cm < 50 || formData.height_cm > 250) {
        setErrorMessage("Height must be between 50 cm and 250 cm.");
        return;
      }
    }

    try {
      setIsSaving(true);
      const saved = profile
        ? await updateProfile(formData)
        : await createProfile(formData);

      setProfile(saved);
      setSuccessMessage("Health profile saved successfully! Personalized alerts are now active.");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error("Profile save error:", err);
      setErrorMessage(err.message || "Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="animate-spin text-[#1677FF] mx-auto mb-3" size={32} />
        <p className="text-sm font-semibold text-[#69707A]">Loading your health profile...</p>
      </div>
    );
  }

  return (
    <div className="pb-16 animate-in fade-in duration-500 max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#15171A] flex items-center gap-3">
            <User className="text-[#1677FF]" size={28} />
            Personal Health Profile
          </h1>
          <p className="text-sm text-[#69707A] mt-1.5 leading-relaxed">
            Configure your medical conditions, verified allergens, and dietary constraints for personalized food risk analysis.
          </p>
        </div>
      </header>

      {/* Profile Completion Indicator */}
      <ProfileCompletionCard profile={formData} />

      {/* Feedback Messages */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-[#F6FFED] border border-[#52C41A]/30 text-sm text-[#52C41A] flex items-center gap-2.5 animate-in fade-in shadow-sm font-semibold">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-[#FFF1F0] border border-[#FF4D4F]/30 text-sm text-[#FF4D4F] flex items-center gap-2.5 animate-in fade-in shadow-sm font-semibold">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* 1. Basic Metrics */}
        <section className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#E5E8EC] space-y-5">
          <h3 className="text-base font-bold text-[#15171A] pb-3 border-b border-[#E5E8EC]">
            Personal Metrics
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="profile-age" className="block text-xs font-bold text-[#15171A] uppercase tracking-wider mb-1.5">
                Age (Years)
              </label>
              <input
                id="profile-age"
                type="number"
                min={0}
                max={120}
                value={formData.age ?? ""}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  age: e.target.value === "" ? null : parseInt(e.target.value, 10)
                }))}
                placeholder="e.g. 28"
                className="w-full bg-[#F4F5F7] border border-[#E5E8EC] rounded-xl px-4 py-2.5 text-sm text-[#15171A] focus:outline-none focus:ring-2 focus:ring-[#1677FF]"
              />
              <span className="text-[11px] text-[#69707A] mt-1 block">Valid range: 0 – 120</span>
            </div>

            <div>
              <label htmlFor="profile-height" className="block text-xs font-bold text-[#15171A] uppercase tracking-wider mb-1.5">
                Height (cm)
              </label>
              <input
                id="profile-height"
                type="number"
                min={50}
                max={250}
                value={formData.height_cm ?? ""}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  height_cm: e.target.value === "" ? null : parseFloat(e.target.value)
                }))}
                placeholder="e.g. 172"
                className="w-full bg-[#F4F5F7] border border-[#E5E8EC] rounded-xl px-4 py-2.5 text-sm text-[#15171A] focus:outline-none focus:ring-2 focus:ring-[#1677FF]"
              />
              <span className="text-[11px] text-[#69707A] mt-1 block">Valid range: 50 – 250 cm</span>
            </div>
          </div>
        </section>

        {/* 2. Allergies Section */}
        <section className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#E5E8EC]">
          <AllergyInput
            allergies={formData.allergies}
            onChange={(allergies) => setFormData(prev => ({ ...prev, allergies }))}
          />
        </section>

        {/* 3. Health Conditions Section */}
        <section className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#E5E8EC] space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#15171A]">Health Conditions</h3>
            <p className="text-xs text-[#69707A] mt-0.5">
              Select any conditions to evaluate food ingredients against medical risk rules.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {COMMON_CONDITIONS.map((cond) => {
              const isChecked = formData.conditions.includes(cond.id);
              return (
                <button
                  key={cond.id}
                  type="button"
                  onClick={() => handleConditionToggle(cond.id)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    isChecked
                      ? "border-[#1677FF] bg-[#E6F4FF]/40 ring-1 ring-[#1677FF]"
                      : "bg-[#F4F5F7]/60 border-[#E5E8EC] hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-[#15171A]">{cond.label}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="rounded text-[#1677FF] pointer-events-none"
                    />
                  </div>
                  <p className="text-xs text-[#69707A] leading-relaxed">{cond.desc}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. Diagnosed Diseases & Specific Issues */}
        <section className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#E5E8EC] space-y-6">
          <RestrictionInput
            label="Diagnosed Diseases"
            description="Enter specific physician-diagnosed conditions (e.g. Celiac disease, Crohn's, Fatty liver)"
            items={formData.diseases}
            placeholder="Type disease name and press enter..."
            badgeColor="purple"
            onChange={(diseases) => setFormData(prev => ({ ...prev, diseases }))}
          />

          <div className="pt-4 border-t border-[#E5E8EC]">
            <RestrictionInput
              label="Other Health Issues & Symptoms"
              description="Symptoms or sensitivities you are managing (e.g. Acid reflux, High uric acid)"
              items={formData.health_issues}
              placeholder="Type issue and press enter..."
              badgeColor="blue"
              onChange={(health_issues) => setFormData(prev => ({ ...prev, health_issues }))}
            />
          </div>
        </section>

        {/* 5. Dietary & Health Restrictions */}
        <section className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#E5E8EC] space-y-6">
          <RestrictionInput
            label="Dietary Restrictions"
            description="Lifestyle dietary choices that our engine will verify against recipes"
            items={formData.dietary_restrictions}
            suggestions={["Vegetarian", "Vegan", "Gluten-Free", "Lactose-Free", "Jain", "Halal", "Kosher"]}
            badgeColor="green"
            onChange={(dietary_restrictions) => setFormData(prev => ({ ...prev, dietary_restrictions }))}
          />

          <div className="pt-4 border-t border-[#E5E8EC]">
            <RestrictionInput
              label="Health Restrictions"
              description="Target constraints (e.g. Low sodium, Low sugar, Low saturated fat)"
              items={formData.health_restrictions}
              suggestions={["Low sodium", "Low sugar", "Low carb", "Low saturated fat", "High fiber"]}
              badgeColor="blue"
              onChange={(health_restrictions) => setFormData(prev => ({ ...prev, health_restrictions }))}
            />
          </div>
        </section>

        {/* 6. Doctor-Advised Restrictions */}
        <section className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#1677FF]/20 bg-gradient-to-br from-white to-blue-50/20">
          <RestrictionInput
            label="Doctor-Advised Specific Restrictions"
            description="Explicit dietary instructions given by your doctor (e.g. Avoid high sugar foods, Limit sodium, Avoid spicy foods)"
            items={formData.doctor_advised_restrictions}
            suggestions={["Avoid high sugar foods", "Limit sodium strictly", "Avoid deep-fried foods", "Avoid raw seafood"]}
            badgeColor="blue"
            onChange={(doctor_advised_restrictions) => setFormData(prev => ({ ...prev, doctor_advised_restrictions }))}
          />
        </section>

        {/* Save CTA */}
        <div className="flex items-center justify-end gap-4 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3.5 bg-[#1677FF] text-white font-bold text-sm rounded-full hover:bg-blue-600 transition-all shadow-md disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Health Profile</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}