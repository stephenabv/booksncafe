import { BrowserRouter } from "react-router-dom";
import AppRouter from "./App.router";
import { CartProvider } from "./modules/Cart";

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <AppRouter />
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
