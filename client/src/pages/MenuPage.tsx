import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProducts } from "../api/products.js";
import { getPackages } from "../api/packages.js";
import { useCart } from "../context/useCart.js";
import { type Product, type Package } from "../types/index.js";

const MenuPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addItem, items } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const [productsData, packagesData] = await Promise.all([
          getProducts(),
          getPackages(),
        ]);
        setProducts(productsData);
        setPackages(packagesData);
      } catch (err) {
        setError("Failed to load menu. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const handleAddProduct = (product: Product) => {
    addItem({
      itemId: product.orderableItem!.itemId,
      name: product.name,
      quantity: 1,
      priceAtPurchase: Number(product.basePrice),
      itemType: "product",
    });
  };

  const handleAddPackage = (pkg: Package) => {
    addItem({
      itemId: pkg.orderableItem!.itemId,
      name: pkg.name,
      quantity: 1,
      priceAtPurchase: Number(pkg.bundlePrice),
      itemType: "package",
    });
  };

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const productsByType = products.reduce<Record<string, Product[]>>((acc, product) => {
    const typeName = product.productType?.name ?? "Other";
    (acc[typeName] ??= []).push(product);
    return acc;
  }, {});

  if (loading) return <div>Loading menu...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div style={{ padding: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Menu</h1>
        <button onClick={() => navigate("/order")} disabled={cartCount === 0}>
          View Order ({cartCount})
        </button>
      </div>

      <h2>Packages</h2>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        {packages.map((pkg) => (
          <div key={pkg.packageId} style={{ border: "1px solid #ccc", padding: "1rem", width: "200px" }}>
            <h3>{pkg.name}</h3>
            <p>${Number(pkg.bundlePrice).toFixed(2)}</p>
            {pkg.packageProducts && (
              <ul>
                {pkg.packageProducts.map((pp) => (
                  <li key={pp.productId}>{pp.product?.name}</li>
                ))}
              </ul>
            )}
            <button onClick={() => handleAddPackage(pkg)}>Add to Order</button>
          </div>
        ))}
      </div>

      {Object.entries(productsByType).map(([typeName, typeProducts]) => (
        <div key={typeName}>
          <h2>{typeName}</h2>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {typeProducts.map((product) => (
              <div key={product.productId} style={{ border: "1px solid #ccc", padding: "1rem", width: "200px" }}>
                <h3>{product.name}</h3>
                <p>${Number(product.basePrice).toFixed(2)}</p>
                <button onClick={() => handleAddProduct(product)}>Add to Order</button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MenuPage;