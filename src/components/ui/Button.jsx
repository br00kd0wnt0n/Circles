import { motion } from 'framer-motion';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) {
  const baseStyles = 'font-medium rounded-2xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variants = {
    primary: 'bg-[#F4A69A] text-white hover:bg-[#e8958a] focus:ring-[#F4A69A]',
    secondary: 'bg-[#E8F0E3] text-[#1F2937] hover:bg-[#dce8d5] focus:ring-[#9CAF88]',
    ghost: 'bg-transparent text-[#6B7280] hover:bg-gray-100 focus:ring-gray-300',
    outline: 'border-2 border-[#9CAF88] text-[#9CAF88] hover:bg-[#E8F0E3] focus:ring-[#9CAF88]'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
