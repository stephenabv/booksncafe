import { Link } from "react-router-dom";
import { useState } from "react";

const Footer: React.FC = () => {

  const year = new Date().getFullYear();
  const links = [
    { name: "Home", path: "/" },
    { name: "Books", path: "/books" },
    { name: "Cafe Menu", path: "/menu" },
    { name: "Events", path: "/events" },
    { name: "About", path: "/about" },
  ];

  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    // TODO: Replace this with API call to subscribe
    alert(`Subscribed with: ${email}`);
    setEmail("");
  };

  return (
    <footer className="bg-neutral-900 text-neutral-300 py-12 px-6 mt-12">
      <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-3">
        {/* About */}
        <div>
          <h3 className="text-amber-400 font-semibold mb-2">Books ’n Cafe</h3>
          <p className="text-sm text-neutral-400">
            Cozy corner for coffee lovers and book enthusiasts. Stories brew here.
          </p>
        </div>

        {/* Sitemap */}
        <div>
          <h3 className="text-amber-400 font-semibold mb-2">Sitemap</h3>
          <ul className="space-y-1 text-sm">
            {links.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.path}
                  className="hover:text-amber-400 transition-colors"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h3 className="text-amber-400 font-semibold mb-2">Subscribe</h3>
          <p className="text-sm text-neutral-400 mb-2">
            Get updates on new books, events, and coffee specials.
          </p>
          <form
            onSubmit={handleSubscribe}
            className="flex flex-col sm:flex-row gap-2"
          >
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded px-3 py-2 text-white w-full sm:flex-1"
              required
            />
            <button
              type="submit"
              className="rounded bg-amber-500 px-4 py-2 font-medium text-neutral-900 hover:bg-amber-400 transition"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      <p className="text-sm text-neutral-500 text-center mt-8">
        &copy; {year} Books ’n Cafe. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
