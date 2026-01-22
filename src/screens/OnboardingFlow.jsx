import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import circlesApi from '../services/circlesApi';
import PhoneInput from '../components/auth/PhoneInput';
import OTPInput from '../components/auth/OTPInput';

const STEPS = {
  PHONE: 'phone',
  OTP: 'otp',
  HOUSEHOLD: 'household',
  MEMBERS: 'members',
  FRIENDS: 'friends',
  CIRCLES: 'circles',
  ASSIGN: 'assign',
  COMPLETE: 'complete'
};

const CIRCLE_COLORS = [
  '#9CAF88', '#E57373', '#64B5F6', '#FFB74D', '#BA68C8',
  '#4DB6AC', '#FF8A65', '#7986CB', '#F06292', '#4DD0E1'
];

const AVATARS = ['👨', '👩', '👦', '👧', '🧒', '👶', '🐕', '🐈', '🏠'];

export default function OnboardingFlow() {
  const { requestOtp, verifyOtp, createHousehold, user } = useAuth();
  const { addContact, addCircle, refresh } = useData();

  const [step, setStep] = useState(user ? STEPS.HOUSEHOLD : STEPS.PHONE);
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [householdName, setHouseholdName] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [members, setMembers] = useState([
    { name: '', role: 'adult', avatar: '👨' }
  ]);
  // Friends added during onboarding
  const [friends, setFriends] = useState([]);
  const [newFriendName, setNewFriendName] = useState('');
  // Circles created during onboarding
  const [userCircles, setUserCircles] = useState([]);
  const [newCircleName, setNewCircleName] = useState('');
  const [newCircleColor, setNewCircleColor] = useState(CIRCLE_COLORS[0]);
  // Circle assignments
  const [assignments, setAssignments] = useState({}); // { friendId: [circleId, ...] }

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
    setMembers(prev => [...prev, { name: '', role: 'adult', avatar: '👨' }]);
  }, []);

  const handleRemoveMember = useCallback((index) => {
    setMembers(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpdateMember = useCallback((index, field, value) => {
    setMembers(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  }, []);

  // Create household and move to friends step
  const handleCreateHousehold = useCallback(async () => {
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
        zipCode: zipCode.trim() || undefined,
        members: validMembers
      });
      setStep(STEPS.FRIENDS);
    } catch (err) {
      setError(err.message || 'Failed to create household');
    } finally {
      setIsLoading(false);
    }
  }, [householdName, zipCode, members, createHousehold]);

  // Friends step handlers
  const handleAddFriend = useCallback(async () => {
    if (!newFriendName.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      const friend = await addContact({ name: newFriendName.trim() });
      setFriends(prev => [...prev, friend]);
      setNewFriendName('');
    } catch (err) {
      setError(err.message || 'Failed to add friend');
    } finally {
      setIsLoading(false);
    }
  }, [newFriendName, addContact]);

  const handleFriendsNext = useCallback(() => {
    if (friends.length === 0) {
      // Allow skipping
      setStep(STEPS.CIRCLES);
      return;
    }
    setStep(STEPS.CIRCLES);
  }, [friends]);

  // Circles step handlers
  const handleAddCircle = useCallback(async () => {
    if (!newCircleName.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      const circle = await addCircle({ name: newCircleName.trim(), color: newCircleColor });
      setUserCircles(prev => [...prev, circle]);
      setNewCircleName('');
      // Pick next color
      const usedColors = [...userCircles, circle].map(c => c.color);
      const nextColor = CIRCLE_COLORS.find(c => !usedColors.includes(c)) || CIRCLE_COLORS[0];
      setNewCircleColor(nextColor);
    } catch (err) {
      setError(err.message || 'Failed to create circle');
    } finally {
      setIsLoading(false);
    }
  }, [newCircleName, newCircleColor, addCircle, userCircles]);

  const handleCirclesNext = useCallback(() => {
    if (userCircles.length === 0 || friends.length === 0) {
      // Skip assignment if no circles or no friends
      setStep(STEPS.COMPLETE);
      return;
    }
    setStep(STEPS.ASSIGN);
  }, [userCircles, friends]);

  // Assignment step handlers
  const toggleAssignment = useCallback((friendId, circleId) => {
    setAssignments(prev => {
      const current = prev[friendId] || [];
      const isAssigned = current.includes(circleId);
      return {
        ...prev,
        [friendId]: isAssigned
          ? current.filter(id => id !== circleId)
          : [...current, circleId]
      };
    });
  }, []);

  const handleComplete = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      // Save all circle assignments
      const assignmentPromises = [];
      for (const [friendId, circleIds] of Object.entries(assignments)) {
        for (const circleId of circleIds) {
          assignmentPromises.push(circlesApi.addMember(circleId, friendId));
        }
      }
      await Promise.all(assignmentPromises);

      setStep(STEPS.COMPLETE);
    } catch (err) {
      console.error('Failed to save assignments:', err);
      // Don't block completion on assignment errors
      setStep(STEPS.COMPLETE);
    } finally {
      setIsLoading(false);
    }
  }, [assignments]);

  // Handle entering the app
  const handleEnterApp = useCallback(() => {
    refresh(); // Refresh data context
    window.location.reload(); // Reload to get fresh state
  }, [refresh]);

  // Render steps
  if (step === STEPS.COMPLETE) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="text-center space-y-6 animate-fade-in max-w-sm">
          <div className="text-6xl">🎉</div>
          <h1 className="text-2xl font-bold text-white">You're all set!</h1>
          <p className="text-white/70">
            {friends.length > 0 && userCircles.length > 0
              ? `You've added ${friends.length} friend${friends.length !== 1 ? 's' : ''} and ${userCircles.length} circle${userCircles.length !== 1 ? 's' : ''}.`
              : friends.length > 0
              ? `You've added ${friends.length} friend${friends.length !== 1 ? 's' : ''}.`
              : userCircles.length > 0
              ? `You've created ${userCircles.length} circle${userCircles.length !== 1 ? 's' : ''}.`
              : 'Welcome to Circles! Add friends and create circles to get started.'
            }
          </p>
          <button
            onClick={handleEnterApp}
            className="w-full py-4 bg-[#9CAF88] text-white font-semibold rounded-xl hover:bg-[#8a9e77] transition-colors"
          >
            Enter Circles
          </button>
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
        <div className="flex gap-1 mb-8">
          {[STEPS.PHONE, STEPS.OTP, STEPS.HOUSEHOLD, STEPS.MEMBERS, STEPS.FRIENDS, STEPS.CIRCLES, STEPS.ASSIGN].map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= [STEPS.PHONE, STEPS.OTP, STEPS.HOUSEHOLD, STEPS.MEMBERS, STEPS.FRIENDS, STEPS.CIRCLES, STEPS.ASSIGN].indexOf(step)
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
            />

            <div>
              <label className="block text-sm text-white/70 mb-2">Zip code (for local offers & events)</label>
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="e.g., 12345"
                className="w-full px-4 py-3 bg-white/10 rounded-xl border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                inputMode="numeric"
                maxLength={5}
                onKeyDown={(e) => e.key === 'Enter' && handleHouseholdNext()}
              />
            </div>

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
              onClick={handleCreateHousehold}
              disabled={isLoading}
              className="w-full py-4 bg-[#9CAF88] text-white font-semibold rounded-xl hover:bg-[#8a9e77] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Continue'}
            </button>
          </div>
        )}

        {step === STEPS.FRIENDS && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Add your first friends</h1>
              <p className="text-white/70">Who do you hang out with? You can add more later.</p>
            </div>

            {/* Added friends list */}
            {friends.length > 0 && (
              <div className="space-y-2">
                {friends.map((friend, index) => (
                  <div
                    key={friend.id || index}
                    className="flex items-center gap-3 p-3 bg-white/10 rounded-xl"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#9CAF88] flex items-center justify-center text-white text-lg">
                      {(friend.displayName || friend.name)?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span className="text-white font-medium">{friend.displayName || friend.name}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Add friend input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newFriendName}
                onChange={(e) => setNewFriendName(e.target.value)}
                placeholder="e.g., The Smiths, Sarah + Kids"
                className="flex-1 px-4 py-3 bg-white/10 rounded-xl border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
              />
              <button
                onClick={handleAddFriend}
                disabled={isLoading || !newFriendName.trim()}
                className="px-4 py-3 bg-[#9CAF88] text-white font-semibold rounded-xl hover:bg-[#8a9e77] transition-colors disabled:opacity-50"
              >
                {isLoading ? '...' : 'Add'}
              </button>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="pt-4">
              <button
                onClick={handleFriendsNext}
                className="w-full py-4 bg-[#9CAF88] text-white font-semibold rounded-xl hover:bg-[#8a9e77] transition-colors"
              >
                {friends.length === 0 ? 'Skip for now' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {step === STEPS.CIRCLES && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Create your circles</h1>
              <p className="text-white/70">Circles help you organize friends into groups (school, sports, neighbors, etc.)</p>
            </div>

            {/* Created circles list */}
            {userCircles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {userCircles.map((circle, index) => (
                  <div
                    key={circle.id || index}
                    className="flex items-center gap-2 px-3 py-2 rounded-full"
                    style={{ backgroundColor: `${circle.color}30` }}
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: circle.color }}
                    />
                    <span style={{ color: circle.color }} className="font-medium">{circle.name}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Add circle input */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCircleName}
                  onChange={(e) => setNewCircleName(e.target.value)}
                  placeholder="e.g., School Friends, Soccer Parents"
                  className="flex-1 px-4 py-3 bg-white/10 rounded-xl border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCircle()}
                />
                <button
                  onClick={handleAddCircle}
                  disabled={isLoading || !newCircleName.trim()}
                  className="px-4 py-3 bg-[#9CAF88] text-white font-semibold rounded-xl hover:bg-[#8a9e77] transition-colors disabled:opacity-50"
                >
                  {isLoading ? '...' : 'Add'}
                </button>
              </div>

              {/* Color picker */}
              <div className="flex gap-2">
                {CIRCLE_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewCircleColor(color)}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      newCircleColor === color ? 'ring-2 ring-offset-2 ring-offset-slate-800 ring-white scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="pt-4">
              <button
                onClick={handleCirclesNext}
                className="w-full py-4 bg-[#9CAF88] text-white font-semibold rounded-xl hover:bg-[#8a9e77] transition-colors"
              >
                {userCircles.length === 0 ? 'Skip for now' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {step === STEPS.ASSIGN && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Add friends to circles</h1>
              <p className="text-white/70">Tap circles to assign each friend</p>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="p-4 bg-white/5 rounded-xl space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#9CAF88] flex items-center justify-center text-white text-lg">
                      {(friend.displayName || friend.name)?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span className="text-white font-medium">{friend.displayName || friend.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {userCircles.map((circle) => {
                      const isAssigned = (assignments[friend.id] || []).includes(circle.id);
                      return (
                        <button
                          key={circle.id}
                          onClick={() => toggleAssignment(friend.id, circle.id)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
                            isAssigned ? 'ring-2 ring-white' : 'opacity-60'
                          }`}
                          style={{ backgroundColor: `${circle.color}${isAssigned ? '60' : '30'}` }}
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: circle.color }}
                          />
                          <span style={{ color: isAssigned ? 'white' : circle.color }} className="text-sm font-medium">
                            {circle.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <button
                onClick={handleComplete}
                className="w-full py-4 bg-[#9CAF88] text-white font-semibold rounded-xl hover:bg-[#8a9e77] transition-colors"
              >
                Finish Setup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
