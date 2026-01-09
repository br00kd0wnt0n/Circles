export function CircleBadge({ name, color, size = 'sm' }) {
  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1'
  };

  return (
    <span
      className={`inline-block rounded-full font-medium ${sizes[size]}`}
      style={{
        backgroundColor: `${color}20`,
        color: color
      }}
    >
      {name}
    </span>
  );
}
