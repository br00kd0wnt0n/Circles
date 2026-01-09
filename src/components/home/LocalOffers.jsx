import { motion } from 'framer-motion';
import { Tag, ChevronRight } from 'lucide-react';
import { localOffers } from '../../data/seedData';

export function LocalOffers() {
  // Show 2-3 random offers
  const displayOffers = localOffers.slice(0, 3);

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Tag size={14} className="text-[#F4A69A]" />
          <h3 className="text-sm font-medium text-[#1F2937]">Local Offers</h3>
        </div>
        <button className="text-xs text-[#9CAF88] font-medium flex items-center gap-0.5">
          See all
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-4 px-4 pb-2">
        {displayOffers.map((offer, index) => (
          <motion.button
            key={offer.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-shrink-0 w-[160px] bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-left"
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-2xl">{offer.icon}</span>
              <span
                className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${offer.color}20`,
                  color: offer.color
                }}
              >
                DEAL
              </span>
            </div>
            <p className="text-xs font-semibold text-[#1F2937] leading-tight">
              {offer.offer}
            </p>
            <p className="text-[10px] text-[#6B7280] mt-0.5">
              {offer.business}
            </p>
            <p className="text-[10px] text-[#9CAF88] mt-1.5">
              {offer.validUntil}
            </p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
