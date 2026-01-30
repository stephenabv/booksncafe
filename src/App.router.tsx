import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import MainLayout from "./layout/Layout";
import Home from "./components/Home";
import Books from "./components/Books";
import CafeMenu from "./components/CafeMenu";
import Events from "./components/Events";
import About from "./components/About";
import NotFound from "./components/NotFound";
import ViewCart from "./components/Cart";

const AppRouter: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
          <Route path="/books" element={<PageWrapper><Books /></PageWrapper>} />
          <Route path="/menu" element={<PageWrapper><CafeMenu /></PageWrapper>} />
          <Route path="/events" element={<PageWrapper><Events /></PageWrapper>} />
          <Route path="/about" element={<PageWrapper><About /></PageWrapper>} />
          <Route path="/cart" element={<ViewCart />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
};

const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.5 }}
    className="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
  >
    {children}
  </motion.div>
);

export default AppRouter;
