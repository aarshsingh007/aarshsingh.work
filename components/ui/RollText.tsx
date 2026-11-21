/**
 * Text that rolls up on hover/focus of the nearest `.group` ancestor: the
 * label slides out the top while an identical copy slides in from below.
 * The copy is aria-hidden, so the accessible name is read once.
 * No movement under prefers-reduced-motion.
 */
export default function RollText({ children, className = "" }: { children: string; className?: string }) {
  return (
    <span className={`relative inline-block overflow-hidden align-top ${className}`}>
      <span className="block transition-transform duration-[450ms] ease-[cubic-bezier(0.65,0,0.35,1)] group-hover:-translate-y-full group-focus-visible:-translate-y-full motion-reduce:transition-none motion-reduce:group-hover:translate-y-0 motion-reduce:group-focus-visible:translate-y-0">
        <span className="block">{children}</span>
        <span aria-hidden="true" className="absolute top-full left-0 block">
          {children}
        </span>
      </span>
    </span>
  );
}
