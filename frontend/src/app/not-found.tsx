import Link from "next/link";

export default function NotFound() {
  return (
    <div className="error-page">
      <h1>Page not found</h1>
      <p className="lede">
        That address is not in this ledger. Check the link, or start from the
        home page.
      </p>
      <div className="hero__actions">
        <Link href="/" className="btn btn--primary">
          Go home
        </Link>
        <Link href="/login" className="btn btn--secondary">
          Sign in
        </Link>
      </div>
    </div>
  );
}
