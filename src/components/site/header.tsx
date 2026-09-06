import { ArrowUpRight } from "lucide-react";
import { Logo } from "./logo";
export function Header() {
  return (
    <header className="site-header">
      <Logo />
      <nav aria-label="Main navigation">
        <a href="#story">The material</a>
        <a href="#product">The application</a>
        <a className="nav-contact" href="#contact">
          Let’s talk <ArrowUpRight size={15} aria-hidden="true" />
        </a>
      </nav>
    </header>
  );
}
