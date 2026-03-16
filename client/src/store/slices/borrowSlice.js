// client/src/store/slices/borrowSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// --- Base API URL ---
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "https://libraflow-library.onrender.com/api/v1") + "/borrow";

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

// Fetch borrowed books for a user
export const fetchUserBorrowedBooks = createAsyncThunk(
  "borrow/fetchUserBorrowedBooks",
  async (email, { rejectWithValue }) => {
    try {
      if (!email) return rejectWithValue("User email is missing.");
      const res = await axiosInstance.get(`/my-borrowed-books?email=${email}`, {
        headers: getAuthHeaders(),
      });
      return res.data.borrowedBooks || [];
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Fetch all borrowed books (admin only)
export const fetchAllBorrowedBooks = createAsyncThunk(
  "borrow/fetchAllBorrowedBooks",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/admin/borrowed-books", {
        headers: getAuthHeaders(),
      });
      return res.data.borrowedBooks || [];
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Record a book as borrowed
export const recordBorrowBook = createAsyncThunk(
  "borrow/recordBorrowBook",
  async ({ email, bookId }, { rejectWithValue, dispatch }) => {
    try {
      if (!email || !bookId) {
        return rejectWithValue("Book ID or Email is missing.");
      }
      const res = await axiosInstance.post(
        `/record-borrow-book/${bookId}`,
        { email },
        { headers: getAuthHeaders() }
      );

      // Refresh borrowed books silently in the background
      dispatch(fetchUserBorrowedBooks(email));

      return { message: res.data.message || "Book borrowed successfully!" };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Return a borrowed book
export const returnBorrowBook = createAsyncThunk(
  "borrow/returnBorrowBook",
  async ({ email, bookId }, { rejectWithValue, dispatch }) => {
    try {
      if (!email || !bookId) {
        return rejectWithValue("Book ID or Email is missing.");
      }
      const res = await axiosInstance.put(
        `/return-borrow-book/${bookId}`,
        { email },
        { headers: getAuthHeaders() }
      );

      // Refresh borrowed books after returning
      dispatch(fetchUserBorrowedBooks(email));

      return { message: res.data.message || "Book returned successfully!" };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// -------------------------
// Slice
// -------------------------
const borrowSlice = createSlice({
  name: "borrow",
  initialState: {
    borrowLoading: false, // For record/return operations
    fetchLoading: false,  // For fetch operations
    error: null,
    message: null,
    userBorrowedBooks: [],
    allBorrowedBooks: [],
  },
  reducers: {
    resetBorrowSlice: (state) => {
      state.borrowLoading = false;
      state.fetchLoading = false;
      state.error = null;
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- User Borrowed Books ---
      .addCase(fetchUserBorrowedBooks.pending, (state) => {
        state.fetchLoading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(fetchUserBorrowedBooks.fulfilled, (state, action) => {
        state.fetchLoading = false;
        state.userBorrowedBooks = action.payload;
      })
      .addCase(fetchUserBorrowedBooks.rejected, (state, action) => {
        state.fetchLoading = false;
        state.error = action.payload;
      })

      // --- All Borrowed Books (Admin) ---
      .addCase(fetchAllBorrowedBooks.pending, (state) => {
        state.fetchLoading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(fetchAllBorrowedBooks.fulfilled, (state, action) => {
        state.fetchLoading = false;
        state.allBorrowedBooks = action.payload;
      })
      .addCase(fetchAllBorrowedBooks.rejected, (state, action) => {
        state.fetchLoading = false;
        state.error = action.payload;
      })

      // --- Record Borrow ---
      .addCase(recordBorrowBook.pending, (state) => {
        state.borrowLoading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(recordBorrowBook.fulfilled, (state, action) => {
        state.borrowLoading = false;
        state.message = action.payload.message;
      })
      .addCase(recordBorrowBook.rejected, (state, action) => {
        state.borrowLoading = false;
        state.error = action.payload;
        state.message = null;
      })

      // --- Return Borrow ---
      .addCase(returnBorrowBook.pending, (state) => {
        state.borrowLoading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(returnBorrowBook.fulfilled, (state, action) => {
        state.borrowLoading = false;
        state.message = action.payload.message;
      })
      .addCase(returnBorrowBook.rejected, (state, action) => {
        state.borrowLoading = false;
        state.error = action.payload;
        state.message = null;
      });
  },
});

// Export actions + reducer
export const { resetBorrowSlice } = borrowSlice.actions;
export default borrowSlice.reducer;
