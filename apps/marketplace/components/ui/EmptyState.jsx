/**
 * EmptyState — Placeholder component for empty data states
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionButton,
  className = "",
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-remat-blue flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-remat-green/60" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-sm mb-6">{description}</p>
      )}
      {actionButton && <div>{actionButton}</div>}
    </div>
  );
}
