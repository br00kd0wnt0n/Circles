import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, User, Users, Bell, Palette, HelpCircle, LogOut, Contact, CircleDot, Trash2, FlaskConical, UserPlus } from 'lucide-react';
import { Button } from '../ui/Button';
import { membersService, contactsService } from '../../services/supabaseService';
import { updateHousehold as supabaseUpdateHousehold } from '../../lib/supabase';

const isDev = import.meta.env.DEV;

const AVATARS = ['👨', '👩', '👦', '👧', '🧒', '👶', '🐕', '🐈', '🏠'];

export function SettingsScreen({ isOpen, onClose, household, onUpdateHousehold, onOpenContacts, onOpenCircles }) {
  const [editingName, setEditingName] = useState(false);
  const [householdName, setHouseholdName] = useState('');
  const [editingMember, setEditingMember] = useState(null);
  const [members, setMembers] = useState([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', role: 'adult', avatar: '👤' });
  const [isSaving, setIsSaving] = useState(false);
  const [testFriendsStatus, setTestFriendsStatus] = useState(null);

  // Sync state when household changes
  useEffect(() => {
    if (household) {
      setHouseholdName(household.householdName || household.name || '');
      setMembers(household.members || []);
    }
  }, [household]);

  const handleSaveName = async () => {
    if (!household || !householdName.trim()) return;
    setIsSaving(true);
    try {
      const updated = await supabaseUpdateHousehold({ name: householdName.trim() });
      onUpdateHousehold(updated);
      setEditingName(false);
    } catch (err) {
      console.error('Failed to update household name:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateMember = async (memberId, updates) => {
    // Update local state immediately
    const newMembers = members.map(m =>
      m.id === memberId ? { ...m, ...updates } : m
    );
    setMembers(newMembers);
  };

  const handleSaveMember = async (member) => {
    setIsSaving(true);
    try {
      await membersService.update(member.id, {
        name: member.name,
        role: member.role,
        avatar: member.avatar
      });
      setEditingMember(null);
    } catch (err) {
      console.error('Failed to update member:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMember = async () => {
    if (!newMember.name.trim()) return;
    setIsSaving(true);
    try {
      const added = await membersService.add({
        name: newMember.name.trim(),
        role: newMember.role,
        avatar: newMember.avatar
      });
      setMembers(prev => [...prev, added]);
      setNewMember({ name: '', role: 'adult', avatar: '👤' });
      setShowAddMember(false);
    } catch (err) {
      console.error('Failed to add member:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (members.length <= 1) {
      alert('You must have at least one household member');
      return;
    }
    if (!window.confirm('Remove this member from your household?')) return;

    setIsSaving(true);
    try {
      await membersService.delete(memberId);
      setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (err) {
      console.error('Failed to delete member:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAll = () => {
    onClose();
  };

  const handleCreateTestFriends = async () => {
    setTestFriendsStatus('creating');
    try {
      const result = await contactsService.createTestFriends();
      setTestFriendsStatus(`Created ${result.count} test friends!`);
      // Auto-clear status after 3 seconds
      setTimeout(() => setTestFriendsStatus(null), 3000);
    } catch (err) {
      console.error('Failed to create test friends:', err);
      setTestFriendsStatus('Failed to create test friends');
      setTimeout(() => setTestFriendsStatus(null), 3000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute inset-0 z-50 bg-[#FAF9F6] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100">
              <h2 className="text-lg font-semibold text-[#1F2937]">Settings</h2>
              <button
                onClick={handleSaveAll}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X size={20} className="text-[#6B7280]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Household Section */}
              <div className="p-4">
                <h3 className="text-sm font-medium text-[#6B7280] mb-3 uppercase tracking-wide">
                  Your Household
                </h3>
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  {/* Household Name */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#E8F0E3] flex items-center justify-center">
                          <Users size={20} className="text-[#9CAF88]" />
                        </div>
                        <div>
                          <p className="text-xs text-[#6B7280]">Household Name</p>
                          {editingName ? (
                            <input
                              type="text"
                              value={householdName}
                              onChange={(e) => setHouseholdName(e.target.value)}
                              onBlur={handleSaveName}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                              autoFocus
                              className="font-semibold text-[#1F2937] bg-transparent border-b-2 border-[#9CAF88] outline-none w-full"
                            />
                          ) : (
                            <p className="font-semibold text-[#1F2937]">{householdName}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setEditingName(!editingName)}
                        className="text-sm text-[#9CAF88] font-medium"
                      >
                        {editingName ? 'Done' : 'Edit'}
                      </button>
                    </div>
                  </div>

                  {/* Members */}
                  {members.map((member) => (
                    <div key={member.id} className="p-4 border-b border-gray-100 last:border-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#F4F4F5] flex items-center justify-center text-lg">
                            {member.avatar || '👤'}
                          </div>
                          <div>
                            {editingMember === member.id ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={member.name}
                                  onChange={(e) => handleUpdateMember(member.id, { name: e.target.value })}
                                  autoFocus
                                  className="font-medium text-[#1F2937] bg-transparent border-b-2 border-[#9CAF88] outline-none w-full"
                                />
                                <div className="flex gap-1">
                                  {['adult', 'child', 'pet'].map((role) => (
                                    <button
                                      key={role}
                                      onClick={() => handleUpdateMember(member.id, { role })}
                                      className={`px-2 py-0.5 rounded text-xs capitalize ${
                                        member.role === role
                                          ? 'bg-[#9CAF88] text-white'
                                          : 'bg-gray-100 text-gray-600'
                                      }`}
                                    >
                                      {role}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="font-medium text-[#1F2937]">{member.name}</p>
                                <p className="text-xs text-[#6B7280] capitalize">{member.role}</p>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (editingMember === member.id) {
                                handleSaveMember(member);
                              } else {
                                setEditingMember(member.id);
                              }
                            }}
                            disabled={isSaving}
                            className="text-sm text-[#9CAF88] font-medium disabled:opacity-50"
                          >
                            {editingMember === member.id ? (isSaving ? 'Saving...' : 'Save') : 'Edit'}
                          </button>
                          {members.length > 1 && (
                            <button
                              onClick={() => handleDeleteMember(member.id)}
                              disabled={isSaving}
                              className="p-1 text-red-400 hover:text-red-500 disabled:opacity-50"
                              title="Remove member"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add Member */}
                  {showAddMember ? (
                    <div className="p-4 border-t border-gray-100">
                      <div className="flex items-start gap-3">
                        <div className="relative group">
                          <button className="w-10 h-10 rounded-full bg-[#F4F4F5] flex items-center justify-center text-lg hover:bg-[#E8F0E3] transition-colors">
                            {newMember.avatar}
                          </button>
                          <div className="absolute left-0 top-full mt-1 bg-white rounded-xl p-2 grid grid-cols-3 gap-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-lg border border-gray-200">
                            {AVATARS.map((avatar) => (
                              <button
                                key={avatar}
                                onClick={() => setNewMember(prev => ({ ...prev, avatar }))}
                                className="w-8 h-8 text-lg hover:bg-gray-100 rounded-lg"
                              >
                                {avatar}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={newMember.name}
                            onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Name"
                            autoFocus
                            className="w-full px-2 py-1 border border-gray-200 rounded-lg text-[#1F2937] focus:border-[#9CAF88] outline-none"
                          />
                          <div className="flex gap-1">
                            {['adult', 'child', 'pet'].map((role) => (
                              <button
                                key={role}
                                onClick={() => setNewMember(prev => ({ ...prev, role }))}
                                className={`px-2 py-0.5 rounded text-xs capitalize ${
                                  newMember.role === role
                                    ? 'bg-[#9CAF88] text-white'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {role}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => {
                                setShowAddMember(false);
                                setNewMember({ name: '', role: 'adult', avatar: '👤' });
                              }}
                              className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleAddMember}
                              disabled={!newMember.name.trim() || isSaving}
                              className="px-3 py-1 text-sm bg-[#9CAF88] text-white rounded-lg disabled:opacity-50"
                            >
                              {isSaving ? 'Adding...' : 'Add'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddMember(true)}
                      className="w-full p-4 text-left flex items-center gap-3 text-[#9CAF88] hover:bg-gray-50"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#E8F0E3] flex items-center justify-center">
                        <span className="text-lg">+</span>
                      </div>
                      <span className="font-medium">Add Family Member</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Manage Section */}
              <div className="p-4">
                <h3 className="text-sm font-medium text-[#6B7280] mb-3 uppercase tracking-wide">
                  Manage
                </h3>
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <button
                    onClick={onOpenContacts}
                    className="w-full p-4 flex items-center justify-between border-b border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <Contact size={20} className="text-[#9CAF88]" />
                      <span className="text-[#1F2937]">Contacts</span>
                    </div>
                    <ChevronRight size={20} className="text-[#6B7280]" />
                  </button>
                  <button
                    onClick={onOpenCircles}
                    className="w-full p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <CircleDot size={20} className="text-[#9CAF88]" />
                      <span className="text-[#1F2937]">My Circles</span>
                    </div>
                    <ChevronRight size={20} className="text-[#6B7280]" />
                  </button>
                </div>
              </div>

              {/* Other Settings */}
              <div className="p-4">
                <h3 className="text-sm font-medium text-[#6B7280] mb-3 uppercase tracking-wide">
                  Preferences
                </h3>
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <button className="w-full p-4 flex items-center justify-between border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <Bell size={20} className="text-[#6B7280]" />
                      <span className="text-[#1F2937]">Notifications</span>
                    </div>
                    <ChevronRight size={20} className="text-[#6B7280]" />
                  </button>
                  <button className="w-full p-4 flex items-center justify-between border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <Palette size={20} className="text-[#6B7280]" />
                      <span className="text-[#1F2937]">Appearance</span>
                    </div>
                    <ChevronRight size={20} className="text-[#6B7280]" />
                  </button>
                  <button className="w-full p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <HelpCircle size={20} className="text-[#6B7280]" />
                      <span className="text-[#1F2937]">Help & Support</span>
                    </div>
                    <ChevronRight size={20} className="text-[#6B7280]" />
                  </button>
                </div>
              </div>

              {/* Developer Tools - only in dev mode */}
              {isDev && (
                <div className="p-4">
                  <h3 className="text-sm font-medium text-[#6B7280] mb-3 uppercase tracking-wide">
                    Developer Tools
                  </h3>
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <button
                      onClick={handleCreateTestFriends}
                      disabled={testFriendsStatus === 'creating'}
                      className="w-full p-4 flex items-center justify-between hover:bg-gray-50 disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <UserPlus size={20} className="text-[#9CAF88]" />
                        <div className="text-left">
                          <span className="text-[#1F2937] block">Create Test Friends</span>
                          <span className="text-xs text-[#6B7280]">
                            {testFriendsStatus === 'creating'
                              ? 'Creating...'
                              : testFriendsStatus
                              ? testFriendsStatus
                              : '5 confirmed app user friends'}
                          </span>
                        </div>
                      </div>
                      <FlaskConical size={20} className="text-[#6B7280]" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="p-4 bg-white border-t border-gray-100">
              <Button onClick={handleSaveAll} className="w-full" size="lg">
                Save Changes
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
