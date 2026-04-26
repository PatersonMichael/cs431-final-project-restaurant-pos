import { Routes, Route } from "react-router-dom";
import MenuPage from "./pages/MenuPage.tsx";
import OrderPage from "./pages/OrderPage.tsx";
import CheckoutPage from "./pages/CheckoutPage.tsx";
import OrdersManagementPage from "./pages/OrdersManagementPage.tsx";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<MenuPage />} />
      <Route path="/order" element={<OrderPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/orders-management" element={<OrdersManagementPage />} />
    </Routes>
  );
};

export default App;