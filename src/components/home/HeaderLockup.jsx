import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Pencil, Palette } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export function HeaderLockup({ household, status, onStatusChange, onOpenSettings }) {
  const { theme, cycleTheme } = useTheme();

  const statusOptions = [
    { id: 'available', label: 'Available', color: theme.headerAvailable },
    { id: 'open', label: 'Open', color: theme.headerOpen },
    { id: 'busy', label: 'Busy', color: theme.headerBusy }
  ];
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(status.note || '');

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

  const getDefaultNote = () => {
    switch (status.state) {
      case 'available': return "We're available!";
      case 'open': return 'Open to plans';
      case 'busy': return 'Busy right now';
      default: return "We're available!";
    }
  };

  // Get current status color
  const currentStatus = statusOptions.find(s => s.id === status.state) || statusOptions[0];

  return (
    <div className="relative mb-4">
      {/* Arc header - color changes with status */}
      <motion.div
        className="relative pt-6 pb-4 px-4"
        animate={{ backgroundColor: currentStatus.color }}
        transition={{ duration: 0.3 }}
        style={{
          borderRadius: '0 0 50% 50% / 0 0 30px 30px'
        }}
      >
        {/* Theme toggle - top left */}
        <button
          onClick={cycleTheme}
          className="absolute top-3 left-3 p-2 rounded-full hover:bg-white/20 transition-colors"
        >
          <Palette size={18} className="text-white/70" />
        </button>

        {/* Settings cog - top right */}
        <button
          onClick={onOpenSettings}
          className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/20 transition-colors"
        >
          <Settings size={18} className="text-white/70" />
        </button>

        {/* Family Name - centered, prominent */}
        <motion.h1
          className="text-2xl font-semibold text-white text-center mb-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {household.householdName}
        </motion.h1>

        {/* Status Toggle Buttons */}
        <div className="flex justify-center gap-1 mb-2">
          {statusOptions.map((option) => {
            const isActive = status.state === option.id;
            return (
              <motion.button
                key={option.id}
                onClick={() => onStatusChange({ ...status, state: option.id })}
                whileTap={{ scale: 0.95 }}
                className={`px-5 py-2 rounded-lg font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-white/90 text-gray-700 shadow-sm'
                    : 'bg-white/20 text-white/90 hover:bg-white/30'
                }`}
              >
                {option.label}
              </motion.button>
            );
          })}
        </div>

        {/* Editable Status Note */}
        <div className="text-center">
          {isEditingNote ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center"
            >
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={handleNoteKeyDown}
                onBlur={handleNoteSave}
                placeholder="What's your family up to?"
                className="w-56 text-sm text-white bg-transparent outline-none placeholder:text-white/50 border-b border-white/40 pb-0.5 text-center"
                autoFocus
                maxLength={60}
              />
            </motion.div>
          ) : (
            <button
              onClick={() => setIsEditingNote(true)}
              className="flex items-center justify-center gap-1.5 mx-auto hover:opacity-80 transition-opacity group"
            >
              <p className="text-sm text-green-900/70">
                {status.note || getDefaultNote()}
              </p>
              <Pencil size={12} className="text-green-900/40 group-hover:text-green-900/60" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
