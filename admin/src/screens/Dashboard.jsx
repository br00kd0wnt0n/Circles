import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Home,
  Send,
  Tag,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

// Mock data for demo
const mockStats = {
  users: { value: 1247, change: 12.5, trend: 'up' },
  households: { value: 892, change: 8.3, trend: 'up' },
  invites: { value: 3421, change: -2.1, trend: 'down' },
  offers: { value: 24, change: 4, trend: 'up' }
};

const mockChartData = Array.from({ length: 14 }, (_, i) => ({
  date: new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
  users: Math.floor(50 + Math.random() * 30),
  invites: Math.floor(80 + Math.random() * 50),
  engagement: Math.floor(60 + Math.random() * 25)
}));

const mockRecentActivity = [
  { id: 1, type: 'user', message: 'New household registered: The Johnsons', time: '5m ago' },
  { id: 2, type: 'invite', message: 'The Smiths sent 3 invites', time: '12m ago' },
  { id: 3, type: 'offer', message: 'New offer created: Summer Special at Joes Pizza', time: '1h ago' },
  { id: 4, type: 'user', message: 'The Barretts updated their status', time: '2h ago' },
  { id: 5, type: 'invite', message: 'The Chases accepted an invite', time: '3h ago' }
];

export function Dashboard() {
  const [stats, setStats] = useState(mockStats);
  const [chartData, setChartData] = useState(mockChartData);
  const [activity, setActivity] = useState(mockRecentActivity);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your Circles app metrics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats.users.value.toLocaleString()}
          change={stats.users.change}
          trend={stats.users.trend}
          icon={Users}
          color="#9CAF88"
        />
        <StatCard
          title="Households"
          value={stats.households.value.toLocaleString()}
          change={stats.households.change}
          trend={stats.households.trend}
          icon={Home}
          color="#3B82F6"
        />
        <StatCard
          title="Invites Sent"
          value={stats.invites.value.toLocaleString()}
          change={stats.invites.change}
          trend={stats.invites.trend}
          icon={Send}
          color="#8B5CF6"
        />
        <StatCard
          title="Active Offers"
          value={stats.offers.value.toString()}
          change={stats.offers.change}
          trend={stats.offers.trend}
          icon={Tag}
          color="#F59E0B"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Growth Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">User Activity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9CAF88" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#9CAF88" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#9CAF88"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorUsers)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Engagement Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Invite & Engagement</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="invites"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="engagement"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {activity.map(item => (
            <div key={item.id} className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                item.type === 'user' ? 'bg-primary/10' :
                item.type === 'invite' ? 'bg-purple-100' :
                'bg-amber-100'
              }`}>
                {item.type === 'user' ? <Users size={18} className="text-primary" /> :
                 item.type === 'invite' ? <Send size={18} className="text-purple-600" /> :
                 <Tag size={18} className="text-amber-600" />}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">{item.message}</p>
                <p className="text-xs text-gray-500">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, trend, icon: Icon, color }) {
  const isPositive = trend === 'up';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 p-6"
    >
      <div className="flex items-start justify-between">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: color + '20' }}
        >
          <Icon size={24} style={{ color }} />
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${
          isPositive ? 'text-green-600' : 'text-red-500'
        }`}>
          {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          {Math.abs(change)}%
        </div>
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{title}</p>
      </div>
    </motion.div>
  );
}

export default Dashboard;
