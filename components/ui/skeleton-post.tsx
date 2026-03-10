export function SkeletonPost() {
  return (
    <div className="mb-4 p-4 bg-card rounded-xl border border-border animate-pulse">
      <div className="flex gap-3 mb-3">
        <div className="h-12 w-12 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-3 w-24 bg-muted rounded" />
        </div>
      </div>
      <div className="space-y-2 mb-3">
        <div className="h-4 bg-muted rounded" />
        <div className="h-4 w-5/6 bg-muted rounded" />
        <div className="h-4 w-4/6 bg-muted rounded" />
      </div>
      <div className="h-64 bg-muted rounded-lg mb-3" />
      <div className="flex gap-4">
        <div className="h-8 w-20 bg-muted rounded" />
        <div className="h-8 w-20 bg-muted rounded" />
        <div className="h-8 w-20 bg-muted rounded" />
      </div>
    </div>
  )
}
