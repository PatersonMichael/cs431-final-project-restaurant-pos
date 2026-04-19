import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/useCart.js";
import { createOrder } from "../api/orders.js";
import { createPayment, type CardData } from "../api/payments.js";

const TAX_PERCENT = 8.5;
const STORE_NUMBER = 100;

const CheckoutPage = () => {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState("");
  const [tip, setTip] = useState(0);
  const [paymentType, setPaymentType] = useState("cash");
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expirationMonth, setExpirationMonth] = useState("");
  const [expirationYear, setExpirationYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tax = subtotal * (TAX_PERCENT / 100);
  const total = subtotal + tax + tip;

  const handleCheckout = async () => {
    if (!customerName.trim()) {
      setError("Please enter a customer name.");
      return;
    }
    if (items.length === 0) {
      setError("No items in order.");
      return;
    }

    let cardData: CardData | undefined;
    if (paymentType === "card") {
      const digits = cardNumber.replace(/\s/g, "");
      if (digits.length < 13 || digits.length > 19) {
        setError("Please enter a valid card number.");
        return;
      }
      if (!cardholderName.trim() || !expirationMonth || !expirationYear) {
        setError("Please fill in all card details.");
        return;
      }
      const firstDigit = digits[0];
      const brand =
        firstDigit === "4" ? "Visa" :
        firstDigit === "5" ? "Mastercard" :
        firstDigit === "3" ? "Amex" :
        firstDigit === "6" ? "Discover" : "Unknown";
      cardData = {
        cardholderName: cardholderName.trim(),
        lastFour: digits.slice(-4),
        brand,
        expirationMonth: Number(expirationMonth),
        expirationYear: Number(expirationYear),
      };
    }

    setLoading(true);
    setError(null);

    try {
      const order = await createOrder({
        customerName,
        storeNumber: STORE_NUMBER,
        taxPercent: TAX_PERCENT,
        tip,
        items,
      });

      await createPayment({ orderId: order.orderId, type: paymentType, amount: parseFloat(total.toFixed(2)), cardData });

      clearCart();
      navigate("/", { state: { successMessage: `Order #${order.orderId} placed successfully!` } });
    } catch (err) {
      setError("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div style={{ padding: "1rem" }}>
        <h1>Checkout</h1>
        <p>No items in your order.</p>
        <button onClick={() => navigate("/")}>Back to Menu</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "1rem", maxWidth: "500px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Checkout</h1>
        <button onClick={() => navigate("/order")}>Back to Order</button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="customerName">Customer Name</label>
        <br />
        <input
          id="customerName"
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          style={{ width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
        />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="tip">Tip ($)</label>
        <br />
        <input
          id="tip"
          type="number"
          min="0"
          step="0.01"
          value={tip}
          onChange={(e) => setTip(Number(e.target.value))}
          style={{ width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
        />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="paymentType">Payment Type</label>
        <br />
        <select
          id="paymentType"
          value={paymentType}
          onChange={(e) => setPaymentType(e.target.value)}
          style={{ width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
        >
          <option value="cash">Cash</option>
          <option value="card">Card</option>
        </select>
      </div>

      {paymentType === "card" && (
        <div style={{ marginBottom: "1rem", padding: "1rem", border: "1px solid #ccc", borderRadius: "4px" }}>
          <h3 style={{ marginTop: 0 }}>Card Details</h3>
          <div style={{ marginBottom: "0.75rem" }}>
            <label htmlFor="cardholderName">Cardholder Name</label>
            <br />
            <input
              id="cardholderName"
              type="text"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              placeholder="Name on card"
              style={{ width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
            />
          </div>
          <div style={{ marginBottom: "0.75rem" }}>
            <label htmlFor="cardNumber">Card Number</label>
            <br />
            <input
              id="cardNumber"
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              style={{ width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
            />
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ flex: 1 }}>
              <label htmlFor="expirationMonth">Exp. Month</label>
              <br />
              <select
                id="expirationMonth"
                value={expirationMonth}
                onChange={(e) => setExpirationMonth(e.target.value)}
                style={{ width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
              >
                <option value="">MM</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="expirationYear">Exp. Year</label>
              <br />
              <select
                id="expirationYear"
                value={expirationYear}
                onChange={(e) => setExpirationYear(e.target.value)}
                style={{ width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
              >
                <option value="">YYYY</option>
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div style={{ borderTop: "1px solid #ccc", paddingTop: "1rem", marginBottom: "1rem" }}>
        <p>Subtotal: ${subtotal.toFixed(2)}</p>
        <p>Tax ({TAX_PERCENT}%): ${tax.toFixed(2)}</p>
        <p>Tip: ${tip.toFixed(2)}</p>
        <p><strong>Total: ${total.toFixed(2)}</strong></p>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button onClick={() => navigate("/order")}>Back</button>
        <button onClick={handleCheckout} disabled={loading}>
          {loading ? "Processing..." : "Place Order"}
        </button>
      </div>
    </div>
  );
};

export default CheckoutPage;