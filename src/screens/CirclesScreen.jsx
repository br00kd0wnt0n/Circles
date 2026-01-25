import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Users, Trash2, Edit2, Check, ChevronRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';

const CIRCLE_COLORS = [
  '#9CAF88', '#E57373', '#64B5F6', '#FFB74D', '#BA68C8',
  '#4DB6AC', '#FF8A65', '#7986CB', '#F06292', '#4DD0E1'
];

export function CirclesScreen({ isOpen, onClose }) {
  const { themeId } = useTheme();
  const { circles, friendHouseholds, addCircle, updateCircle, refresh } = useData();
  const isDark = themeId === 'midnight';

  const [showCreateCircle, setShowCreateCircle] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState(null);
  const [editingCircle, setEditingCircle] = useState(null);

  // Calculate member counts for each circle
  const circleStats = useMemo(() => {
    const stats = {};
    const safeCircles = circles || [];
    const safeHouseholds = friendHouseholds || [];
    safeCircles.forEach(circle => {
      const members = safeHouseholds.filter(h => h.circleIds?.includes(circle.id));
      const available = members.filter(m => m.status?.state !== 'busy').length;
      stats[circle.id] = { total: members.length, available };
    });
    return stats;
  }, [circles, friendHouseholds]);

  if (!isOpen) return null;

  return (
    <motion.div
      className="absolute inset-0 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        className="absolute inset-x-0 bottom-0 rounded-t-3xl overflow-hidden"
        style={{
          backgroundColor: isDark ? '#1a1a2e' : '#ffffff',
          maxHeight: '90vh'
        }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3">
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            My Circles
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateCircle(true)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
            >
              <Plus className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-900'}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
            >
              <X className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-900'}`} />
            </button>
          </div>
        </div>

        {/* Circle List */}
        <div className="overflow-y-auto px-4 pb-8" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          {circles.length === 0 ? (
            <div className={`text-center py-12 ${isDark ? 'text-white/50' : 'text-gray-400'}`}>
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No circles yet</p>
              <p className="text-sm mt-1">Create your first circle to organize friends</p>
            </div>
          ) : (
            <div className="space-y-3">
              {circles.map(circle => {
                const stats = circleStats[circle.id] || { total: 0, available: 0 };
                return (
                  <motion.button
                    key={circle.id}
                    onClick={() => setSelectedCircle(circle)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-colors ${
                      isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                    }`}
                    style={{
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'white',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Color Dot */}
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: circle.color + '30' }}
                    >
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: circle.color }}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-left">
                      <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {circle.name}
                      </div>
                      <div className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                        {stats.total} {stats.total === 1 ? 'friend' : 'friends'}
                        {stats.available > 0 && (
                          <span className="text-[#9CAF88]"> • {stats.available} available</span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className={`w-5 h-5 ${isDark ? 'text-white/30' : 'text-gray-300'}`} />
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Create Circle FAB */}
        <button
          onClick={() => setShowCreateCircle(true)}
          className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-[#9CAF88] text-white shadow-lg flex items-center justify-center"
        >
          <Plus className="w-6 h-6" />
        </button>
      </motion.div>

      {/* Create Circle Modal */}
      <AnimatePresence>
        {showCreateCircle && (
          <CreateCircleModal
            onClose={() => setShowCreateCircle(false)}
            isDark={isDark}
            existingColors={(circles || []).map(c => c.color)}
            onAddCircle={addCircle}
          />
        )}
      </AnimatePresence>

      {/* Circle Detail Modal */}
      <AnimatePresence>
        {selectedCircle && (
          <CircleDetailModal
            circle={selectedCircle}
            onClose={() => setSelectedCircle(null)}
            onEdit={() => {
              setEditingCircle(selectedCircle);
              setSelectedCircle(null);
            }}
            isDark={isDark}
            friendHouseholds={friendHouseholds}
          />
        )}
      </AnimatePresence>

      {/* Edit Circle Modal */}
      <AnimatePresence>
        {editingCircle && (
          <EditCircleModal
            circle={editingCircle}
            onClose={() => setEditingCircle(null)}
            onSave={() => {
              setEditingCircle(null);
              refresh();
            }}
            isDark={isDark}
            friendHouseholds={friendHouseholds}
            onUpdateCircle={updateCircle}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CreateCircleModal({ onClose, isDark, existingColors, onAddCircle }) {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(
    CIRCLE_COLORS.find(c => !existingColors.includes(c)) || CIRCLE_COLORS[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddCircle({ name: name.trim(), color: selectedColor });
      onClose();
    } catch (err) {
      console.error('Failed to create circle:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="absolute inset-0 z-60 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        className={`relative w-full max-w-sm rounded-2xl p-6 ${
          isDark ? 'bg-gray-900' : 'bg-white'
        }`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Create Circle
        </h3>

        <div className="space-y-4">
          <div>
            <label className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
              Circle Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Soccer Parents"
              className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                isDark
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-gray-50 border-gray-200 text-gray-900'
              }`}
            />
          </div>

          <div>
            <label className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
              Color
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {CIRCLE_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    selectedColor === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className={`flex-1 py-2 rounded-lg ${
              isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || isSubmitting}
            className="flex-1 py-2 rounded-lg bg-[#9CAF88] text-white disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CircleDetailModal({ circle, onClose, onEdit, isDark, friendHouseholds }) {
  const members = (friendHouseholds || []).filter(h => h.circleIds?.includes(circle.id));

  return (
    <motion.div
      className="absolute inset-0 z-60 flex items-end justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        className={`relative w-full max-w-lg rounded-t-2xl p-6 ${
          isDark ? 'bg-gray-900' : 'bg-white'
        }`}
        style={{ maxHeight: '80vh' }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: circle.color + '30' }}
          >
            <div
              className="w-8 h-8 rounded-full"
              style={{ backgroundColor: circle.color }}
            />
          </div>
          <div className="flex-1">
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {circle.name}
            </h3>
            <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </p>
          </div>
          <button onClick={onClose}>
            <X className={`w-6 h-6 ${isDark ? 'text-white/50' : 'text-gray-400'}`} />
          </button>
        </div>

        {/* Members */}
        <div className="mb-6">
          <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            Members
          </h4>
          {members.length === 0 ? (
            <p className={`text-sm ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
              No members yet. Add contacts to this circle.
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {members.map(member => (
                <div
                  key={member.id}
                  className={`flex items-center gap-3 p-2 rounded-xl ${
                    isDark ? 'bg-white/5' : 'bg-gray-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    isDark ? 'bg-white/10' : 'bg-gray-100'
                  }`}>
                    {member.members?.[0]?.avatar || '👤'}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {member.householdName}
                    </p>
                    <p className={`text-xs ${
                      member.status?.state === 'available' ? 'text-green-500' :
                      member.status?.state === 'open' ? 'text-amber-500' : 'text-gray-400'
                    }`}>
                      {member.status?.state || 'Unknown'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onEdit}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl ${
              isDark ? 'bg-white/10' : 'bg-gray-100'
            }`}
          >
            <Edit2 className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
            <span className={isDark ? 'text-white' : 'text-gray-700'}>Edit Circle</span>
          </button>
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#9CAF88] text-white"
          >
            <Users className="w-5 h-5" />
            <span>Add Members</span>
          </button>
        </div>

        {/* Delete */}
        <button className="flex items-center gap-2 text-red-500 mt-4 mx-auto">
          <Trash2 className="w-4 h-4" />
          <span className="text-sm">Delete Circle</span>
        </button>
      </motion.div>
    </motion.div>
  );
}

function EditCircleModal({ circle, onClose, onSave, isDark, friendHouseholds, onUpdateCircle }) {
  // Only include contacts that have linkedHouseholdId (app users who can be in circles)
  const safeHouseholds = (friendHouseholds || []).filter(h => h.linkedHouseholdId);
  const [name, setName] = useState(circle.name);
  const [selectedColor, setSelectedColor] = useState(circle.color);
  const [isSaving, setIsSaving] = useState(false);

  // Debug logging
  console.log('[EditCircleModal] circle:', circle.id, circle.name);
  console.log('[EditCircleModal] safeHouseholds:', safeHouseholds.map(h => ({ id: h.id, linkedHouseholdId: h.linkedHouseholdId, name: h.householdName, circleIds: h.circleIds })));

  // Track original members to calculate adds/removes
  const originalMembers = useMemo(() => {
    const members = safeHouseholds.filter(h => h.circleIds?.includes(circle.id)).map(h => h.id);
    console.log('[EditCircleModal] originalMembers:', members);
    return members;
  }, [safeHouseholds, circle.id]);
  const [selectedMembers, setSelectedMembers] = useState(originalMembers);

  const toggleMember = (memberId) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    console.log('[EditCircleModal] handleSave called with:', {
      circleId: circle.id,
      name: name.trim(),
      color: selectedColor,
      memberIds: selectedMembers
    });
    try {
      // Use the updateCircle from DataContext which handles the Supabase calls
      await onUpdateCircle(circle.id, {
        name: name.trim(),
        color: selectedColor,
        memberIds: selectedMembers
      });
      console.log('[EditCircleModal] updateCircle succeeded');
      if (onSave) {
        onSave();
      } else {
        onClose();
      }
    } catch (err) {
      console.error('[EditCircleModal] Failed to update circle:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      className="absolute inset-0 z-60 flex items-end justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        className={`relative w-full max-w-lg rounded-t-2xl p-6 ${
          isDark ? 'bg-gray-900' : 'bg-white'
        }`}
        style={{ maxHeight: '85vh' }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Edit Circle
          </h3>
          <button onClick={onClose}>
            <X className={`w-6 h-6 ${isDark ? 'text-white/50' : 'text-gray-400'}`} />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 180px)' }}>
          {/* Name */}
          <div>
            <label className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
              Circle Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                isDark
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-gray-50 border-gray-200 text-gray-900'
              }`}
            />
          </div>

          {/* Color */}
          <div>
            <label className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
              Color
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {CIRCLE_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    selectedColor === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Members */}
          <div>
            <label className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
              Members ({selectedMembers.length})
            </label>
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
              {safeHouseholds.length === 0 ? (
                <div className={`text-center py-4 px-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                    No contacts available to add to circles.
                  </p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                    Only contacts who are also app users can be added to circles.
                  </p>
                </div>
              ) : (
                safeHouseholds.map(household => {
                  const isSelected = selectedMembers.includes(household.id);
                  return (
                    <button
                      key={household.id}
                      onClick={() => toggleMember(household.id)}
                      className={`w-full flex items-center gap-3 p-2 rounded-xl transition-colors ${
                        isSelected
                          ? 'bg-[#9CAF88]/20 border-2 border-[#9CAF88]'
                          : isDark ? 'bg-white/5 border-2 border-transparent' : 'bg-gray-50 border-2 border-transparent'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                        isDark ? 'bg-white/10' : 'bg-gray-100'
                      }`}>
                        {household.members?.[0]?.avatar || '👤'}
                      </div>
                      <span className={`flex-1 text-left font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {household.householdName}
                      </span>
                      {isSelected && (
                        <Check className="w-5 h-5 text-[#9CAF88]" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className={`flex-1 py-3 rounded-xl ${
              isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || isSaving}
            className="flex-1 py-3 rounded-xl bg-[#9CAF88] text-white disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default CirclesScreen;
