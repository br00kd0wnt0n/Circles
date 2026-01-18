import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import PhoneInput from '../components/auth/PhoneInput';
import OTPInput from '../components/auth/OTPInput';

const STEPS = {
  PHONE: 'phone',
  OTP: 'otp',
  HOUSEHOLD: 'household',
  MEMBERS: 'members',
  COMPLETE: 'complete'
};

const AVATARS = ['👨', '👩', '👦', '👧', '🧒', '👶', '🐕', '🐈', '🏠'];

export default function OnboardingFlow() {
  const { requestOtp, verifyOtp, createHousehold, user, needsOnboarding } = useAuth();

  const [step, setStep] = useState(user ? STEPS.HOUSEHOLD : STEPS.PHONE);
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [householdName, setHouseholdName] = useState('');
  const [members, setMembers] = useState([
    { name: '', role: 'parent', avatar: '👨' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Phone step
  const handleRequestOtp = useCallback(async () => {
    if (phone.length < 11) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await requestOtp(phone);
      setStep(STEPS.OTP);
    } catch (err) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  }, [phone, requestOtp]);

  // OTP step
  const handleVerifyOtp = useCallback(async (code) => {
    setIsLoading(true);
    setError('');

    try {
      const result = await verifyOtp(phone, code);
      if (result.hasHousehold) {
        setStep(STEPS.COMPLETE);
      } else {
        setStep(STEPS.HOUSEHOLD);
      }
    } catch (err) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  }, [phone, verifyOtp]);

  // Household step
  const handleHouseholdNext = useCallback(() => {
    if (!householdName.trim()) {
      setError('Please enter a household name');
      return;
    }
    setError('');
    setStep(STEPS.MEMBERS);
  }, [householdName]);

  // Members step
  const handleAddMember = useCallback(() => {
    setMembers(prev => [...prev, { name: '', role: 'parent', avatar: '👨' }]);
  }, []);

  const handleRemoveMember = useCallback((index) => {
    setMembers(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpdateMember = useCallback((index, field, value) => {
    setMembers(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  }, []);

  const handleComplete = useCallback(async () => {
    const validMembers = members.filter(m => m.name.trim());
    if (validMembers.length === 0) {
      setError('Please add at least one household member');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await createHousehold({
        name: householdName.trim(),
        members: validMembers
      });
      setStep(STEPS.COMPLETE);
    } catch (err) {
      setError(err.message || 'Failed to create household');
    } finally {
      setIsLoading(false);
    }
  }, [householdName, members, createHousehold]);

  // Render steps
  if (step === STEPS.COMPLETE) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="text-6xl">🎉</div>
          <h1 className="text-2xl font-bold text-white">Welcome to Circles!</h1>
          <p className="text-white/70">Your household is all set up.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="p-6 pt-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#9CAF88] flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-white">Circles</span>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[STEPS.PHONE, STEPS.OTP, STEPS.HOUSEHOLD, STEPS.MEMBERS].map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= [STEPS.PHONE, STEPS.OTP, STEPS.HOUSEHOLD, STEPS.MEMBERS].indexOf(step)
                  ? 'bg-[#9CAF88]'
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-6">
        {step === STEPS.PHONE && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Enter your phone number</h1>
              <p className="text-white/70">We'll send you a code to verify it's you</p>
            </div>

            <PhoneInput
              value={phone}
              onChange={setPhone}
              onSubmit={handleRequestOtp}
              disabled={isLoading}
              error={error}
            />

            <button
              onClick={handleRequestOtp}
              disabled={isLoading || phone.length < 11}
              className="w-full py-4 bg-[#9CAF88] text-white font-semibold rounded-xl hover:bg-[#8a9e77] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending...' : 'Continue'}
            </button>
          </div>
        )}

        {step === STEPS.OTP && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Enter verification code</h1>
              <p className="text-white/70">We sent a 6-digit code to {phone}</p>
            </div>

            <OTPInput
              value={otpCode}
              onChange={setOtpCode}
              onComplete={handleVerifyOtp}
              disabled={isLoading}
              error={error}
            />

            <button
              onClick={() => setStep(STEPS.PHONE)}
              className="w-full py-2 text-white/70 hover:text-white transition-colors"
            >
              ← Use a different number
            </button>
          </div>
        )}

        {step === STEPS.HOUSEHOLD && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Name your household</h1>
              <p className="text-white/70">This is how friends will see you</p>
            </div>

            <input
              type="text"
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              placeholder="e.g., The Smiths"
              className="w-full px-4 py-3 bg-white/10 rounded-xl border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40"
              onKeyDown={(e) => e.key === 'Enter' && handleHouseholdNext()}
            />

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              onClick={handleHouseholdNext}
              disabled={!householdName.trim()}
              className="w-full py-4 bg-[#9CAF88] text-white font-semibold rounded-xl hover:bg-[#8a9e77] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}

        {step === STEPS.MEMBERS && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Who's in your household?</h1>
              <p className="text-white/70">Add family members, roommates, or pets</p>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {members.map((member, index) => (
                <div key={index} className="flex gap-3 items-start bg-white/5 p-3 rounded-xl">
                  {/* Avatar selector */}
                  <div className="relative group">
                    <button className="w-12 h-12 text-2xl bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                      {member.avatar}
                    </button>
                    <div className="absolute left-0 top-full mt-1 bg-slate-800 rounded-xl p-2 grid grid-cols-3 gap-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-lg border border-white/20">
                      {AVATARS.map((avatar) => (
                        <button
                          key={avatar}
                          onClick={() => handleUpdateMember(index, 'avatar', avatar)}
                          className="w-10 h-10 text-xl hover:bg-white/10 rounded-lg"
                        >
                          {avatar}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => handleUpdateMember(index, 'name', e.target.value)}
                      placeholder="Name"
                      className="w-full px-3 py-2 bg-white/10 rounded-lg border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40 text-sm"
                    />
                    <div className="flex gap-2">
                      {['adult', 'child', 'pet'].map((role) => (
                        <button
                          key={role}
                          onClick={() => handleUpdateMember(index, 'role', role)}
                          className={`px-3 py-1 rounded-full text-xs capitalize transition-colors ${
                            member.role === role
                              ? 'bg-[#9CAF88] text-white'
                              : 'bg-white/10 text-white/70 hover:bg-white/20'
                          }`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>

                  {members.length > 1 && (
                    <button
                      onClick={() => handleRemoveMember(index)}
                      className="p-2 text-white/50 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleAddMember}
              className="w-full py-3 border-2 border-dashed border-white/20 text-white/70 rounded-xl hover:border-white/40 hover:text-white transition-colors"
            >
              + Add another member
            </button>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              onClick={handleComplete}
              disabled={isLoading}
              className="w-full py-4 bg-[#9CAF88] text-white font-semibold rounded-xl hover:bg-[#8a9e77] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Complete Setup'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
