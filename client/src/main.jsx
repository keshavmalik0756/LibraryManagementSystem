// client/src/index.js (or main.jsx)
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { store } from "./store/store.js";
import axios from "axios";

// 🔹 Global axios defaults
const API_URL = import.meta.env.VITE_API_BASE_URL || "https://libraflow-library.onrender.com/api/v1";
axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true;
axios.defaults.headers.post["Content-Type"] = "application/json";

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <App />
  </Provider>
);
