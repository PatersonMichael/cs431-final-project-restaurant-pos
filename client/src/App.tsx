import { Routes, Route } from "react-router-dom";
import MenuPage from "./pages/MenuPage.tsx";
import OrderPage from "./pages/OrderPage.tsx";
import CheckoutPage from "./pages/CheckoutPage.tsx";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<MenuPage />} />
      <Route path="/order" element={<OrderPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
    </Routes>
  );
};

export default App;