import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, X, Building2, MapPin, Globe } from 'lucide-react';

// Mock businesses data
const mockBusinesses = [
  {
    id: '1',
    name: 'Joes Pizza',
    address: '123 Main Street, Woodstock, NY',
    website: 'https://joespizza.example.com',
    logoUrl: '',
    category: 'Restaurant',
    offersCount: 2
  },
  {
    id: '2',
    name: 'Garden Cafe',
    address: '456 Oak Avenue, Woodstock, NY',
    website: 'https://gardencafe.example.com',
    logoUrl: '',
    category: 'Cafe',
    offersCount: 1
  },
  {
    id: '3',
    name: 'Strike Zone Lanes',
    address: '789 Pine Road, Woodstock, NY',
    website: '',
    logoUrl: '',
    category: 'Entertainment',
    offersCount: 1
  }
];

const categories = ['Restaurant', 'Cafe', 'Entertainment', 'Retail', 'Services', 'Other'];

export function BusinessesScreen() {
  const [businesses, setBusinesses] = useState(mockBusinesses);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState(null);

  const filteredBusinesses = businesses.filter(biz =>
    biz.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this business?')) {
      setBusinesses(businesses.filter(b => b.id !== id));
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Businesses</h1>
          <p className="text-gray-500 mt-1">Manage local business partners</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} />
          Add Business
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search businesses..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none"
          />
        </div>
      </div>

      {/* Businesses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBusinesses.map(biz => (
          <motion.div
            key={biz.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 p-5"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="text-primary" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{biz.name}</h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {biz.category}
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <MapPin size={14} />
                <span>{biz.address}</span>
              </div>
              {biz.website && (
                <div className="flex items-center gap-2">
                  <Globe size={14} />
                  <a href={biz.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    Website
                  </a>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {biz.offersCount} active offer{biz.offersCount !== 1 ? 's' : ''}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingBusiness(biz)}
                  className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(biz.id)}
                  className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredBusinesses.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Building2 size={48} className="mx-auto mb-4 opacity-30" />
          <p>No businesses found</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || editingBusiness) && (
          <BusinessModal
            business={editingBusiness}
            onClose={() => {
              setShowCreateModal(false);
              setEditingBusiness(null);
            }}
            onSave={(data) => {
              if (editingBusiness) {
                setBusinesses(businesses.map(b =>
                  b.id === editingBusiness.id ? { ...b, ...data } : b
                ));
              } else {
                setBusinesses([...businesses, { ...data, id: Date.now().toString(), offersCount: 0 }]);
              }
              setShowCreateModal(false);
              setEditingBusiness(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function BusinessModal({ business, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: business?.name || '',
    address: business?.address || '',
    website: business?.website || '',
    category: business?.category || 'Restaurant'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-xl z-50 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {business ? 'Edit Business' : 'Add Business'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
            >
              {business ? 'Save Changes' : 'Add Business'}
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}

export default BusinessesScreen;
