import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// --- Base API URL ---
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "https://libraflow-library.onrender.com/api/v1") + "/payment";

// --- Axios instance ---
const axiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// --- Utility: Get Auth Headers ---
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// --- Utility: Extract Error Message ---
const getErrorMessage = (error) =>
  error.response?.data?.message ||
  error.response?.data ||
  error.message ||
  "Something went wrong";

// -------------------------
// Async Thunks
// -------------------------

// Create Razorpay order
export const createOrder = createAsyncThunk(
  "fine/createOrder",
  async (orderData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/create-order", orderData, {
        headers: getAuthHeaders(),
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Verify Razorpay payment
export const verifyPayment = createAsyncThunk(
  "fine/verifyPayment",
  async (paymentData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/verify-payment", paymentData, {
        headers: getAuthHeaders(),
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Fetch user's payment history
export const fetchUserPayments = createAsyncThunk(
  "fine/fetchUserPayments",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/my-payments", {
        headers: getAuthHeaders(),
      });
      return res.data.payments;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Fetch all payments (admin only)
export const fetchAllPayments = createAsyncThunk(
  "fine/fetchAllPayments",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/all-payments", {
        headers: getAuthHeaders(),
      });
      return res.data.payments;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// -------------------------
// Slice
// -------------------------
const fineSlice = createSlice({
  name: "fine",
  initialState: {
    loading: false,
    orderLoading: false,
    verifyLoading: false,
    error: null,
    message: null,
    order: null,
    payment: null,
    userPayments: [],
    allPayments: [],
  },
  reducers: {
    resetFineSlice: (state) => {
      state.loading = false;
      state.orderLoading = false;
      state.verifyLoading = false;
      state.error = null;
      state.message = null;
      state.order = null;
      state.payment = null;
    },
    clearOrder: (state) => {
      state.order = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Create Order ---
      .addCase(createOrder.pending, (state) => {
        state.orderLoading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.orderLoading = false;
        state.order = action.payload.order;
        state.message = "Order created successfully";
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.orderLoading = false;
        state.error = action.payload;
      })

      // --- Verify Payment ---
      .addCase(verifyPayment.pending, (state) => {
        state.verifyLoading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.verifyLoading = false;
        state.payment = action.payload.payment;
        state.message = action.payload.message;
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.verifyLoading = false;
        state.error = action.payload;
      })

      // --- Fetch User Payments ---
      .addCase(fetchUserPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(fetchUserPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.userPayments = action.payload;
      })
      .addCase(fetchUserPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Fetch All Payments ---
      .addCase(fetchAllPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(fetchAllPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.allPayments = action.payload;
      })
      .addCase(fetchAllPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Export actions + reducer
export const { resetFineSlice, clearOrder } = fineSlice.actions;
export default fineSlice.reducer;