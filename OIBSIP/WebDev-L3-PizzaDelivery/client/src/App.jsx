import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const pizzas = [
  { id: 1, name: "Margherita", description: "Classic cheese and tomato", price: 199, emoji: "🍕" },
  { id: 2, name: "Farmhouse", description: "Onion, capsicum and corn", price: 279, emoji: "🍕" },
  { id: 3, name: "Paneer Delight", description: "Paneer, onion and spices", price: 299, emoji: "🍕" },
  { id: 4, name: "Spicy Veg", description: "A spicy vegetable mix", price: 249, emoji: "🍕" },
];

const pizzaBases = [
  { name: "Classic Hand Tossed", price: 0 },
  { name: "Thin Crust", price: 30 },
  { name: "Whole Wheat", price: 40 },
  { name: "Cheese Burst", price: 60 },
  { name: "Pan Crust", price: 25 },
];

const pizzaSauces = [
  { name: "Classic Tomato", price: 0 },
  { name: "Spicy Red", price: 10 },
  { name: "Pesto", price: 20 },
  { name: "Garlic White Sauce", price: 20 },
  { name: "BBQ Sauce", price: 15 },
];

const pizzaToppings = [
  { name: "Onion", price: 20 },
  { name: "Capsicum", price: 20 },
  { name: "Sweet Corn", price: 25 },
  { name: "Paneer", price: 40 },
  { name: "Olives", price: 30 },
  { name: "Jalapenos", price: 25 },
];

function App() {
  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState("");
  const [showCustomerAuth, setShowCustomerAuth] = useState(false);
  const [customerMode, setCustomerMode] = useState("login");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPassword, setCustomerPassword] = useState("");
  const [customerToken, setCustomerToken] = useState("");
  const [customer, setCustomer] = useState(null);
  const [customerAuthMessage, setCustomerAuthMessage] = useState("");
  const [customerAuthLoading, setCustomerAuthLoading] = useState(false);

const [showAdminLogin, setShowAdminLogin] = useState(false);
const [adminEmail, setAdminEmail] = useState("");
const [adminPassword, setAdminPassword] = useState("");
const [adminToken, setAdminToken] = useState("");
const [adminMessage, setAdminMessage] = useState("");
const [adminLoading, setAdminLoading] = useState(false);


  const [orders, setOrders] = useState([]);
const [loadingOrders, setLoadingOrders] = useState(false);

const [inventory, setInventory] = useState([]);
const [lowStockItems, setLowStockItems] = useState([]);
const [loadingInventory, setLoadingInventory] = useState(false);
const [inventoryMessage, setInventoryMessage] = useState("");



const fetchOrders = async () => {
  const isAdmin = Boolean(adminToken);
  const isCustomer = Boolean(customerToken);

  if (!isAdmin && !isCustomer) {
    setMessage("Please log in as a customer to view your orders.");
    return;
  }

  setLoadingOrders(true);

  try {
    const response = await axios.get(
      isAdmin
        ? "http://localhost:5001/api/orders"
        : "http://localhost:5001/api/customers/orders",
      {
        headers: {
          Authorization: `Bearer ${isAdmin ? adminToken : customerToken}`,
        },
      }
    );

    setOrders(response.data.orders || []);
    setMessage("");
  } catch (error) {
    setMessage(
      error.response?.data?.message ||
        "Could not load order history. Please try again."
    );
  } finally {
    setLoadingOrders(false);
  }
};



const fetchInventory = async () => {
  if (!adminToken) {
    setInventoryMessage("Please log in as admin to view inventory.");
    return;
  }

  setLoadingInventory(true);
  setInventoryMessage("");

  try {
    const response = await axios.get(
      "http://localhost:5001/api/inventory",
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );

    setInventory(response.data.inventory || []);
    setLowStockItems(response.data.lowStockItems || []);
  } catch (error) {
    setInventoryMessage(
      error.response?.data?.message ||
        "Could not load inventory. Please try again."
    );
  } finally {
    setLoadingInventory(false);
  }
};

useEffect(() => {
  if (adminToken) {
    fetchInventory();
  } else {
    setInventory([]);
    setLowStockItems([]);
  }
}, [adminToken]);

const updateOrderStatus = async (orderId, status) => {
  try {

await axios.patch(
  `http://localhost:5001/api/orders/${orderId}/status`,
  { status },
  {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  }
);


    setMessage("Order status updated successfully!");
    await fetchOrders();
  } catch (error) {
    setMessage("Could not update order status. Please try again.");
  }
};


