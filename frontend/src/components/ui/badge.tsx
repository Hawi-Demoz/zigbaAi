import { cx } from "@/lib/cx";

type Tone = "neutral" | "accent" | "ok" | "warn" | "muted";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return <span className={cx("stamp", `stamp--${tone}`, className)}>{children}</span>;
}
