import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Check, Circle, X, MessageCircle, Pencil } from 'lucide-react';

const statusOptions = [
  { id: 'available', label: 'Available', icon: Check, color: '#22C55E', bgColor: '#DCFCE7', circleColor: '#86EFAC' },
  { id: 'open', label: 'Open', icon: Circle, color: '#F59E0B', bgColor: '#FEF3C7', circleColor: '#FCD34D' },
  { id: 'busy', label: 'Busy', icon: X, color: '#E11D48', bgColor: '#FFE4E6', circleColor: '#FDA4AF' }
];

// Convert hex to rgba
const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export function HeaderLockup({ household, status, onStatusChange, onOpenSettings }) {
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(status.note || '');

  // Sync noteText with status.note when it changes externally
  useEffect(() => {
    setNoteText(status.note || '');
  }, [status.note]);

  const handleNoteSave = () => {
    onStatusChange({ ...status, note: noteText.trim() || null });
    setIsEditingNote(false);
  };

  const handleNoteKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleNoteSave();
    } else if (e.key === 'Escape') {
      setNoteText(status.note || '');
      setIsEditingNote(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const currentStatus = statusOptions.find(s => s.id === status.state) || statusOptions[0];

  return (
    <div className="relative -mx-4 -mt-6 mb-2">
      {/* Container for the header */}
      <div className="relative">
        {/* Background fill with curved bottom */}
        <motion.div
          className="pt-6 pb-5 px-4"
          animate={{
            backgroundColor: hexToRgba(currentStatus.circleColor, 0.2)
          }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          style={{
            borderRadius: '0 0 100% 100% / 0 0 24px 24px'
          }}
        >
          {/* Top row: Greeting + Settings */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-[#6B7280]">{getGreeting()}</p>
            <button
              onClick={onOpenSettings}
              className="p-2 -mr-2 rounded-full hover:bg-white/50 transition-colors"
            >
              <Settings size={20} className="text-[#6B7280]" />
            </button>
          </div>

          {/* Main content: Family info */}
          <div className="flex items-center gap-4">
            {/* Family avatars stacked */}
            <div className="relative flex-shrink-0">
              <motion.div
                className="w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center border-2"
                style={{ borderColor: currentStatus.color }}
                animate={{
                  boxShadow: status.state === 'available'
                    ? ['0 4px 6px -1px rgba(0,0,0,0.1)', '0 4px 6px -1px rgba(34,197,94,0.3)', '0 4px 6px -1px rgba(0,0,0,0.1)']
                    : '0 4px 6px -1px rgba(0,0,0,0.1)'
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-2xl">{household.members[0]?.avatar}</span>
              </motion.div>
              {/* Status indicator */}
              <motion.div
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center"
                style={{ backgroundColor: currentStatus.color }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <currentStatus.icon size={10} className="text-white" strokeWidth={3} />
              </motion.div>
            </div>

            {/* Name and members */}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold tracking-tight text-[#1F2937] truncate">
                {household.householdName}
              </h1>
              <div className="flex items-center gap-1 mt-1">
                {household.members.slice(0, 5).map((member, i) => (
                  <span
                    key={member.id}
                    className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center text-xs border border-gray-100"
                    title={member.name}
                  >
                    {member.avatar}
                  </span>
                ))}
                {household.members.length > 5 && (
                  <span className="text-xs text-[#6B7280] ml-1">
                    +{household.members.length - 5}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick status toggles */}
          <div className="flex gap-2 mt-4">
            {statusOptions.map((option) => {
              const Icon = option.icon;
              const isActive = status.state === option.id;

              return (
                <motion.button
                  key={option.id}
                  onClick={() => onStatusChange({ ...status, state: option.id })}
                  whileTap={{ scale: 0.95 }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? 'shadow-md'
                      : 'bg-white/60 hover:bg-white/80'
                  }`}
                  style={{
                    backgroundColor: isActive ? option.bgColor : undefined,
                    color: isActive ? option.color : '#6B7280'
                  }}
                >
                  <Icon size={14} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{option.label}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Editable note - integrated into header */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <MessageCircle size={12} className="text-[#6B7280] flex-shrink-0" />
            {isEditingNote ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={handleNoteKeyDown}
                  onBlur={handleNoteSave}
                  placeholder="What's your family up to?"
                  className="w-48 text-xs text-[#1F2937] bg-transparent outline-none placeholder:text-[#9CA3AF] border-b border-[#B8A9C9]/50 pb-0.5 text-center"
                  autoFocus
                  maxLength={60}
                />
                <span className="text-[10px] text-[#9CA3AF]">{noteText.length}/60</span>
              </motion.div>
            ) : (
              <button
                onClick={() => setIsEditingNote(true)}
                className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
              >
                {status.note ? (
                  <p className="text-xs text-[#6B7280] truncate">
                    "{status.note}"
                  </p>
                ) : (
                  <p className="text-xs text-[#9CA3AF] italic">
                    Add a note...
                  </p>
                )}
                <Pencil size={10} className="text-[#9CA3AF] flex-shrink-0" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
