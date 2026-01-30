import { Link } from "react-router-dom";

const Home: React.FC = () => {
  return (
    <section className="flex flex-col items-center justify-center text-center px-6 py-16 bg-linear-to-b from-neutral-900 to-neutral-800">
      <h1 className="mb-6 text-5xl font-bold text-amber-500 drop-shadow-lg">
        Welcome to Books ’n Cafe
      </h1>
      <p className="mb-8 max-w-2xl text-neutral-300 text-lg leading-relaxed">
        Discover amazing books while sipping handcrafted coffee in a cozy,
        relaxing atmosphere. Explore our collection, attend events, or just
        unwind with your favorite drink.
      </p>

      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          to="/books"
          className="rounded-lg bg-amber-500 px-6 py-3 text-md font-medium transition hover:bg-amber-400"
        >
          Explore Books
        </Link>
        <Link
          to="/menu"
          className="rounded-lg border border-amber-500 px-6 py-3 text-md font-medium text-amber-500 transition hover:bg-amber-500 hover:text-neutral-900"
        >
          View Cafe Menu
        </Link>
      </div>

      {/* Featured Books */}
      <div className="mt-16 w-full max-w-6xl">
        <h2 className="mb-6 text-3xl font-semibold text-amber-400 text-left">
          Featured Books
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "The Great Gatsby",
              author: "F. Scott Fitzgerald",
              image: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?&w=400"
            },
            {
              title: "Pride & Prejudice",
              author: "Jane Austen",
              image: "https://images.unsplash.com/photo-1531219432768-0a1201bda3b1?&w=400"
            },
            {
              title: "1984",
              author: "George Orwell",
              image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?&w=400"
            },
            {
              title: "To Kill a Mockingbird",
              author: "Harper Lee",
              image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?&w=400"
            }
          ].map((book) => (
            <div
              key={book.title}
              className="rounded-lg overflow-hidden bg-neutral-800 shadow-lg hover:shadow-2xl transition"
            >
              <img src={book.image} alt={book.title} className="h-60 w-full object-cover" />
              <div className="p-4 text-left">
                <h3 className="font-semibold text-white">{book.title}</h3>
                <p className="text-sm text-neutral-400">{book.author}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Home;
