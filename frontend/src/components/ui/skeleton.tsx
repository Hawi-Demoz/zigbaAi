export function SkeletonPage({ label = "Loading" }: { label?: string }) {
  return (
    <div className="skel" role="status" aria-live="polite" aria-label={label}>
      <div className="skel__bar skel__bar--lg" />
      <div className="skel__bar" />
      <div className="skel__grid">
        <div className="skel__block" />
        <div className="skel__block" />
        <div className="skel__block" />
      </div>
    </div>
  );
}
