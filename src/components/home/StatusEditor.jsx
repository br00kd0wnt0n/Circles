import { useState } from 'react';
import { motion } from 'framer-motion';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Check, Circle, X } from 'lucide-react';

const statusOptions = [
  { id: 'available', label: 'Available', icon: Check, color: 'bg-green-500' },
  { id: 'open', label: 'Open to Plans', icon: Circle, color: 'bg-amber-400' },
  { id: 'busy', label: 'Busy', icon: X, color: 'bg-gray-400' }
];

const timePresets = [
  { id: 'morning', label: 'Morning' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'afternoon', label: 'Afternoon' },
  { id: 'evening', label: 'Evening' },
  { id: 'allday', label: 'All Day' }
];

export function StatusEditor({ isOpen, onClose, status, onSave }) {
  const [selectedState, setSelectedState] = useState(status.state);
  const [timeWindow, setTimeWindow] = useState(status.timeWindow || '');
  const [note, setNote] = useState(status.note || '');

  const handleSave = () => {
    onSave({
      state: selectedState,
      timeWindow: timeWindow || null,
      note: note || null
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Your Status">
      {/* Status Selection */}
      <div className="space-y-3 mb-6">
        {statusOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedState === option.id;

          return (
            <motion.button
              key={option.id}
              onClick={() => setSelectedState(option.id)}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-[#9CAF88] bg-[#E8F0E3]'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className={`w-10 h-10 rounded-full ${option.color} flex items-center justify-center`}>
                <Icon size={20} className="text-white" />
              </div>
              <span className={`font-medium ${isSelected ? 'text-[#1F2937]' : 'text-[#6B7280]'}`}>
                {option.label}
              </span>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto w-6 h-6 bg-[#9CAF88] rounded-full flex items-center justify-center"
                >
                  <Check size={14} className="text-white" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Time Window */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-[#6B7280] mb-2">
          Time window (optional)
        </label>
        <div className="flex flex-wrap gap-2">
          {timePresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setTimeWindow(timeWindow === preset.label ? '' : preset.label)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                timeWindow === preset.label
                  ? 'bg-[#9CAF88] text-white'
                  : 'bg-gray-100 text-[#6B7280] hover:bg-gray-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-[#6B7280] mb-2">
          Note (optional)
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What sounds good?"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#9CAF88] focus:ring-2 focus:ring-[#9CAF88]/20 outline-none transition-all"
        />
      </div>

      {/* Save Button */}
      <Button onClick={handleSave} className="w-full" size="lg">
        Save Status
      </Button>
    </Modal>
  );
}
