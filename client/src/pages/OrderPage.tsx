import { useNavigate } from "react-router-dom";
import { useCart } from "../context/useCart.js";

const OrderPage = () => {
  const { items, removeItem, updateQuantity, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div style={{ padding: "1rem" }}>
        <h1>Your Order</h1>
        <p>No items in your order yet.</p>
        <button onClick={() => navigate("/")}>Back to Menu</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Your Order</h1>
        <button onClick={() => navigate("/")}>Back to Menu</button>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid #ccc" }}>Item</th>
            <th style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid #ccc" }}>Price</th>
            <th style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid #ccc" }}>Quantity</th>
            <th style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid #ccc" }}>Total</th>
            <th style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid #ccc" }}></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.itemId}>
              <td style={{ padding: "0.5rem" }}>
                {item.name}
                <span style={{ fontSize: "0.75rem", color: "#888", marginLeft: "0.5rem" }}>
                  {item.itemType === "package" ? "(package)" : ""}
                </span>
              </td>
              <td style={{ padding: "0.5rem" }}>${item.priceAtPurchase.toFixed(2)}</td>
              <td style={{ padding: "0.5rem" }}>
                <button onClick={() => updateQuantity(item.itemId, item.quantity - 1)}>-</button>
                <span style={{ margin: "0 0.5rem" }}>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.itemId, item.quantity + 1)}>+</button>
              </td>
              <td style={{ padding: "0.5rem" }}>
                ${(item.priceAtPurchase * item.quantity).toFixed(2)}
              </td>
              <td style={{ padding: "0.5rem" }}>
                <button onClick={() => removeItem(item.itemId)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: "1rem", textAlign: "right" }}>
        <p><strong>Subtotal: ${subtotal.toFixed(2)}</strong></p>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
        <button onClick={() => { clearCart(); navigate("/"); }}>Cancel Order</button>
        <button onClick={() => navigate("/checkout")}>Proceed to Checkout</button>
      </div>
    </div>
  );
};

export default OrderPage;