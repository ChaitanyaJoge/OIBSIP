
import { useState } from "react";
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

const [showAdminLogin, setShowAdminLogin] = useState(false);
const [adminEmail, setAdminEmail] = useState("");
const [adminPassword, setAdminPassword] = useState("");
const [adminToken, setAdminToken] = useState("");
const [adminMessage, setAdminMessage] = useState("");
const [adminLoading, setAdminLoading] = useState(false);


  const [orders, setOrders] = useState([]);
const [loadingOrders, setLoadingOrders] = useState(false);

const fetchOrders = async () => {
  setLoadingOrders(true);

  try {
    const response = await axios.get(
  "http://localhost:5001/api/orders",
  {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  }
);
    setOrders(response.data.orders);
    setMessage("");
  } catch (error) {
    setMessage("Could not load order history. Please try again.");
  } finally {
    setLoadingOrders(false);
  }
};


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
      selectedToppings.length ? selectedToppings.join(", ") : "No extra toppings"
    }${addCheese ? ", Extra cheese" : ""}`,
    price: customPizzaPrice,
    emoji: "🍕",
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

    try {
      const response = await axios.post(
        "http://localhost:5001/api/orders",
        {
          items: cart,
          total,
        }
      );

      setMessage(
        `${response.data.message} Order ID: ${response.data.order.orderId}`
      );
      setCart([]);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Could not place your order."
      );
    }
  };


  return (
    <div className="app">

<header className="navbar">
  <a className="brand" href="/">🍕 PizzaCraft</a>

  <div className="navbar-actions">
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

<section className="cart-section order-history">
  <div className="section-heading">
    <div>
      <p className="eyebrow">YOUR ACTIVITY</p>
      <h2>Order History</h2>
    </div>

    <button
      className="outline-button"
      onClick={fetchOrders}
      disabled={loadingOrders}
    >
      {loadingOrders ? "Loading..." : "View Orders"}
    </button>
  </div>

  {orders.length === 0 ? (
    <p>No orders loaded yet. Click "View Orders" to see your saved orders.</p>
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
