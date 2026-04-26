import { useEffect, useState } from "react";
import { getOrders, updateOrderStatus } from "../api/orders.js";
import { type Order } from "../types/index.js";

const PREPARATION_STATUSES = ["pending", "preparing", "ready", "completed"];

const OrdersManagementPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getOrders();
        setOrders(data);
      } catch (err) {
        setError("Failed to load orders.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleStatusUpdate = async (orderId: number, status: string) => {
    try {
      await updateOrderStatus(orderId, status);
      setOrders((prev) =>
        prev.map((o) =>
          o.orderId === orderId ? { ...o, preparationStatus: status } : o
        )
      );
    } catch (err) {
      setError("Failed to update order status.");
    }
  };

  if (loading) return <div style={{ padding: "1rem" }}>Loading orders...</div>;
  if (error) return <div style={{ padding: "1rem", color: "red" }}>{error}</div>;

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Orders Management</h1>

      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Order #", "Customer", "Time", "Items", "Total", "Payment", "Preparation", "Update Status"].map(
                (header) => (
                  <th
                    key={header}
                    style={{
                      textAlign: "left",
                      padding: "0.5rem",
                      borderBottom: "2px solid #ccc",
                    }}
                  >
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.orderId} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "0.5rem" }}>{order.orderId}</td>
                <td style={{ padding: "0.5rem" }}>{order.customerName}</td>
                <td style={{ padding: "0.5rem" }}>
                  {new Date(order.timestamp).toLocaleString()}
                </td>
                <td style={{ padding: "0.5rem" }}>
                  {order.orderItems?.map((item) => (
                    <div key={item.orderItemId}>
                      {item.quantity}x{" "}
                      {item.orderableItem?.product?.name ??
                        item.orderableItem?.package?.name ??
                        "Unknown"}
                    </div>
                  ))}
                </td>
                <td style={{ padding: "0.5rem" }}>
                  ${Number(order.total).toFixed(2)}
                </td>
                <td style={{ padding: "0.5rem" }}>
                  <span
                    style={{
                      color:
                        order.paymentStatus === "paid"
                          ? "green"
                          : order.paymentStatus === "partially_paid"
                          ? "orange"
                          : "red",
                    }}
                  >
                    {order.paymentStatus}
                  </span>
                </td>
                <td style={{ padding: "0.5rem" }}>
                  {order.preparationStatus}
                </td>
                <td style={{ padding: "0.5rem" }}>
                  <select
                    value={order.preparationStatus}
                    onChange={(e) =>
                      handleStatusUpdate(order.orderId, e.target.value)
                    }
                  >
                    {PREPARATION_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default OrdersManagementPage;