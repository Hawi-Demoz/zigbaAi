"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="error-page">
      <h1>Something went wrong</h1>
      <p className="lede">
        The page could not be loaded. Your data was not changed. Try again, or
        return to the home page.
      </p>
      <div className="hero__actions">
        <button type="button" className="btn btn--primary" onClick={() => reset()}>
          Try again
        </button>
        <a href="/" className="btn btn--secondary">
          Go home
        </a>
      </div>
    </div>
  );
}
