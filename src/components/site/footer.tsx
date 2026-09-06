import { Logo } from "./logo";
export function Footer() {
  return (
    <footer className="site-footer">
      <Logo />
      <p>Protective textiles. Thoughtfully integrated.</p>
      <a href="#top">Back to top ↑</a>
      <small>© {new Date().getFullYear()} Redline Bulletproof</small>
    </footer>
  );
}
