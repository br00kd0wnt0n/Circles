import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Bell, Smartphone, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const DELIVERY_METHODS = [
  {
    id: 'in-app',
    label: 'In-App',
    description: 'Push notification',
    icon: Bell,
    color: '#9CAF88',
    requiresAppUser: true
  },
  {
    id: 'sms',
    label: 'SMS',
    description: 'Text message',
    icon: Smartphone,
    color: '#3B82F6',
    requiresAppUser: false
  }
];

export function DeliveryMethodSelector({ friends, selectedMethods, onMethodChange }) {
  const { theme, themeId } = useTheme();
  const isDark = themeId === 'midnight';

  const getAvailableMethods = (friend) => {
    return DELIVERY_METHODS.filter(m =>
      m.requiresAppUser ? friend.isAppUser : true
    );
  };

  const getSelectedMethod = (friendId) => {
    return selectedMethods[friendId] || 'in-app';
  };

  const handleMethodChange = (friendId, methodId) => {
    onMethodChange({
      ...selectedMethods,
      [friendId]: methodId
    });
  };

  if (friends.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <MessageCircle size={16} style={{ color: theme.textSecondary }} />
        <h3 className="text-sm font-medium" style={{ color: theme.textSecondary }}>
          How to notify
        </h3>
      </div>

      <div className="space-y-2">
        {friends.map(friend => {
          const availableMethods = getAvailableMethods(friend);
          const selectedMethod = getSelectedMethod(friend.id);

          return (
            <div
              key={friend.id}
              className="p-3 rounded-xl"
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'white',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                  style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F4F4F5' }}
                >
                  {friend.avatar || '👤'}
                </div>
                <span
                  className="font-medium text-sm flex-1"
                  style={{ color: theme.textPrimary }}
                >
                  {friend.displayName || friend.householdName}
                </span>
                {!friend.isAppUser && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    Not on app
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                {availableMethods.map(method => {
                  const Icon = method.icon;
                  const isSelected = selectedMethod === method.id;

                  return (
                    <motion.button
                      key={method.id}
                      onClick={() => handleMethodChange(friend.id, method.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all"
                      style={{
                        backgroundColor: isSelected ? `${method.color}20` : (isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB'),
                        color: isSelected ? method.color : theme.textSecondary,
                        border: `2px solid ${isSelected ? method.color : 'transparent'}`
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon size={16} />
                      <span>{method.label}</span>
                      {isSelected && <Check size={14} />}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DeliveryMethodSelector;
