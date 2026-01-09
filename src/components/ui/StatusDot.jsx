export function StatusDot({ status, size = 'md' }) {
  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const colors = {
    available: 'bg-green-500 status-available',
    open: 'bg-amber-400 status-open',
    busy: 'bg-gray-400'
  };

  return (
    <span className={`inline-block rounded-full ${sizes[size]} ${colors[status]}`} />
  );
}
