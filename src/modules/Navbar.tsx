import { useState, useEffect, useRef } from "react";
import { Link, NavLink } from "react-router-dom";
import Banner from '../assets/banner.png';
import { ShoppingCart } from "lucide-react";
import { useCart } from "./Cart";

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const { cart } = useCart();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && navRef.current && !navRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const links = [
    { name: "Home", path: "/" },
    { name: "Books", path: "/books" },
    { name: "Cafe Menu", path: "/menu" },
    { name: "Events", path: "/events" },
    { name: "About", path: "/about" },
  ];

  return (
    <header
      ref={navRef}
      className={`sticky top-0 z-50 transition-all ${scrolled ? "bg-neutral-900 shadow-md py-2" : "bg-neutral-900 py-4"
        }`}
    >
      <nav className="mx-auto max-w-7xl px-6 flex items-center justify-between">
        {/* Logo + Banner */}
        <Link to="/" className="flex items-center">
          <img
            src={Banner}
            alt="Books n Cafe"
            className="h-16 md:h-16 object-contain transition-all"
          />
          <span className="hidden md:inline text-xl font-semibold tracking-wide text-white">
            Books ’n Cafe
          </span>
        </Link>

        {/* Desktop Links */}
        <ul className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <li key={link.name}>
              <NavLink
                to={link.path}
                className={({ isActive }) =>
                  isActive
                    ? "text-amber-400"
                    : "text-neutral-300 hover:text-amber-400"
                }
              >
                {link.name}
              </NavLink>
            </li>
          ))}
        </ul>
        <Link
          to="/cart"
          className="relative flex items-center justify-center text-neutral-300 hover:text-amber-400 transition"
          aria-label="Cart"
        >
          <ShoppingCart className="h-6 w-6" />

          {cart.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-4.5 h-4.5 flex items-center justify-center rounded-full bg-amber-500 text-[11px] font-bold text-neutral-900">
              {cart.length}
            </span>
          )}
        </Link>


        {/* Mobile Toggle */}
        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          <span className="block w-6 h-0.5 bg-white mb-1"></span>
          <span className="block w-6 h-0.5 bg-white mb-1"></span>
          <span className="block w-6 h-0.5 bg-white"></span>
        </button>
      </nav>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden mt-4 px-6 space-y-4">
          {links.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className="block text-neutral-300 hover:text-amber-400"
            >
              {link.name}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
};

export default Navbar;