const [selectedBase, setSelectedBase] = useState(pizzaBases[0].name);
const [selectedSauce, setSelectedSauce] = useState(pizzaSauces[0].name);
const [addCheese, setAddCheese] = useState(false);
const [selectedToppings, setSelectedToppings] = useState([]);

  const addToCart = (pizza) => {
    setCart((current) => [...current, pizza]);
    setMessage("");
  };

  const total = cart.reduce((sum, pizza) => sum + pizza.price, 0);

  const customPizzaPrice =
  (pizzaBases.find((base) => base.name === selectedBase)?.price || 0) +
  (pizzaSauces.find((sauce) => sauce.name === selectedSauce)?.price || 0) +
  199 +
  (addCheese ? 40 : 0) +
  selectedToppings.reduce((sum, toppingName) => {
    const topping = pizzaToppings.find((item) => item.name === toppingName);
    return sum + (topping?.price || 0);
  }, 0);

const toggleTopping = (toppingName) => {
  setSelectedToppings((current) =>
    current.includes(toppingName)
      ? current.filter((name) => name !== toppingName)
      : [...current, toppingName]
  );
};

const addCustomPizzaToCart = () => {
  const customPizza = {
    id: Date.now(),
    name: "Custom Pizza",
    description: `${selectedBase}, ${selectedSauce}, ${
      selectedToppings.length
        ? selectedToppings.join(", ")
        : "No extra toppings"
    }${addCheese ? ", Extra cheese" : ""}`,
    price: customPizzaPrice,
    emoji: "🍕",
    customOptions: {
      base: selectedBase,
      sauce: selectedSauce,
      addCheese,
      toppings: [...selectedToppings],
    },
  };

  setCart((current) => [...current, customPizza]);
  setMessage("Custom pizza added to your cart!");
};

const handleAdminLogin = async (event) => {
  event.preventDefault();
  setAdminLoading(true);
  setAdminMessage("");

  try {
    const response = await axios.post(
      "http://localhost:5001/api/admin/login",
      {
        email: adminEmail,
        password: adminPassword,
      }
    );

    setAdminToken(response.data.token);
    setAdminPassword("");
    setAdminMessage("Admin login successful!");
    setShowAdminLogin(false);
    setMessage("Admin authenticated successfully.");
  } catch (error) {
    setAdminMessage(
      error.response?.data?.message || "Admin login failed."
    );
  } finally {
    setAdminLoading(false);
  }
};


const handleCustomerAuth = async (event) => {
  event.preventDefault();
  setCustomerAuthLoading(true);
  setCustomerAuthMessage("");

  try {
    const endpoint =
      customerMode === "register"
        ? "/api/customers/register"
        : "/api/customers/login";

    const payload =
      customerMode === "register"
        ? {
            name: customerName,
            email: customerEmail,
            password: customerPassword,
          }
        : {
            email: customerEmail,
            password: customerPassword,
          };

    const response = await axios.post(
      `http://localhost:5001${endpoint}`,
      payload
    );

    if (customerMode === "login") {
      setCustomerToken(response.data.token);
      setCustomer(response.data.customer);
      setCustomerPassword("");
      setShowCustomerAuth(false);
      setCustomerAuthMessage("");
      setMessage(`Welcome, ${response.data.customer.name}!`);
    } else {
      setCustomerPassword("");
      setCustomerMode("login");
      setCustomerAuthMessage(
        "Account created successfully! Please log in."
      );
    }
  } catch (error) {
    setCustomerAuthMessage(
      error.response?.data?.message ||
        "Authentication failed. Please try again."
    );
  } finally {
    setCustomerAuthLoading(false);
  }
};

const handleCustomerLogout = () => {
  setCustomerToken("");
  setCustomer(null);
  setCustomerPassword("");
  setCustomerEmail("");
  setCustomerName("");
  setMessage("You have been logged out.");
};


  const testBackend = async () => {
    try {
      const response = await axios.get("http://localhost:5001/api/health");
      setMessage(response.data.message);
    } catch {
      setMessage("Backend unavailable. Make sure the server is running.");
    }
  };


