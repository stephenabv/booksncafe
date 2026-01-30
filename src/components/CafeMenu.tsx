import { useMemo, useState, useEffect } from "react";
import { useCart } from "../modules/Cart";
import { ShoppingCart } from "lucide-react";

type MenuItem = {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
};

const ITEMS_PER_PAGE = 9;
const LETTER_RANGES = ["A-E", "F-J", "K-O", "P-T", "U-Z"];

// card height ≈ 448px × 3 rows = 1344px
const GRID_MIN_HEIGHT = "min-h-[1344px]";

const CafeMenu: React.FC = () => {
  const { addToCart } = useCart();

  const [menuItems] = useState<MenuItem[]>([
    {
      id: 1,
      name: "Espresso",
      price: 120,
      image:
        "https://images.unsplash.com/photo-1606851095660-7f54b95c4a26?&w=400",
      description: "Rich and bold espresso shot to kickstart your day."
    },
    {
      id: 2,
      name: "Cappuccino",
      price: 150,
      image:
        "https://images.unsplash.com/photo-1590080877351-0e7f0a11c60b?&w=400",
      description:
        "Creamy cappuccino with a perfect balance of espresso and froth."
    },
    {
      id: 3,
      name: "Latte",
      price: 160,
      image:
        "https://images.unsplash.com/photo-1589987603570-d3f90f21f879?&w=400",
      description: "Smooth latte with steamed milk and espresso."
    },
    {
      id: 4,
      name: "Mocha",
      price: 170,
      image:
        "https://images.unsplash.com/photo-1617196032321-5cf76a8f2b4a?&w=400",
      description:
        "Chocolate flavored latte with espresso and whipped cream."
    },
    {
      id: 5,
      name: "Blueberry Muffin",
      price: 80,
      image:
        "https://images.unsplash.com/photo-1612197526843-7ad6e7d4fef7?&w=400",
      description: "Freshly baked blueberry muffin with a soft crumb."
    },
    {
      id: 6,
      name: "Americano",
      price: 130,
      image:
        "https://images.unsplash.com/photo-1601924582970-2c1b57b5a99f?&w=400",
      description: "Espresso diluted with hot water for a smooth taste."
    },
    {
      id: 7,
      name: "Flat White",
      price: 155,
      image:
        "https://images.unsplash.com/photo-1613471749780-34b2d0f0d9a2?&w=400",
      description: "Creamy flat white with velvety milk texture."
    },
    {
      id: 8,
      name: "Macchiato",
      price: 140,
      image:
        "https://images.unsplash.com/photo-1621989631128-63e0c2b45a62?&w=400",
      description: "Espresso with a small amount of frothy milk."
    },
    {
      id: 9,
      name: "Cinnamon Roll",
      price: 90,
      image:
        "https://images.unsplash.com/photo-1614851461374-5a0f5918b2a5?&w=400",
      description: "Warm cinnamon roll with sweet glaze."
    },
    {
      id: 10,
      name: "Croissant",
      price: 85,
      image:
        "https://images.unsplash.com/photo-1586985288123-2495f577d88c?&w=400",
      description: "Flaky buttery croissant baked fresh."
    },
    {
      id: 11,
      name: "Iced Latte",
      price: 170,
      image:
        "https://images.unsplash.com/photo-1521305916504-4a1121188589?&w=400",
      description: "Chilled latte perfect for warm days."
    }
  ]);

  const [search, setSearch] = useState("");
  const [letterRange, setLetterRange] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const isInRange = (name: string, range: string | null) => {
    if (!range) return true;
    const [start, end] = range.split("-");
    const firstChar = name[0].toUpperCase();
    return firstChar >= start && firstChar <= end;
  };

  const filteredMenu = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesRange = isInRange(item.name, letterRange);
      return matchesSearch && matchesRange;
    });
  }, [menuItems, search, letterRange]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, letterRange]);

  const totalPages = Math.ceil(filteredMenu.length / ITEMS_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages || 1);
    }
  }, [currentPage, totalPages]);

  const paginatedMenu = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMenu.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMenu, currentPage]);

  const addMenuItemToCart = (item: MenuItem) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      type: "menu"
    });
  };

  return (
    <section className="px-6 py-12 max-w-6xl mx-auto">
      <h1 className="mb-4 text-4xl font-bold text-amber-500 text-center">
        Cafe Menu
      </h1>

      <p className="mb-8 text-center text-neutral-400 max-w-2xl mx-auto">
        Enjoy our freshly brewed coffee, teas, and freshly baked treats.
      </p>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <input
          placeholder="Search menu items..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded bg-neutral-900 px-4 py-2 text-white"
        />

        <select
          value={letterRange ?? ""}
          onChange={e => setLetterRange(e.target.value || null)}
          className="rounded bg-neutral-900 px-4 py-2 text-white"
        >
          <option value="">All Letters</option>
          {LETTER_RANGES.map(range => (
            <option key={range}>{range}</option>
          ))}
        </select>

        <button
          onClick={() => {
            setSearch("");
            setLetterRange(null);
          }}
          className="rounded bg-red-600 px-4 py-2 text-white"
        >
          Clear
        </button>
      </div>

      {/* Grid */}
      <div
        className={`grid gap-8 sm:grid-cols-2 lg:grid-cols-3 place-content-start ${GRID_MIN_HEIGHT}`}
      >
        {paginatedMenu.map(item => (
          <div
            key={item.id}
            className="flex flex-col rounded-lg overflow-hidden bg-neutral-800 shadow"
          >
            <img
              src={item.image}
              alt={item.name}
              className="h-60 w-full object-cover"
            />

            <div className="flex flex-col p-4 h-52">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-white font-semibold truncate">
                  {item.name}
                </h2>
                <span className="text-amber-400 font-medium">
                  ₱{item.price}
                </span>
              </div>

              <p className="text-neutral-400 text-sm line-clamp-3">
                {item.description}
              </p>

              <button
                onClick={() => addMenuItemToCart(item)}
                className="mt-auto flex items-center justify-center w-full rounded bg-green-500 font-semibold text-neutral-900 hover:bg-green-600"
              >
                <ShoppingCart size={28} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-10 flex justify-center gap-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="px-4 py-2 rounded bg-neutral-800 text-white disabled:opacity-40"
          >
            Prev
          </button>

          <button
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage(p => Math.min(totalPages, p + 1))
            }
            className="px-4 py-2 rounded bg-neutral-800 text-white disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
};

export default CafeMenu;
