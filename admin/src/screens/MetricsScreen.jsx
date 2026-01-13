import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Calendar,
  BarChart3
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// Mock data
const inviteMetrics = {
  total: 3421,
  accepted: 2156,
  declined: 542,
  pending: 723,
  conversionRate: 63
};

const topCircles = [
  { name: 'Rock Academy Parents', members: 45, activity: 156 },
  { name: 'Woodstock Elementary', members: 38, activity: 142 },
  { name: 'NYC Friends', members: 28, activity: 98 },
  { name: 'Soccer Team', members: 22, activity: 67 },
  { name: 'Book Club', members: 15, activity: 34 }
];

const weeklyData = [
  { day: 'Mon', invites: 89, accepted: 56 },
  { day: 'Tue', invites: 102, accepted: 71 },
  { day: 'Wed', invites: 78, accepted: 48 },
  { day: 'Thu', invites: 95, accepted: 62 },
  { day: 'Fri', invites: 134, accepted: 89 },
  { day: 'Sat', invites: 156, accepted: 112 },
  { day: 'Sun', invites: 123, accepted: 78 }
];

const responseBreakdown = [
  { name: 'Accepted', value: 63, color: '#9CAF88' },
  { name: 'Declined', value: 16, color: '#EF4444' },
  { name: 'Pending', value: 21, color: '#F59E0B' }
];

const userGrowth = [
  { month: 'Jan', users: 245 },
  { month: 'Feb', users: 389 },
  { month: 'Mar', users: 567 },
  { month: 'Apr', users: 721 },
  { month: 'May', users: 892 },
  { month: 'Jun', users: 1024 },
  { month: 'Jul', users: 1247 }
];

export function MetricsScreen() {
  const [timeRange, setTimeRange] = useState('7d');

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Metrics</h1>
          <p className="text-gray-500 mt-1">Detailed analytics and insights</p>
        </div>
        <div className="flex gap-2">
          {['7d', '30d', '90d', 'All'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Invite Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          title="Total Invites"
          value={inviteMetrics.total.toLocaleString()}
          icon={Send}
          color="#9CAF88"
        />
        <StatCard
          title="Accepted"
          value={inviteMetrics.accepted.toLocaleString()}
          icon={CheckCircle}
          color="#22C55E"
        />
        <StatCard
          title="Declined"
          value={inviteMetrics.declined.toLocaleString()}
          icon={XCircle}
          color="#EF4444"
        />
        <StatCard
          title="Pending"
          value={inviteMetrics.pending.toLocaleString()}
          icon={Clock}
          color="#F59E0B"
        />
        <StatCard
          title="Conversion Rate"
          value={`${inviteMetrics.conversionRate}%`}
          icon={TrendingUp}
          color="#8B5CF6"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Weekly Invites */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Weekly Invite Activity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="day" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip />
                <Bar dataKey="invites" fill="#9CAF88" radius={[4, 4, 0, 0]} />
                <Bar dataKey="accepted" fill="#22C55E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Response Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Response Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={responseBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {responseBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* User Growth */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">User Growth</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip />
              <Bar dataKey="users" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Circles */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Top Circles by Activity</h3>
        <div className="space-y-4">
          {topCircles.map((circle, index) => (
            <div key={circle.name} className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{circle.name}</p>
                <p className="text-sm text-gray-500">{circle.members} members</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{circle.activity}</p>
                <p className="text-xs text-gray-500">invites</p>
              </div>
              <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${(circle.activity / topCircles[0].activity) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-100 p-4"
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: color + '20' }}
        >
          <Icon size={20} style={{ color }} />
        </div>
        <div>
          <p className="text-xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{title}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default MetricsScreen;
