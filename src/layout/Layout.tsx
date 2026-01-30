import { Outlet } from "react-router-dom";
import Footer from "../modules/Footer";
import Navbar from "../modules/Navbar";
import FullPageLoader from "../modules/Loader";
import { useState, useEffect } from "react";

const MainLayout: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="grow relative">
        {loading && <FullPageLoader />}
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
