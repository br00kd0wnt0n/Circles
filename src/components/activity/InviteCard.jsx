import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Check, X, Users, Send } from 'lucide-react';
import { Button } from '../ui/Button';
import { useData } from '../../context/DataContext';
import { activities } from '../../data/seedData';

export function InviteCard({ invite, type, onRespond }) {
  const { friendHouseholds } = useData();
  const activity = invite.activity ? activities.find(a => a.id === invite.activity.id) : invite.activity;
  const invitedFriends = friendHouseholds.filter(h =>
    invite.invitedHouseholds?.includes(h.id)
  );

  const acceptedCount = invite.responses ? Object.values(invite.responses).filter(r => r === 'accepted').length : 0;
  const pendingCount = invite.responses ? Object.values(invite.responses).filter(r => r === 'pending').length : 0;

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {type === 'outgoing' && (
            <span className="flex items-center gap-1 text-xs text-[#9CAF88] bg-[#E8F0E3] px-2 py-1 rounded-full">
              <Send size={12} />
              You sent
            </span>
          )}
          {type === 'incoming' && (
            <span className="text-xs text-[#6B7280]">Invite received</span>
          )}
          <span className="text-xs text-[#6B7280]">{getTimeAgo(invite.createdAt)}</span>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          invite.status === 'confirmed'
            ? 'bg-green-100 text-green-700'
            : 'bg-amber-100 text-amber-700'
        }`}>
          {invite.status === 'confirmed' ? 'Confirmed' : 'Pending'}
        </span>
      </div>

      {/* Main Content */}
      <div className="space-y-2.5">
        {/* Date & Time */}
        <div className="flex items-center gap-4">
          {invite.date && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={16} className="text-[#9CAF88]" />
              <span className="font-medium text-[#1F2937]">{invite.date}</span>
            </div>
          )}
          {invite.timeSlot && (
            <div className="flex items-center gap-2 text-sm text-[#6B7280]">
              <Clock size={16} className="text-[#9CAF88]" />
              <span>{invite.timeSlot.label}</span>
              <span className="text-xs">({invite.timeSlot.time})</span>
            </div>
          )}
        </div>

        {/* Activity */}
        {activity && activity.id !== 'no-plan' && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin size={16} className="text-[#9CAF88]" />
            <span className="text-[#1F2937] font-medium">{activity.name}</span>
            <span className="text-[#6B7280]">• {activity.location}</span>
          </div>
        )}

        {/* Invited Friends */}
        {invitedFriends.length > 0 && (
          <div className="flex items-center gap-3 pt-2">
            <div className="flex -space-x-2">
              {invitedFriends.slice(0, 5).map(friend => (
                <div
                  key={friend.id}
                  className="w-8 h-8 rounded-full bg-[#F4F4F5] border-2 border-white flex items-center justify-center text-sm"
                  title={friend.householdName}
                >
                  {friend.members[0]?.avatar || '👥'}
                </div>
              ))}
              {invitedFriends.length > 5 && (
                <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs text-[#6B7280] font-medium">
                  +{invitedFriends.length - 5}
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-[#1F2937]">
                {invitedFriends.map(f => f.householdName.replace('The ', '')).join(', ')}
              </p>
              <p className="text-xs text-[#6B7280]">
                {acceptedCount > 0 && `${acceptedCount} accepted`}
                {acceptedCount > 0 && pendingCount > 0 && ' • '}
                {pendingCount > 0 && `${pendingCount} pending`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions for incoming invites */}
      {type === 'incoming' && invite.responses?.howard === 'pending' && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
          <Button
            variant="ghost"
            className="flex-1 flex items-center justify-center gap-1 border border-gray-200"
            onClick={() => onRespond(invite.id, 'declined')}
          >
            <X size={16} />
            Decline
          </Button>
          <Button
            className="flex-1 flex items-center justify-center gap-1"
            onClick={() => onRespond(invite.id, 'accepted')}
          >
            <Check size={16} />
            Accept
          </Button>
        </div>
      )}
    </motion.div>
  );
}
