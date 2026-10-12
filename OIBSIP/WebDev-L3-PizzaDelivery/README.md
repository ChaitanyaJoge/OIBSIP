# PizzaCraft — Full-Stack Pizza Delivery Application

A full-stack pizza ordering application built with React, Node.js, Express, and MongoDB. Customers can browse pizzas, customize their own pizza, add items to a cart, and place orders. Administrators can log in, view orders, and update order statuses.

## Features

### Customer Features
- Browse the pizza menu and prices.
- Build a custom pizza with a selected base, sauce, cheese, and toppings.
- Add pizzas to the cart and view the order total.
- Place an order and save it to MongoDB.
- View saved orders through the order history interface.

### Admin Features
- Admin login using email and password.
- JWT-based authentication for protected admin operations.
- View saved orders.
- Update order status: Order Received, Preparing, Out for Delivery, and Delivered.

## Technology Stack

**Frontend:** React, Vite, Axios, CSS
**Backend:** Node.js, Express
**Database:** MongoDB with Mongoose
**Authentication:** JSON Web Tokens (JWT), bcryptjs

## Project Structure

```text
WebDev-L3-PizzaDelivery/
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── Admin.js
│   ├── Order.js
│   ├── createAdmin.js
│   ├── index.js
│   ├── package.json
│   └── .env.example
├── .gitignore
└── README.md
```

## Prerequisites

- Node.js and npm
- MongoDB connection string
- Git

## Setup and Installation

### 1. Clone the repository

```bash
git clone https://github.com/ChaitanyaJoge/OIBSIP.git
cd OIBSIP/OIBSIP/WebDev-L3-PizzaDelivery
```

### 2. Configure the backend

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory with these variables:

```env
MONGODB_URI=your_mongodb_connection_string
PORT=5001
JWT_SECRET=your_long_random_secret
ADMIN_EMAIL=your_admin_email
ADMIN_PASSWORD=your_admin_password
```

Use your own credentials. Never commit the real `.env` file or share secrets publicly.

### 3. Start the backend

```bash
npm start
```

The API runs at `http://localhost:5001` when configured successfully.

### 4. Start the frontend

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

Open the local URL shown by Vite, usually `http://localhost:5173`.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check API health |
| POST | `/api/admin/login` | Authenticate an administrator |
| GET | `/api/orders` | Retrieve orders (admin token required) |
| POST | `/api/orders` | Create an order |
| PATCH | `/api/orders/:id/status` | Update an order status (admin token required) |

## Security Notes

- Keep `.env` out of Git.
- Use a strong, private JWT secret.
- The order-list and order-status endpoints require admin authentication.
- Configure production CORS, validation, and customer data access controls before deploying publicly.

## Project Status

The core pizza ordering flow, custom pizza builder, MongoDB order persistence, admin login, and order-status management have been tested locally.

Additional assignment requirements, including customer registration, email verification, password recovery, Razorpay payments, inventory management, and low-stock email alerts, require implementation and testing before they can be considered complete.
