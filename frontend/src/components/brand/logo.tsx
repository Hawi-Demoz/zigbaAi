import Link from "next/link";
import { cx } from "@/lib/cx";

export function Logo({
  href = "/",
  compact = false,
}: {
  href?: string;
  compact?: boolean;
}) {
  return (
    <Link href={href} className={cx("logo", compact && "logo--compact")}>
      <span className="logo__mark" aria-hidden="true">
        <span className="logo__rule" />
        <span className="logo__rule" />
        <span className="logo__rule logo__rule--tick" />
      </span>
      <span className="logo__word">
        <span className="logo__name">Zigba</span>
        {!compact && <span className="logo__rest"> Network</span>}
      </span>
    </Link>
  );
}
