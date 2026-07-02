export default function Footer({ children }) {
  return (
    <>
      <footer className="mt-auto border-t border-slate-800/70 bg-slate-950/90 px-4 py-3 text-center text-xs text-slate-300 backdrop-blur sm:px-6">
        <p>
          © 2026-2027{" "}
          <a
            href="https://www.leanin-coaching.com/"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-sky-300 transition hover:text-sky-200"
          >
           Lean In Coaching
          </a>{" "}
          All rights reserved.
        </p>
      </footer>

      {children}
    </>
  );
}