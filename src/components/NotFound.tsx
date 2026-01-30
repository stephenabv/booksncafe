import { Link } from "react-router-dom";

const NotFound: React.FC = () => {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <img
        src="https://images.unsplash.com/photo-1551024709-8f23befc6f92?&w=400"
        alt="Books & Coffee"
        className="mb-6 w-64 object-cover rounded-lg shadow-lg"
      />
      <h1 className="mb-2 text-7xl font-bold text-amber-500">404</h1>
      <h2 className="mb-4 text-2xl font-semibold text-neutral-100">Page Not Found</h2>
      <p className="mb-8 max-w-md text-sm text-neutral-400">
        Oops! The page you’re looking for doesn’t exist. Perhaps you want to explore our books or enjoy a cup of coffee instead.
      </p>
      <Link
        to="/"
        className="rounded-xl bg-amber-500 px-6 py-3 text-sm font-medium text-neutral-900 transition hover:bg-amber-400"
      >
        Back to Home
      </Link>
    </div>
  );
};

export default NotFound;