const placeOrder = async () => {
  if (cart.length === 0) {
    setMessage("Please add a pizza before placing your order.");
    return;
  }

  if (!customerToken) {
    setMessage("Please log in as a customer before placing your order.");
    setShowCustomerAuth(true);
    return;
  }

  if (!window.Razorpay) {
    setMessage("Razorpay Checkout did not load. Please refresh the page.");
    return;
  }

  try {
    setMessage("Preparing secure payment...");

    const response = await axios.post(
      "http://localhost:5001/api/payments/create-order",
      { items: cart },
      {
        headers: {
          Authorization: `Bearer ${customerToken}`,
        },
      }
    );

    const paymentOrder = response.data;

    const options = {
      key: paymentOrder.keyId,
      amount: paymentOrder.amount,
      currency: paymentOrder.currency,
      name: "PizzaCraft",
      description: "Pizza Delivery Order",
      order_id: paymentOrder.razorpayOrderId,

      handler: async function (paymentResponse) {
        try {
          setMessage("Verifying payment...");

          const verification = await axios.post(
            "http://localhost:5001/api/payments/verify",
            paymentResponse,
            {
              headers: {
                Authorization: `Bearer ${customerToken}`,
              },
            }
          );

          setMessage(
            `Payment successful! Order ID: ${
              verification.data.order?.orderId || paymentOrder.orderId
            }`
          );

          setCart([]);

          if (typeof fetchOrders === "function") {
            await fetchOrders();
          }

          if (adminToken) {
            await fetchInventory();
          }
        } catch (error) {
          setMessage(
            error.response?.data?.message ||
              "Payment verification failed. Please contact support before trying to pay again."
          );
        }
      },

      modal: {
        ondismiss: function () {
          setMessage(
            "Payment window closed. Check your order status before trying again."
          );
        },
      },

      theme: {
        color: "#e85d04",
      },
    };

    const checkout = new window.Razorpay(options);

    checkout.on("payment.failed", function (paymentError) {
      setMessage(
        paymentError.error?.description ||
          "Payment failed. Please try again."
      );
    });

    checkout.open();
  } catch (error) {
    setMessage(
      error.response?.data?.message ||
        "Could not start payment. Please try again."
    );
  }
};


  return (
    <div className="app">

<header className="navbar">
  <a className="brand" href="/">🍕 PizzaCraft</a>

  <div className="navbar-actions">

{customerToken ? (
  <>
    <span className="customer-welcome">
      Hi, {customer?.name}
    </span>
    <button
      className="outline-button"
      onClick={handleCustomerLogout}
    >
      Logout
    </button>
  </>
) : (
  <button
    className="outline-button"
    onClick={() => {
      setCustomerMode("login");
      setCustomerAuthMessage("");
      setShowCustomerAuth((current) => !current);
    }}
  >
    Customer Login
  </button>
)}

    <button className="outline-button" onClick={testBackend}>
      Test API
    </button>

    <button
      className="outline-button"
      onClick={() => setShowAdminLogin((current) => !current)}
    >
      {adminToken ? "Admin Logged In" : "Admin Login"}
    </button>
  </div>
</header>


      <main>
        <section className="hero">
          <p className="eyebrow">FRESHLY MADE, JUST FOR YOU</p>
          <h1>Your pizza.<br /><span>Your way.</span></h1>
          <p>Choose your favourites and build your perfect pizza experience.</p>
          <a className="primary-button" href="#menu">Explore Menu ↓</a>
        </section>

        {message && <p className="status-message">{message}</p>}

{showCustomerAuth && !customerToken && (
  <section className="cart-section customer-auth">
    <p className="eyebrow">WELCOME TO PIZZACRAFT</p>
    <h2>
      {customerMode === "register"
        ? "Create Your Account"
        : "Customer Login"}
    </h2>

    <p>
      {customerMode === "register"
        ? "Register to get started with your pizza orders."
        : "Sign in to your account."}
    </p>

    <form onSubmit={handleCustomerAuth}>
      {customerMode === "register" && (
        <>
          <label htmlFor="customer-name">Full name</label>
          <input
            id="customer-name"
            type="text"
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            placeholder="Enter your name"
            maxLength={80}
            required
          />
        </>
      )}

      <label htmlFor="customer-email">Email address</label>
      <input
        id="customer-email"
        type="email"
        value={customerEmail}
        onChange={(event) => setCustomerEmail(event.target.value)}
        placeholder="Enter your email"
        required
      />

      <label htmlFor="customer-password">Password</label>
      <input
        id="customer-password"
        type="password"
        value={customerPassword}
        onChange={(event) => setCustomerPassword(event.target.value)}
        placeholder="At least 8 characters"
        minLength={8}
        autoComplete={
          customerMode === "register"
            ? "new-password"
            : "current-password"
        }
        required
      />

      {customerAuthMessage && (
        <p className="status-message" role="status">
          {customerAuthMessage}
        </p>
      )}

      <button
        className="primary-button"
        type="submit"
        disabled={customerAuthLoading}
      >
        {customerAuthLoading
          ? "Please wait..."
          : customerMode === "register"
            ? "Create Account"
            : "Sign In"}
      </button>
    </form>

    <p>
      {customerMode === "register"
        ? "Already registered?"
        : "New to PizzaCraft?"}{" "}
      <button
        type="button"
        className="text-button"
        onClick={() => {
          setCustomerMode(
            customerMode === "register" ? "login" : "register"
          );
          setCustomerAuthMessage("");
          setCustomerPassword("");
        }}
      >
        {customerMode === "register" ? "Sign in" : "Create an account"}
      </button>
    </p>
  </section>
)}


{showAdminLogin && (
  <section className="cart-section admin-login">
    <p className="eyebrow">RESTRICTED ACCESS</p>
    <h2>Admin Login 🔐</h2>
    <p>Sign in to manage pizza orders.</p>

    <form onSubmit={handleAdminLogin}>
      <label htmlFor="admin-email">Email address</label>
      <input
        id="admin-email"
        type="email"
        value={adminEmail}
        onChange={(event) => setAdminEmail(event.target.value)}
        placeholder="Enter admin email"
        required
      />

      <label htmlFor="admin-password">Password</label>
      <input
        id="admin-password"
        type="password"
        value={adminPassword}
        onChange={(event) => setAdminPassword(event.target.value)}
        placeholder="Enter admin password"
        required
      />

      {adminMessage && (
        <p className="status-message">{adminMessage}</p>
      )}

      <button
        className="primary-button"
        type="submit"
        disabled={adminLoading}
      >
        {adminLoading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  </section>
)}


<section className="cart-section custom-builder">
  <p className="eyebrow">MAKE IT YOURS</p>
  <h2>Build Your Own Pizza 🍕</h2>
  <p>Choose your base, sauce, cheese and favourite toppings.</p>

  <label htmlFor="pizza-base">1. Choose your base</label>
  <select
    id="pizza-base"
    value={selectedBase}
    onChange={(event) => setSelectedBase(event.target.value)}
  >
    {pizzaBases.map((base) => (
      <option key={base.name} value={base.name}>
        {base.name} {base.price > 0 ? `(+₹${base.price})` : "(Included)"}
      </option>
    ))}
  </select>

  <label htmlFor="pizza-sauce">2. Choose your sauce</label>
  <select
    id="pizza-sauce"
    value={selectedSauce}
    onChange={(event) => setSelectedSauce(event.target.value)}
  >
    {pizzaSauces.map((sauce) => (
      <option key={sauce.name} value={sauce.name}>
        {sauce.name} {sauce.price > 0 ? `(+₹${sauce.price})` : "(Included)"}
      </option>
    ))}
  </select>

  <label>
    <input
      type="checkbox"
      checked={addCheese}
      onChange={(event) => setAddCheese(event.target.checked)}
    />
    Add extra cheese (+₹40)
  </label>

  <h3>3. Choose your toppings</h3>
  <div className="topping-options">
    {pizzaToppings.map((topping) => (
      <label key={topping.name}>
        <input
          type="checkbox"
          checked={selectedToppings.includes(topping.name)}
          onChange={() => toggleTopping(topping.name)}
        />
        {topping.name} (+₹{topping.price})
      </label>
    ))}
  </div>

  <div className="cart-total">
    <span>Custom pizza price</span>
    <strong>₹{customPizzaPrice}</strong>
  </div>

  <button className="primary-button" onClick={addCustomPizzaToCart}>
    Add Custom Pizza to Cart
  </button>
</section>

        <section id="menu" className="menu-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">OUR MENU</p>
              <h2>Popular pizzas</h2>
            </div>
            <span>{cart.length} item(s) in cart</span>
          </div>

          <div className="pizza-grid">
            {pizzas.map((pizza) => (
              <article className="pizza-card" key={pizza.id}>
                <div className="pizza-art">{pizza.emoji}</div>
                <div className="pizza-info">
                  <h3>{pizza.name}</h3>
                  <p>{pizza.description}</p>
                  <div className="pizza-footer">
                    <strong>₹{pizza.price}</strong>
                    <button onClick={() => addToCart(pizza)}>+ Add</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="cart-section">
          <h2>Your order</h2>
          {cart.length === 0 ? (
            <p>Your cart is empty. Add a pizza to get started.</p>
          ) : (
            <>
              {cart.map((pizza, index) => (
                <div className="cart-row" key={`${pizza.id}-${index}`}>
                  <span>{pizza.name}</span>
                  <strong>₹{pizza.price}</strong>
                  <button
                    className="remove-button"
                    onClick={() => setCart((current) => current.filter((_, i) => i !== index))}
                    aria-label={`Remove ${pizza.name}`}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div className="cart-total">
                <span>Total</span>
                <strong>₹{total}</strong>
              </div>
              <button
                className="primary-button"
                onClick={placeOrder}
              >
                Continue to order
              </button>
            </>
          )}
        </section>


{adminToken && (
  <section className="cart-section admin-inventory">
    <div className="section-heading">
      <div>
        <p className="eyebrow">STOCK CONTROL</p>
        <h2>Admin Inventory 📦</h2>
      </div>

      <button
        className="outline-button"
        onClick={fetchInventory}
        disabled={loadingInventory}
      >
        {loadingInventory ? "Loading..." : "Refresh Inventory"}
      </button>
    </div>

    {inventoryMessage && (
      <p className="status-message">{inventoryMessage}</p>
    )}

    <div className="inventory-summary">
      <article className="inventory-stat">
        <span>Total products</span>
        <strong>{inventory.length}</strong>
      </article>

      <article className="inventory-stat low-stock-stat">
        <span>Low-stock products</span>
        <strong>{lowStockItems.length}</strong>
      </article>
    </div>

    {loadingInventory ? (
      <p>Loading inventory...</p>
    ) : inventory.length === 0 ? (
      <p>No inventory items found. Add stock through the inventory API first.</p>
    ) : (
      <div className="inventory-table-wrapper">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Stock</th>
              <th>Threshold</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {inventory.map((item) => {
              const isLowStock = item.stock <= item.lowStockThreshold;

              return (
                <tr key={item._id}>
                  <td>{item.name}</td>
                  <td>{item.stock}</td>
                  <td>{item.lowStockThreshold}</td>
                  <td>
                    <span
                      className={
                        isLowStock
                          ? "inventory-badge inventory-badge-low"
                          : "inventory-badge inventory-badge-ok"
                      }
                    >
                      {isLowStock ? "Low stock" : "In stock"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </section>
)}


<section className="cart-section order-history">
  <div className="section-heading">
    <div>
      <p className="eyebrow">YOUR ACTIVITY</p>
      <h2>{adminToken ? "All Customer Orders" : "My Order History"}</h2>
    </div>

    {(adminToken || customerToken) && (
      <button
        className="outline-button"
        onClick={fetchOrders}
        disabled={loadingOrders}
      >
        {loadingOrders ? "Loading..." : "Refresh Orders"}
      </button>
    )}
  </div>

  {!adminToken && !customerToken ? (
    <div>
      <p>Please log in to view your personal order history and track deliveries.</p>
      <button
        className="primary-button"
        onClick={() => {
          setCustomerMode("login");
          setCustomerAuthMessage("");
          setShowCustomerAuth(true);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      >
        Customer Login
      </button>
    </div>
  ) : loadingOrders ? (
    <p>Loading your orders...</p>
  ) : orders.length === 0 ? (
    <p>
      No orders found. Place an order and refresh to see it here.
    </p>
  ) : (
    <div className="history-list">
      {orders.map((order) => (
        <article className="history-card" key={order._id}>
          <div className="history-card-header">
            <strong>{order.orderId}</strong>

            {adminToken ? (
              <select
                value={order.status}
                onChange={(event) =>
                  updateOrderStatus(order._id, event.target.value)
                }
                aria-label={`Update status for ${order.orderId}`}
              >
                <option value="Order Received">Order Received</option>
                <option value="Preparing">Preparing</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
              </select>
            ) : (
              <span>{order.status}</span>
            )}
          </div>

          <p>
            {order.items.map((item) => item.name).join(", ")}
          </p>

          <div className="history-card-footer">
            <span>
              {new Date(order.createdAt).toLocaleString()}
            </span>
            <strong>₹{order.total}</strong>
          </div>

          {!adminToken && (
            <p>
              {order.status === "Order Received"
                ? "Your order has been received."
                : order.status === "Preparing"
                  ? "Your pizza is being prepared."
                  : order.status === "Out for Delivery"
                    ? "Your order is on its way!"
                    : order.status === "Delivered"
                      ? "Your order has been delivered."
                      : `Current status: ${order.status}`}
            </p>
          )}
        </article>
      ))}
    </div>
  )}
</section>


      </main>

      <footer>PizzaCraft · Made fresh, made your way.</footer>
    </div>
  );
}

export default App;
