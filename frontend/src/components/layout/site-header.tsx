import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cx } from "@/lib/cx";

export function SiteHeader({
  trailing,
  compact,
}: {
  trailing?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <header className={cx("site-header", compact && "site-header--compact")}>
      <div className="site-header__inner">
        <Logo compact={compact} />
        <div className="site-header__actions">
          <ThemeToggle />
          {trailing}
        </div>
      </div>
    </header>
  );
}
