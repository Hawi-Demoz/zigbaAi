import { cx } from "@/lib/cx";

type Tone = "info" | "error" | "success";

export function Alert({
  tone = "info",
  title,
  children,
}: {
  tone?: Tone;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cx("alert", `alert--${tone}`)} role={tone === "error" ? "alert" : "status"}>
      {title ? <p className="alert__title">{title}</p> : null}
      <p className="alert__body">{children}</p>
    </div>
  );
}
