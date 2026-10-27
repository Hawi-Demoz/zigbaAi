import { cx } from "@/lib/cx";

export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("field", className)}>
      <label className="field__label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint ? <p className="field__hint">{hint}</p> : null}
    </div>
  );
}

export function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  return <input {...props} className={cx("input", props.className)} />;
}

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return <textarea {...props} className={cx("input input--area", props.className)} />;
}
