import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, X, Tag, Calendar, Building2 } from 'lucide-react';

// Mock offers data
const mockOffers = [
  {
    id: '1',
    title: '20% Off Your First Order',
    description: 'New customer discount on any menu item',
    businessName: 'Joes Pizza',
    promoCode: 'CIRCLES20',
    validUntil: '2024-03-31',
    color: '#E57373',
    isActive: true
  },
  {
    id: '2',
    title: 'Free Dessert with Family Dinner',
    description: 'Complimentary dessert for parties of 4 or more',
    businessName: 'Garden Cafe',
    promoCode: 'FAMILYFUN',
    validUntil: '2024-04-15',
    color: '#9CAF88',
    isActive: true
  },
  {
    id: '3',
    title: 'Kids Bowl Free',
    description: 'One free kids bowling game with adult purchase',
    businessName: 'Strike Zone Lanes',
    promoCode: 'KIDSBOWL',
    validUntil: '2024-03-15',
    color: '#64B5F6',
    isActive: false
  }
];

export function OffersScreen() {
  const [offers, setOffers] = useState(mockOffers);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);

  const filteredOffers = offers.filter(offer =>
    offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.businessName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this offer?')) {
      setOffers(offers.filter(o => o.id !== id));
    }
  };

  const handleToggleActive = (id) => {
    setOffers(offers.map(o =>
      o.id === id ? { ...o, isActive: !o.isActive } : o
    ));
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Offers</h1>
          <p className="text-gray-500 mt-1">Manage local business offers</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} />
          Add Offer
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
            placeholder="Search offers..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>
      </div>

      {/* Offers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOffers.map(offer => (
          <motion.div
            key={offer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
          >
            {/* Color strip */}
            <div className="h-2" style={{ backgroundColor: offer.color }} />

            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{offer.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{offer.businessName}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  offer.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {offer.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-4">{offer.description}</p>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <Tag size={14} />
                  <span>{offer.promoCode}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>Until {offer.validUntil}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleActive(offer.id)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    offer.isActive
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-primary/10 text-primary hover:bg-primary/20'
                  }`}
                >
                  {offer.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => setEditingOffer(offer)}
                  className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(offer.id)}
                  className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredOffers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Tag size={48} className="mx-auto mb-4 opacity-30" />
          <p>No offers found</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || editingOffer) && (
          <OfferModal
            offer={editingOffer}
            onClose={() => {
              setShowCreateModal(false);
              setEditingOffer(null);
            }}
            onSave={(offerData) => {
              if (editingOffer) {
                setOffers(offers.map(o =>
                  o.id === editingOffer.id ? { ...o, ...offerData } : o
                ));
              } else {
                setOffers([...offers, { ...offerData, id: Date.now().toString() }]);
              }
              setShowCreateModal(false);
              setEditingOffer(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function OfferModal({ offer, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: offer?.title || '',
    description: offer?.description || '',
    businessName: offer?.businessName || '',
    promoCode: offer?.promoCode || '',
    validUntil: offer?.validUntil || '',
    color: offer?.color || '#9CAF88',
    isActive: offer?.isActive ?? true
  });

  const colors = ['#9CAF88', '#E57373', '#64B5F6', '#FFB74D', '#BA68C8', '#4DB6AC'];

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
            {offer ? 'Edit Offer' : 'Create Offer'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business</label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Promo Code</label>
              <input
                type="text"
                value={formData.promoCode}
                onChange={(e) => setFormData({ ...formData, promoCode: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
            <input
              type="date"
              value={formData.validUntil}
              onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div className="flex gap-2">
              {colors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
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
              {offer ? 'Save Changes' : 'Create Offer'}
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}

export default OffersScreen;
