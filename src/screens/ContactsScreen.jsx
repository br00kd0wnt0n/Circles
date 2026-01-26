import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus, UserPlus, Phone, MessageCircle, MoreVertical, Trash2, Link, Copy, Check, UserPlus2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { StatusDot } from '../components/ui/StatusDot';

// Generate invite link URL
const getInviteUrl = (token) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/join/${token}`;
};

export function ContactsScreen({ isOpen, onClose }) {
  const { themeId } = useTheme();
  const { contacts, friendHouseholds, circles, addContact, updateContact, deleteContact } = useData();
  const isDark = themeId === 'midnight';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // all, available, app-users
  const [showAddContact, setShowAddContact] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState(null);

  // Get the selected contact from the contacts list (so it updates when circles change)
  const selectedContact = useMemo(() => {
    if (!selectedContactId) return null;
    return contacts?.find(c => c.id === selectedContactId) || null;
  }, [selectedContactId, contacts]);

  // Use contacts from API or friendHouseholds as fallback
  const allContacts = useMemo(() => {
    if (contacts?.length > 0) return contacts;
    return friendHouseholds.map(h => ({
      id: h.id,
      displayName: h.householdName,
      avatar: h.members?.[0]?.avatar || '👨',
      isAppUser: true,
      status: h.status,
      circles: []
    }));
  }, [contacts, friendHouseholds]);

  // Filter contacts
  const filteredContacts = useMemo(() => {
    let result = allContacts;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.displayName?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (selectedFilter === 'available') {
      result = result.filter(c =>
        c.status?.state === 'available' || c.status?.state === 'open'
      );
    } else if (selectedFilter === 'app-users') {
      result = result.filter(c => c.isAppUser);
    }

    return result;
  }, [allContacts, searchQuery, selectedFilter]);

  // Group contacts by first letter
  const groupedContacts = useMemo(() => {
    const groups = {};
    filteredContacts.forEach(contact => {
      const letter = contact.displayName?.[0]?.toUpperCase() || '#';
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(contact);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredContacts]);

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
            Contacts
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddContact(true)}
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

        {/* Search */}
        <div className="px-4 pb-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${
            isDark ? 'bg-white/10' : 'bg-gray-100'
          }`}>
            <Search className={`w-4 h-4 ${isDark ? 'text-white/50' : 'text-gray-400'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
              className={`flex-1 bg-transparent outline-none text-sm ${
                isDark ? 'text-white placeholder-white/50' : 'text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'available', label: 'Available' },
            { id: 'app-users', label: 'On App' }
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setSelectedFilter(filter.id)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                selectedFilter === filter.id
                  ? 'bg-[#9CAF88] text-white'
                  : isDark
                    ? 'bg-white/10 text-white/70'
                    : 'bg-gray-100 text-gray-600'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Contact List */}
        <div className="overflow-y-auto px-4 pb-8" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          {groupedContacts.length === 0 ? (
            <div className={`text-center py-8 ${isDark ? 'text-white/50' : 'text-gray-400'}`}>
              No contacts found
            </div>
          ) : (
            groupedContacts.map(([letter, contacts]) => (
              <div key={letter} className="mb-4">
                <div className={`text-xs font-semibold mb-2 ${
                  isDark ? 'text-white/50' : 'text-gray-400'
                }`}>
                  {letter}
                </div>
                <div className="space-y-1">
                  {contacts.map(contact => (
                    <motion.button
                      key={contact.id}
                      onClick={() => setSelectedContactId(contact.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                        isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                      }`}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Avatar with status */}
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                          isDark ? 'bg-white/10' : 'bg-gray-100'
                        }`}>
                          {contact.avatar || '👤'}
                        </div>
                        {contact.status && (
                          <div className="absolute -bottom-0.5 -right-0.5">
                            <StatusDot status={contact.status.state} size="sm" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 text-left">
                        <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {contact.displayName}
                        </div>
                        {contact.status?.note && (
                          <div className={`text-sm truncate ${
                            isDark ? 'text-white/50' : 'text-gray-500'
                          }`}>
                            {contact.status.note}
                          </div>
                        )}
                        {!contact.isAppUser && (
                          <div className="text-xs text-orange-500">
                            Not on app yet
                          </div>
                        )}
                      </div>

                      {/* Circles */}
                      {contact.circles?.length > 0 && (
                        <div className="flex -space-x-1">
                          {contact.circles.slice(0, 3).map(circle => (
                            <div
                              key={circle.id}
                              className="w-4 h-4 rounded-full border-2 border-white dark:border-gray-900"
                              style={{ backgroundColor: circle.color }}
                              title={circle.name}
                            />
                          ))}
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Contact FAB */}
        <button
          onClick={() => setShowAddContact(true)}
          className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-[#9CAF88] text-white shadow-lg flex items-center justify-center"
        >
          <UserPlus className="w-6 h-6" />
        </button>
      </motion.div>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {showAddContact && (
          <AddContactModal
            onClose={() => setShowAddContact(false)}
            isDark={isDark}
            onAddContact={addContact}
          />
        )}
      </AnimatePresence>

      {/* Contact Detail Modal */}
      <AnimatePresence>
        {selectedContact && (
          <ContactDetailModal
            contact={selectedContact}
            onClose={() => setSelectedContactId(null)}
            isDark={isDark}
            allCircles={circles}
            onUpdateContact={updateContact}
            onDeleteContact={deleteContact}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AddContactModal({ onClose, isDark, onAddContact }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddContact({ name: name.trim(), phone: phone.trim() || undefined });
      onClose();
    } catch (err) {
      console.error('Failed to add contact:', err);
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
          Add Contact
        </h3>

        <div className="space-y-4">
          <div>
            <label className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., The Smiths"
              className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                isDark
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-gray-50 border-gray-200 text-gray-900'
              }`}
            />
          </div>

          <div>
            <label className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
              Phone (optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 123 4567"
              className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                isDark
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-gray-50 border-gray-200 text-gray-900'
              }`}
            />
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
            {isSubmitting ? 'Adding...' : 'Add'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ContactDetailModal({ contact, onClose, isDark, onUpdateContact, onDeleteContact, allCircles }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(contact.displayName || '');
  const [showCirclePicker, setShowCirclePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const contactCircleIds = (contact.circles || []).map(c => c.id);
  const inviteUrl = contact.inviteToken ? getInviteUrl(contact.inviteToken) : null;

  const handleCopyInviteLink = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShareInviteLink = async () => {
    if (!inviteUrl) return;
    const shareData = {
      title: 'Join me on Circles!',
      text: `Hey! Join me on Circles so we can make plans together.`,
      url: inviteUrl
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        handleCopyInviteLink();
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  };

  const handleSaveName = async () => {
    if (!editName.trim() || editName === contact.displayName) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await onUpdateContact(contact.id, { displayName: editName.trim() });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update contact:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleCircle = async (circleId) => {
    const isInCircle = contactCircleIds.includes(circleId);
    setIsSaving(true);
    try {
      if (isInCircle) {
        await onUpdateContact(contact.id, { removeFromCircle: circleId });
      } else {
        await onUpdateContact(contact.id, { addToCircle: circleId });
      }
    } catch (err) {
      console.error('Failed to update circle membership:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Remove ${contact.displayName} from your contacts?`)) return;
    setIsSaving(true);
    try {
      await onDeleteContact(contact.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete contact:', err);
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
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
      >
        {/* Contact Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${
              isDark ? 'bg-white/10' : 'bg-gray-100'
            }`}>
              {contact.avatar || '👤'}
            </div>
            {contact.status && (
              <div className="absolute -bottom-1 -right-1">
                <StatusDot status={contact.status.state} size="md" />
              </div>
            )}
          </div>
          <div className="flex-1">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  autoFocus
                  className={`text-xl font-bold bg-transparent border-b-2 border-[#9CAF88] outline-none w-full ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                />
                <button
                  onClick={handleSaveName}
                  disabled={isSaving}
                  className="text-sm text-[#9CAF88] font-medium"
                >
                  {isSaving ? '...' : 'Save'}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {contact.displayName}
                </h3>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm text-[#9CAF88] font-medium"
                >
                  Edit
                </button>
              </div>
            )}
            {contact.status?.note && (
              <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                {contact.status.note}
              </p>
            )}
          </div>
          <button onClick={onClose}>
            <X className={`w-6 h-6 ${isDark ? 'text-white/50' : 'text-gray-400'}`} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl ${
            isDark ? 'bg-white/10' : 'bg-gray-100'
          }`}>
            <MessageCircle className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
            <span className={isDark ? 'text-white' : 'text-gray-700'}>Message</span>
          </button>
          {contact.isAppUser ? (
            <button className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl ${
              isDark ? 'bg-white/10' : 'bg-gray-100'
            }`}>
              <Phone className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
              <span className={isDark ? 'text-white' : 'text-gray-700'}>Call</span>
            </button>
          ) : (
            <button
              onClick={handleShareInviteLink}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#9CAF88] text-white"
            >
              <UserPlus2 className="w-5 h-5" />
              <span>Invite to App</span>
            </button>
          )}
        </div>

        {/* Invite Link Section (for non-app users) */}
        {!contact.isAppUser && inviteUrl && (
          <div className={`mb-6 p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-2">
              <h4 className={`text-sm font-medium ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                Invite Link
              </h4>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopyInviteLink}
                  className={`p-2 rounded-lg transition-colors ${
                    copiedLink
                      ? 'bg-green-500/20 text-green-500'
                      : isDark ? 'hover:bg-white/10 text-white/70' : 'hover:bg-gray-200 text-gray-500'
                  }`}
                  title="Copy link"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleShareInviteLink}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-white/10 text-white/70' : 'hover:bg-gray-200 text-gray-500'
                  }`}
                  title="Share link"
                >
                  <Link className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className={`text-xs break-all ${isDark ? 'text-white/50' : 'text-gray-400'}`}>
              {inviteUrl}
            </p>
            <p className={`text-xs mt-2 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
              When they sign up with this link, they'll automatically be connected to you.
            </p>
          </div>
        )}

        {/* Circles */}
        <div className="mb-6">
          <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            Circles
          </h4>
          {showCirclePicker ? (
            <div className="space-y-2">
              {(!allCircles || allCircles.length === 0) ? (
                <div className={`text-center py-4 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                  <p className="text-sm">No circles yet</p>
                  <p className="text-xs mt-1">Create circles in Settings to organize your contacts</p>
                </div>
              ) : (
                (allCircles || []).map(circle => {
                  const isInCircle = contactCircleIds.includes(circle.id);
                  return (
                    <button
                      key={circle.id}
                      onClick={() => handleToggleCircle(circle.id)}
                      disabled={isSaving}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                        isInCircle
                          ? 'ring-2 ring-[#9CAF88]'
                          : isDark ? 'bg-white/5' : 'bg-gray-50'
                      }`}
                      style={{ backgroundColor: isInCircle ? `${circle.color}20` : undefined }}
                    >
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: circle.color }}
                      />
                      <span className={isDark ? 'text-white' : 'text-gray-900'}>{circle.name}</span>
                      {isInCircle && (
                        <span className="ml-auto text-[#9CAF88]">✓</span>
                      )}
                    </button>
                  );
                })
              )}
              <button
                onClick={() => setShowCirclePicker(false)}
                className={`w-full py-2 text-center text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}
              >
                Done
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {contact.circles?.map(circle => (
                <div
                  key={circle.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: circle.color + '20' }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: circle.color }}
                  />
                  <span style={{ color: circle.color }}>{circle.name}</span>
                </div>
              ))}
              <button
                onClick={() => setShowCirclePicker(true)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full border-2 border-dashed ${
                  isDark ? 'border-white/20 text-white/50' : 'border-gray-300 text-gray-400'
                }`}
              >
                <Plus className="w-4 h-4" />
                {contact.circles?.length ? 'Edit' : 'Add to Circle'}
              </button>
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <button
          onClick={handleDelete}
          disabled={isSaving}
          className="flex items-center gap-2 text-red-500 disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          <span>Remove Contact</span>
        </button>
      </motion.div>
    </motion.div>
  );
}

export default ContactsScreen;
