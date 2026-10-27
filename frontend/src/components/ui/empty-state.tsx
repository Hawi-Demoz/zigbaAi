export function EmptyState({
  title,
  body,
}: {
  title: string;
  body?: string;
}) {
  return (
    <div className="empty">
      <span className="empty__rule" aria-hidden="true" />
      <p className="empty__title">{title}</p>
      {body ? <p className="empty__body">{body}</p> : null}
    </div>
  );
}
