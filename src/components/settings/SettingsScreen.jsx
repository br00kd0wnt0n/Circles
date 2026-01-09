import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, User, Users, Bell, Palette, HelpCircle, LogOut } from 'lucide-react';
import { Button } from '../ui/Button';

export function SettingsScreen({ isOpen, onClose, household, onUpdateHousehold }) {
  const [editingName, setEditingName] = useState(false);
  const [householdName, setHouseholdName] = useState(household.householdName);
  const [editingMember, setEditingMember] = useState(null);
  const [members, setMembers] = useState(household.members);

  const handleSaveName = () => {
    onUpdateHousehold({ ...household, householdName, members });
    setEditingName(false);
  };

  const handleUpdateMember = (memberId, updates) => {
    const newMembers = members.map(m =>
      m.id === memberId ? { ...m, ...updates } : m
    );
    setMembers(newMembers);
  };

  const handleSaveAll = () => {
    onUpdateHousehold({ ...household, householdName, members });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 right-0 w-full max-w-md z-50 bg-[#FAF9F6] overflow-hidden flex flex-col"
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
                            {member.avatar}
                          </div>
                          <div>
                            {editingMember === member.id ? (
                              <input
                                type="text"
                                value={member.name}
                                onChange={(e) => handleUpdateMember(member.id, { name: e.target.value })}
                                onBlur={() => setEditingMember(null)}
                                onKeyDown={(e) => e.key === 'Enter' && setEditingMember(null)}
                                autoFocus
                                className="font-medium text-[#1F2937] bg-transparent border-b-2 border-[#9CAF88] outline-none"
                              />
                            ) : (
                              <p className="font-medium text-[#1F2937]">{member.name}</p>
                            )}
                            <p className="text-xs text-[#6B7280] capitalize">{member.role}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setEditingMember(editingMember === member.id ? null : member.id)}
                          className="text-sm text-[#9CAF88] font-medium"
                        >
                          {editingMember === member.id ? 'Done' : 'Edit'}
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add Member */}
                  <button className="w-full p-4 text-left flex items-center gap-3 text-[#9CAF88]">
                    <div className="w-10 h-10 rounded-full bg-[#E8F0E3] flex items-center justify-center">
                      <span className="text-lg">+</span>
                    </div>
                    <span className="font-medium">Add Family Member</span>
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
