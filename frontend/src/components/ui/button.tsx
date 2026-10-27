import { cx } from "@/lib/cx";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "link";

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cx("btn", `btn--${variant}`, className)}
      {...props}
    />
  );
}
