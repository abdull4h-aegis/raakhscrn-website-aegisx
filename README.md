# RAAKHSCRN - Full-Stack E-Commerce Website

This project is a custom-built e-commerce website for the RAAKHSCRN brand. It has been structured into a modern full-stack application, completely separating the frontend (what the user sees) from the backend (server and database).

## Folder Structure

The project is divided into two main parts:

### 1. `frontend/`
This folder contains everything the user interacts with in their browser.
- **`index.html`**: The main webpage containing the beautiful design, styling, products, and checkout UI.
- **`script.js`**: The frontend logic that controls the slide-out cart drawer, calculates totals, manages `localStorage`, and securely sends the order data to your backend API.

### 2. `backend/`
This folder contains the server infrastructure built on Node.js and Express.
- **`server.js`**: The core API server. It connects to your MongoDB database, listens for new orders from the frontend, and securely saves them. It also provides a password-protected `/admin` panel to view orders.
- **`package.json`**: Lists all the Node.js dependencies required to run your server (Express, Mongoose, CORS, etc.).

---

## How to Run Locally

Because the project is now separated into a backend API and a static frontend, you need to run them both. The easiest way is to use two separate terminal windows.

### 1. Start the Backend Server
Open your first terminal and run:
```bash
cd backend
npm install
node server.js
```
*(This will start the database connection, API, and the Admin Dashboard on `http://localhost:3000`)*

### 2. Start the Frontend Website
Open a **new** (second) terminal window, and run:
```bash
npx serve frontend
```
*(This will start a local web server for your frontend files, usually on `http://localhost:3000` or `http://localhost:5000`. Check the terminal output for the exact link!)*

Alternatively, if you use VS Code, you can right-click on `frontend/index.html` and select **"Open with Live Server"**.

## How to View Orders (Admin Panel)

1. Make sure your backend server is running.
2. Open your browser and go to `http://localhost:3000/admin`.
3. You will be prompted for a username and password.
   - **Username**: `admin`
   - **Password**: `raakh123`
4. You will see a table displaying all the orders stored in your database.

---

## How to Deploy to Production

When you are ready to make the website live on the internet, you will deploy the folders to two different places:

### Step 1: Deploy the Backend
Deploy the `backend/` folder to a service like **Render**, **Railway**, or **Heroku**.
Once your backend is successfully deployed, the platform will give you a live URL for your API (for example: `https://raakh-api.onrender.com`).

### Step 2: Connect the Frontend
Before you deploy the frontend, you must tell it where your live backend lives.
1. Open `frontend/script.js`.
2. Find line 5 at the very top: `const API_URL = 'http://localhost:3000';`
3. Change it to your new backend URL. Example: `const API_URL = 'https://raakh-api.onrender.com';`

### Step 3: Deploy the Frontend
Now you can deploy the `frontend/` folder to a free static hosting service like **Vercel**, **Netlify**, or **GitHub Pages**.

> **Important**: Do not forget to update the `WHATSAPP_NUMBER` variable at the top of `script.js` with your actual WhatsApp business number before deploying!
