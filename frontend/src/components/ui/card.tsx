import { cx } from "@/lib/cx";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("card", className)} {...props} />;
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="card__head">
      <div>
        <h2 className="card__title">{title}</h2>
        {description ? <p className="card__desc">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
