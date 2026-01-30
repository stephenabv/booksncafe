import { useMemo, useState, useEffect } from "react";
import { useCart } from "../modules/Cart";
import { ShoppingCart } from 'lucide-react'
import type { Book } from "../interfaces/IBook";

const BOOKS_PER_PAGE = 9;
const CARD_HEIGHT = 430;
const GRID_GAP = 24;
const LETTER_RANGES = ["A-E", "F-J", "K-O", "P-T", "U-Z"];

const Books: React.FC = () => {
  const { addToCart } = useCart();

  const [books, setBooks] = useState<Book[]>([
    {
      id: 1,
      title: "The Great Gatsby",
      author: "F. Scott Fitzgerald",
      category: "Classic",
      image:
        "https://images.unsplash.com/photo-1528207776546-365bb710ee93?&w=600",
      plot: "A tragic tale of wealth, love, and the American Dream.",
      available: true,
      price: 2500,
    },
    {
      id: 2,
      title: "Pride & Prejudice",
      author: "Jane Austen",
      category: "Romance",
      image:
        "https://images.unsplash.com/photo-1531219432768-0a1201bda3b1?&w=600",
      plot: "Love and misunderstandings in Regency-era England.",
      available: false,
      price: 1500,
    },
    {
      id: 3,
      title: "1984",
      author: "George Orwell",
      category: "Dystopian",
      image:
        "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?&w=600",
      plot: "A chilling vision of surveillance and authoritarianism.",
      available: true,
      price: 1500,
    },
    ...Array.from({ length: 15 }).map((_, i) => ({
      id: i + 4,
      title: `Sample Book ${i + 1}`,
      author: "Various Authors",
      category: ["Classic", "Fantasy", "Romance", "Sci-Fi"][i % 4],
      image:
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?&w=600",
      plot:
        "This is a sample plot description used to demonstrate pagination behavior.",
      available: i % 2 === 0,
      price: 350 + i * 25,
    })),
  ]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [letterRange, setLetterRange] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(books.map((b) => b.category)))],
    [books]
  );

  const isInRange = (title: string, range: string | null) => {
    if (!range) return true;
    const [start, end] = range.split("-");
    const first = title.charAt(0).toUpperCase();
    return first >= start && first <= end;
  };

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(search.toLowerCase()) ||
        book.author.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "All" || book.category === category;
      const matchesRange = isInRange(book.title, letterRange);
      return matchesSearch && matchesCategory && matchesRange;
    });
  }, [books, search, category, letterRange]);

  useEffect(() => setCurrentPage(1), [search, category, letterRange]);

  const totalPages = Math.ceil(filteredBooks.length / BOOKS_PER_PAGE);

  const paginatedBooks = useMemo(() => {
    const start = (currentPage - 1) * BOOKS_PER_PAGE;
    return filteredBooks.slice(start, start + BOOKS_PER_PAGE);
  }, [filteredBooks, currentPage]);

  const addBookToCart = (book: Book) => {
    addToCart({
      id: book.id,
      name: book.title,
      image: book.image,
      type: "book",
      price: book.price,
    });
  };

  return (
    <section className="px-6 py-12 max-w-7xl mx-auto">
      <h1 className="mb-6 text-4xl font-bold text-amber-500">
        Books Collection
      </h1>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or author..."
          className="w-full rounded bg-neutral-900 px-4 py-2 text-white"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded bg-neutral-900 px-3 py-2 text-white"
        >
          {categories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>

        <select
          value={letterRange ?? ""}
          onChange={(e) => setLetterRange(e.target.value || null)}
          className="rounded bg-neutral-900 px-3 py-2 text-white"
        >
          <option value="">All Letters</option>
          {LETTER_RANGES.map((range) => (
            <option key={range}>{range}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      <div
        style={{
          minHeight: Math.ceil(BOOKS_PER_PAGE / 3) * CARD_HEIGHT + GRID_GAP * 2,
        }}
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedBooks.map((book) => (
            <div
              key={book.id}
              className="rounded-xl bg-neutral-800 overflow-hidden flex flex-col"
            >
              <img
                src={book.image}
                alt={book.title}
                className="h-64 w-full object-cover"
              />
              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-amber-400">{book.category}</span>
                  <span
                    className={
                      book.available ? "text-green-400" : "text-red-400"
                    }
                  >
                    {book.available ? "Available" : "Checked Out"}
                  </span>
                </div>

                <h2 className="text-white font-semibold">{book.title}</h2>
                <p className="text-neutral-400 text-sm">{book.author}</p>
                <p className="text-amber-400 font-semibold mt-1">
                  ₱{book.price}
                </p>

                <div className="mt-auto flex items-center">
                  <div className="flex flex-row gap-2 overflow-hidden w-full">
                    <button
                      onClick={() => setSelectedBook(book)}
                      className="w-full rounded bg-amber-500 py-2 text-neutral-900 font-semibold"
                    >
                      View Details
                    </button>

                    <button
                      disabled={!book.available}
                      onClick={() => addBookToCart(book)}
                      className={`flex items-center justify-center w-full rounded py-2 font-semibold ${book.available
                        ? "bg-green-500 text-neutral-900 hover:bg-green-600"
                        : "bg-neutral-700 text-neutral-400 cursor-not-allowed"
                        }`}
                    >
                      <ShoppingCart size={24} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination (Prev/Next only) */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-4 py-2 rounded bg-neutral-700 text-white disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-4 py-2 rounded bg-neutral-700 text-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Modal */}
      {selectedBook && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-neutral-900 rounded-xl max-w-4xl w-full grid grid-cols-1 overflow-hidden">
            <div className="p-6 flex flex-col">
              <img
                src={selectedBook.image}
                alt={selectedBook.title}
                className="h-75 w-full object-cover rounded"
              />
              <div className="mt-4 space-y-2">
                <h2 className="text-2xl font-bold text-white">
                  {selectedBook.title}
                </h2>
                <p className="text-neutral-400">{selectedBook.author}</p>
                <p className="text-neutral-300 text-sm">{selectedBook.plot}</p>
                <p className="text-amber-400 font-semibold">
                  ₱{selectedBook.price}
                </p>
                <p
                  className={
                    selectedBook.available
                      ? "text-green-400"
                      : "text-red-400"
                  }
                >
                  {selectedBook.available ? "Available" : "Checked Out"}
                </p>
                <button
                  disabled={!selectedBook.available}
                  onClick={() => {
                    addBookToCart(selectedBook);
                    setSelectedBook(null);
                  }}
                  className={`w-full py-3 rounded font-semibold ${selectedBook.available
                    ? "bg-green-500 text-neutral-900 hover:bg-green-600"
                    : "bg-neutral-700 text-neutral-400 cursor-not-allowed"
                    }`}
                >
                  Add to Cart
                </button>

                <button
                  onClick={() => setSelectedBook(null)}
                  className="w-full py-3 rounded bg-neutral-800 text-white hover:bg-neutral-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Books;
