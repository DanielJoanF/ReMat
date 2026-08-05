/**
 * SkeletonLoader — Loading placeholders for cards, tables, and detail pages
 */

export function CardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton h-48 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-3 w-20" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-3/4" />
        <div className="flex gap-4 mt-2">
          <div className="skeleton h-3 w-16" />
          <div className="skeleton h-3 w-16" />
        </div>
        <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
          <div>
            <div className="skeleton h-3 w-16 mb-1" />
            <div className="skeleton h-5 w-24" />
          </div>
          <div className="skeleton h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left col */}
      <div className="lg:col-span-2 space-y-4">
        <div className="skeleton h-72 w-full rounded-card" />
        <div className="skeleton h-8 w-3/4" />
        <div className="skeleton h-4 w-1/2" />
        <div className="space-y-2">
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-5/6" />
        </div>
      </div>
      {/* Right col */}
      <div className="space-y-4">
        <div className="skeleton h-48 w-full rounded-card" />
        <div className="skeleton h-32 w-full rounded-card" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </>
  );
}

export default { CardSkeleton, TableRowSkeleton, DetailPageSkeleton, CardGridSkeleton };
