import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Badge } from "@/components/ui/badge";

export function AppHeader({
  role,
  email,
  children,
}: {
  role?: string;
  email?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <header className="site-header site-header--app">
      <div className="site-header__inner">
        <div className="site-header__brand">
          <Logo href="/dashboard" compact />
          {role ? <Badge tone="accent">{role}</Badge> : null}
        </div>
        <div className="site-header__actions">
          {children}
          {email ? <span className="site-header__email">{email}</span> : null}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
