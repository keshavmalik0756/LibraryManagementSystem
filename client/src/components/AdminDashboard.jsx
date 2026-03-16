import React, { useEffect, useMemo, useState } from "react";
import bookIcon from "../assets/book.png";
import defaultAvatar from "../assets/placeholder.jpg";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Tooltip,
  Legend,
  Title,
  Filler,
} from "chart.js";

import {
  Users, // 👤 total users
  BookOpen, // 📖 total books
  Book, // 📚 book-related
  Clock, // ⏰ overdue
  Bookmark, // 🔖 borrowed books
  TrendingUp, // 📈 growth / activity
  Mail, // 📧 email
  Shield, // 🛡️ role / admin badge
  Calendar, // 📅 member since
  LogOut, // 🚪 logout action
  RefreshCw, // 🔄 refresh action
  CreditCard, // 💳 credit card / payment
  AlertCircle, // ⚠️ warning icon
  UserPlus, // 👤 new user icon
  BarChart2, // 📊 bar chart icon
  Target, // 🎯 target icon
  Zap, // ⚡ zap icon
  Award, // 🏆 award icon
  CheckCircle, // ✅ check circle
  Activity, // 🏃 activity
  User, // 👤 user
  IndianRupee, // ₹ Indian Rupee icon
} from "lucide-react";
import { motion } from "framer-motion";

import { useDispatch, useSelector } from "react-redux";
import Header from "../layout/Header";

// Async thunk actions to fetch data
import { fetchAllUsers } from "../store/slices/userSlice";
import { fetchAllBooks } from "../store/slices/bookSlice";
import { fetchAllBorrowedBooks } from "../store/slices/borrowSlice";
import { fetchAllPayments } from "../store/slices/fineSlice";
import { logout } from "../store/slices/authSlice";
import { useNavigate } from "react-router-dom";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Tooltip,
  Legend,
  Title,
  Filler
);

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [is1024Breakpoint, setIs1024Breakpoint] = useState(false);

  // Handle responsive layout changes
  useEffect(() => {
    const handleResize = () => {
      // Check if screen width is around 1024px (between 1024px and 1279px)
      const width = window.innerWidth;
      setIs1024Breakpoint(width >= 1024 && width <= 1279);
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Add a class to body for debugging purposes (can be removed later)
  useEffect(() => {
    if (is1024Breakpoint) {
      document.body.classList.add('at-1024-breakpoint');
    } else {
      document.body.classList.remove('at-1024-breakpoint');
    }
    
    return () => {
      document.body.classList.remove('at-1024-breakpoint');
    };
  }, [is1024Breakpoint]);

  // Add CSS for 1024px breakpoint
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media (min-width: 1024px) and (max-width: 1279px) {
        .at-1024-breakpoint .lg\\:grid-cols-3 {
          grid-template-columns: repeat(1, minmax(0, 1fr));
        }
        
        .at-1024-breakpoint .lg\\:col-span-2 {
          grid-column: 1 / -1;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // profile action handlers
  const handleLogout = async () => {
    try {
      await dispatch(logout());
      navigate("/login");
    } catch (_) {}
  };

  // Local UI states for loading and error feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Selectors with safe fallbacks
  const users = useSelector((state) => state.user?.users || []);
  const books = useSelector((state) => state.book?.books || []);
  const allBorrowedBooks = useSelector(
    (state) => state.borrow?.allBorrowedBooks || []
  );
  const allPayments = useSelector(
    (state) => state.fine?.allPayments || []
  );

  // Try to get the currently logged-in user from common state shapes
  const currentUser = useSelector(
    (state) =>
      state.user?.currentUser || state.auth?.user || state.user?.user || null
  );

  // Derived user stats
  const totalAllUsers = users.length;
  const totalUsersOnly = users.filter(
    (u) => u.role?.toLowerCase() === "user"
  ).length;
  const totalAdmins = users.filter(
    (u) => u.role?.toLowerCase() === "admin"
  ).length;

  // Fetch dashboard data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          dispatch(fetchAllUsers()),
          dispatch(fetchAllBooks()),
          dispatch(fetchAllBorrowedBooks()),
          dispatch(fetchAllPayments()),
        ]);
      } catch (e) {
        setError("Failed to refresh dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [dispatch]);

  // Refresh data handler
  const refreshData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        dispatch(fetchAllUsers()),
        dispatch(fetchAllBooks()),
        dispatch(fetchAllBorrowedBooks()),
        dispatch(fetchAllPayments()),
      ]);
    } catch (e) {
      setError("Failed to refresh dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Memoized calculations for performance

  const totalBooks = books.length;

  // Calculate available book copies
  const availableBooks = useMemo(() => {
    return books.reduce((acc, book) => {
      const borrowedCount = allBorrowedBooks.filter(
        (borrow) => borrow.bookId === book._id && !borrow.returnDate
      ).length;
      return acc + Math.max((book.quantity || 0) - borrowedCount, 0);
    }, 0);
  }, [books, allBorrowedBooks]);

  // Total currently borrowed books
  const totalBorrowedNow = useMemo(
    () => allBorrowedBooks.filter((b) => !b.returnDate).length,
    [allBorrowedBooks]
  );

  // Total returned books
  const totalReturned = useMemo(
    () => allBorrowedBooks.filter((b) => b.returnDate).length,
    [allBorrowedBooks]
  );

  // Pie chart data for borrowed vs returned
  const pieData = useMemo(
    () => ({
      labels: ["Currently Borrowed", "Returned"],
      datasets: [
        {
          data: [totalBorrowedNow, totalReturned],
          backgroundColor: ["#3D3E3E", "#151619"],
          hoverBackgroundColor: ["#5a5b5b", "#2a2a2a"],
          borderWidth: 2,
          borderColor: "#fff",
          hoverOffset: 8,
        },
      ],
    }),
    [totalBorrowedNow, totalReturned]
  );

  // Line chart data for borrowing trend over last 8 days
  const lineData = useMemo(() => {
    const days = [];
    const counts = [];
    for (let d = 7; d >= 0; d--) {
      const day = new Date();
      day.setDate(day.getDate() - d);
      const label = `${String(day.getDate()).padStart(2, "0")}/${String(
        day.getMonth() + 1
      ).padStart(2, "0")}`;
      days.push(label);

      const count = allBorrowedBooks.filter((b) => {
        if (!b.borrowDate) return false;
        const borrowDate = new Date(b.borrowDate);
        return (
          borrowDate.getDate() === day.getDate() &&
          borrowDate.getMonth() === day.getMonth() &&
          borrowDate.getFullYear() === day.getFullYear()
        );
      }).length;

      counts.push(count);
    }
    return {
      labels: days,
      datasets: [
        {
          label: "Borrows per Day",
          data: counts,
          borderColor: "#151619",
          backgroundColor: "rgba(17, 22, 25, 0.1)",
          tension: 0.3,
          fill: true,
        },
      ],
    };
  }, [allBorrowedBooks]);

  // Top borrowers by count
  const topBorrowers = useMemo(() => {
    const map = new Map();
    allBorrowedBooks.forEach((rec) => {
      const userEmail = rec?.user?.email || rec.email || "Unknown";
      map.set(userEmail, (map.get(userEmail) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([email, count]) => {
        const user = users.find((u) => u.email === email);
        return {
          email,
          name: user ? user.name : "Unknown",
          count,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [allBorrowedBooks, users]);

  // Overdue book count (borrowed more than 60 days ago and not returned)
  const overdueDaysLimit = 60;
  const now = new Date();

  const overdueCount = useMemo(() => {
    return allBorrowedBooks.filter((b) => {
      if (b.returnDate) return false;
      if (!b.dueDate) return false;
      return new Date(b.dueDate) < now;
    }).length;
  }, [allBorrowedBooks]);

  // Calculate average borrowing duration for returned books
  const averageBorrowingDuration = useMemo(() => {
    const returnedBooks = allBorrowedBooks.filter(b => b.returnDate && b.borrowDate);
    if (returnedBooks.length === 0) return 0;
    
    const totalDays = returnedBooks.reduce((sum, book) => {
      const borrowDate = new Date(book.borrowDate);
      const returnDate = new Date(book.returnDate);
      const diffDays = (returnDate - borrowDate) / (1000 * 60 * 60 * 24);
      return sum + diffDays;
    }, 0);
    
    return Math.round(totalDays / returnedBooks.length);
  }, [allBorrowedBooks]);

  // Calculate books due this week (not yet returned but due within 7 days)
  const booksDueThisWeek = useMemo(() => {
    return allBorrowedBooks.filter((b) => {
      if (b.returnDate) return false;
      if (!b.dueDate) return false;
      
      const dueDate = new Date(b.dueDate);
      const today = new Date();
      const daysUntilDue = (dueDate - today) / (1000 * 60 * 60 * 24);
      
      return daysUntilDue >= 0 && daysUntilDue <= 7;
    }).length;
  }, [allBorrowedBooks]);

  // Calculate pending returns (overdue or with unpaid fines)
  const pendingReturns = useMemo(() => {
    return allBorrowedBooks.filter((b) => {
      if (b.returnDate) return false; // Not pending if already returned

      // Check for unpaid fines
      const hasUnpaidFine = b.fine > 0 && b.paymentStatus !== "completed";

      // Check for overdue status with 1-day grace period
      let isOverdue = false;
      if (b.dueDate) {
        const dueDate = new Date(b.dueDate);
        const today = new Date();
        // Add 1 day (24 hours) to the due date for the grace period
        const gracePeriodEndDate = new Date(dueDate.getTime() + (1000 * 60 * 60 * 24));
        isOverdue = today > gracePeriodEndDate;
      }

      return hasUnpaidFine || isOverdue;
    }).length;
  }, [allBorrowedBooks]);

  // Recent borrowing/returning activity (latest 6)
  const recentActivity = useMemo(() => {
    return allBorrowedBooks
      .slice()
      .sort(
        (a, b) =>
          new Date(b.borrowDate || b.createdAt) -
          new Date(a.borrowDate || a.createdAt)
      )
      .slice(0, 6);
  }, [allBorrowedBooks]);

  // Filter recent activity by search term on book title or borrower email
  const filteredRecentActivity = useMemo(() => {
    if (!searchTerm) return recentActivity;
    return recentActivity.filter((r) => {
      const bookTitle = r?.book?.title?.toLowerCase() || "";
      const borrowerEmail =
        r?.user?.email?.toLowerCase() || r.email?.toLowerCase() || "";
      return (
        bookTitle.includes(searchTerm.toLowerCase()) ||
        borrowerEmail.includes(searchTerm.toLowerCase())
      );
    });
  }, [searchTerm, recentActivity]);

  // Popular genres with count (top 6)
  const genreDistribution = useMemo(() => {
    const map = new Map();
    books.forEach((b) => {
      const genre = b.genre || "Other";
      map.set(genre, (map.get(genre) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [books]);

  // Helper to format date-time strings
  const formatDateTime = (ts) => {
    if (!ts) return "-";
    const d = new Date(ts);
    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(
      2,
      "0"
    )}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  // Derived currentUser info (safe fallbacks)
  const adminName = currentUser?.name || "Admin";
  const adminEmail = currentUser?.email || "admin@mail.com";
  const adminRole = currentUser?.role || "Admin";
  const adminAvatar =
    currentUser?.avatar || currentUser?.profilePic || defaultAvatar;
  const memberSince = currentUser?.createdAt
    ? new Date(currentUser.createdAt)
    : null;

  // Add this to get payment stats
  const paymentStats = useMemo(() => {
    const totalPayments = allPayments.length;
    const totalPaymentAmount = allPayments.reduce((sum, payment) => sum + (payment.fine || 0), 0);
    const completedPayments = allPayments.filter(p => p.paymentStatus === "completed").length;
    
    return {
      totalPayments,
      totalPaymentAmount,
      completedPayments
    };
  }, [allPayments]);

  // Calculate total unpaid fines
  const totalUnpaidFines = useMemo(() => {
    return allBorrowedBooks
      .filter(book => book.fine > 0 && book.paymentStatus !== "completed")
      .reduce((sum, book) => sum + book.fine, 0);
  }, [allBorrowedBooks]);

  // Calculate total revenue from fines
  const totalFineRevenue = useMemo(() => {
    return allPayments
      .filter(payment => payment.paymentStatus === "completed")
      .reduce((sum, payment) => sum + (payment.fine || 0), 0);
  }, [allPayments]);

  // Calculate books needing attention (overdue or with unpaid fines)
  const booksNeedingAttention = useMemo(() => {
    return allBorrowedBooks.filter((b) => {
      // Books that are overdue
      const isOverdue = !b.returnDate && b.dueDate && new Date(b.dueDate) < now;
      
      // Books with unpaid fines
      const hasUnpaidFines = b.fine > 0 && b.paymentStatus !== "completed";
      
      return isOverdue || hasUnpaidFines;
    }).length;
  }, [allBorrowedBooks, now]);

  // Calculate user engagement metrics
  const userEngagementStats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter(user => {
      return allBorrowedBooks.some(book => 
        (book.user?.email === user.email || book.email === user.email) && 
        !book.returnDate
      );
    }).length;
    
    const newUserCount = users.filter(user => {
      const userCreationDate = new Date(user.createdAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return userCreationDate > thirtyDaysAgo;
    }).length;
    
    return {
      totalUsers,
      activeUsers,
      newUserCount,
      engagementRate: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
    };
  }, [users, allBorrowedBooks]);

  // Calculate books per genre distribution for chart
  const genreChartData = useMemo(() => {
    const genreMap = new Map();
    books.forEach((book) => {
      const genre = book.genre || "Other";
      genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
    });

    const labels = Array.from(genreMap.keys());
    const data = Array.from(genreMap.values());

    return {
      labels,
      datasets: [
        {
          label: "Books per Genre",
          data,
          backgroundColor: [
            "#151619",
            "#3D3E3E",
            "#5a5b5b",
            "#2a2a2a",
            "#454646",
            "#606161",
            "#707171",
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [books]);

  // Calculate monthly borrowing trend
  const monthlyTrendData = useMemo(() => {
    const months = [];
    const counts = [];
    
    // Get data for last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthLabel = date.toLocaleString('default', { month: 'short' });
      months.push(monthLabel);
      
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const count = allBorrowedBooks.filter(book => {
        const borrowDate = new Date(book.borrowDate || book.createdAt);
        return borrowDate >= monthStart && borrowDate <= monthEnd;
      }).length;
      
      counts.push(count);
    }
    
    return {
      labels: months,
      datasets: [
        {
          label: "Books Borrowed",
          data: counts,
          borderColor: "#151619",
          backgroundColor: "rgba(21, 22, 25, 0.1)",
          tension: 0.3,
          fill: true,
        },
      ],
    };
  }, [allBorrowedBooks]);

  // Calculate user retention rate (users who have borrowed books more than once)
  const userRetentionRate = useMemo(() => {
    const userBorrowCount = new Map();
    
    allBorrowedBooks.forEach(book => {
      const userEmail = book.user?.email || book.email;
      if (userEmail) {
        userBorrowCount.set(userEmail, (userBorrowCount.get(userEmail) || 0) + 1);
      }
    });
    
    const repeatBorrowers = Array.from(userBorrowCount.values()).filter(count => count > 1).length;
    const totalBorrowers = userBorrowCount.size;
    
    return totalBorrowers > 0 ? Math.round((repeatBorrowers / totalBorrowers) * 100) : 0;
  }, [allBorrowedBooks]);

  // Calculate most popular books (by borrow count) - enhanced version with full book details
  const popularBooks = useMemo(() => {
    try {
      // Create a map to count book occurrences and store complete book info
      const bookMap = new Map();
      
      // Process all borrowed books to count occurrences and gather book info
      allBorrowedBooks.forEach((borrowRecord) => {
        // Extract comprehensive book information
        const bookId = borrowRecord.book?._id || borrowRecord.bookId || borrowRecord._id;
        const bookTitle = borrowRecord.book?.title || 
                         borrowRecord.bookTitle || 
                         borrowRecord.title || 
                         "Unknown Book";
        const bookAuthor = borrowRecord.book?.author || 
                          borrowRecord.author || 
                          "Unknown Author";
        
        // If we already have this book, increment count, otherwise add new entry
        if (bookId && bookMap.has(bookId)) {
          const existingBook = bookMap.get(bookId);
          bookMap.set(bookId, {
            ...existingBook,
            count: existingBook.count + 1
          });
        } else if (bookId) {
          // Try to get more complete information from the books collection
          const fullBookInfo = books.find(book => book._id === bookId);
          bookMap.set(bookId, {
            id: bookId,
            title: fullBookInfo?.title || bookTitle,
            author: fullBookInfo?.author || bookAuthor,
            count: 1
          });
        }
      });
      
      // Convert map to array, sort by count, and take top 5
      return Array.from(bookMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    } catch (error) {
      console.error("Error calculating popular books:", error);
      return [];
    }
  }, [allBorrowedBooks, books]);

  // Calculate book availability rate
  const bookAvailabilityRate = useMemo(() => {
    if (books.length === 0) return 0;
    
    const totalCopies = books.reduce((sum, book) => sum + (book.quantity || 0), 0);
    const borrowedCopies = allBorrowedBooks.filter(book => !book.returnDate).length;
    
    return totalCopies > 0 ? Math.round(((totalCopies - borrowedCopies) / totalCopies) * 100) : 0;
  }, [books, allBorrowedBooks]);

  // Calculate payment success rate
  const paymentSuccessRate = useMemo(() => {
    if (allPayments.length === 0) return 0;
    
    const completedPayments = allPayments.filter(p => p.paymentStatus === "completed").length;
    return Math.round((completedPayments / allPayments.length) * 100);
  }, [allPayments]);

  // Calculate average books borrowed per user
  const avgBooksPerUser = useMemo(() => {
    if (users.length === 0) return 0;
    
    const totalBorrowed = allBorrowedBooks.length;
    const totalUsers = users.filter(u => u.role?.toLowerCase() === "user").length;
    
    return totalUsers > 0 ? (totalBorrowed / totalUsers).toFixed(1) : 0;
  }, [allBorrowedBooks, users]);

  // Calculate book turnover rate (borrowed books / total books)
  const bookTurnoverRate = useMemo(() => {
    if (books.length === 0) return 0;
    
    const totalBorrowed = allBorrowedBooks.length;
    const totalBooks = books.length;
    
    return ((totalBorrowed / totalBooks) * 100).toFixed(1);
  }, [allBorrowedBooks, books]);

  // Calculate overdue rate (overdue books / total borrowed)
  const overdueRate = useMemo(() => {
    if (allBorrowedBooks.length === 0) return 0;
    
    const overdueBooks = allBorrowedBooks.filter(b => {
      if (b.returnDate) return false;
      if (!b.dueDate) return false;
      return new Date(b.dueDate) < now;
    }).length;
    
    return ((overdueBooks / allBorrowedBooks.length) * 100).toFixed(1);
  }, [allBorrowedBooks, now]);

  // Calculate collection diversity (unique genres / total books)
  const collectionDiversity = useMemo(() => {
    if (books.length === 0) return 0;
    
    const uniqueGenres = new Set(books.map(b => b.genre).filter(Boolean)).size;
    const totalBooks = books.length;
    
    return ((uniqueGenres / totalBooks) * 100).toFixed(1);
  }, [books]);

  // Prepare data for operational metrics chart
  const operationalMetricsData = useMemo(() => {
    return {
      labels: ['Availability', 'Turnover', 'Overdue', 'Diversity'],
      datasets: [
        {
          label: 'Performance Metrics (%)',
          data: [
            bookAvailabilityRate,
            parseFloat(bookTurnoverRate),
            parseFloat(overdueRate),
            parseFloat(collectionDiversity)
          ],
          backgroundColor: [
            'rgba(34, 197, 94, 0.7)',    // Green for availability
            'rgba(59, 130, 246, 0.7)',   // Blue for turnover
            'rgba(251, 191, 36, 0.7)',   // Amber for overdue
            'rgba(239, 68, 68, 0.7)'     // Red for diversity
          ],
          borderColor: [
            'rgb(34, 197, 94)',
            'rgb(59, 130, 246)',
            'rgb(251, 191, 36)',
            'rgb(239, 68, 68)'
          ],
          borderWidth: 1
        }
      ]
    };
  }, [bookAvailabilityRate, bookTurnoverRate, overdueRate, collectionDiversity]);

  return (
    <main className="relative flex-1 p-4 md:p-6 pt-24 md:pt-28 bg-gray-50 min-h-screen overflow-x-hidden">
      <Header />
      
      {/* Debug information - TEMPORARY - can be removed later */}
      {/* {allBorrowedBooks.length > 0 && (
        <div className="bg-yellow-100 p-4 rounded mb-4">
          <h3 className="font-bold">Debug Info:</h3>
          <p>Total Borrowed Books: {allBorrowedBooks.length}</p>
          <pre className="text-xs overflow-auto max-h-40">
            {JSON.stringify(allBorrowedBooks[0], null, 2)}
          </pre>
        </div>
      )} */}

      <section className="space-y-6">
        {/* Header + refresh - REMOVED HOVER EFFECTS AND MADE LIGHT GRAY */}
        <motion.header 
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 dashboard-section bg-gray-100 rounded-lg p-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-700 mt-1">
              Overview of users, books, and borrowing activity
            </p>
          </motion.div>

          <motion.div
            className="flex flex-wrap items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <button
              onClick={refreshData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:shadow-md transition disabled:opacity-50"
              title="Refresh dashboard data"
            >
              <RefreshCw className={`w-4 h-4 text-gray-700 ${loading ? "animate-spin" : ""}`} />
              <span className="text-sm text-gray-700 hidden sm:inline">
                {loading ? "Refreshing..." : "Refresh"}
              </span>
            </button>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{totalAllUsers} users</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <div className="flex items-center gap-1">
                <Book className="w-4 h-4" />
                <span>{totalBooks} books</span>
              </div>
            </div>
          </motion.div>
        </motion.header>

        {/* Error message */}
        {error && (
          <div className="bg-red-100 text-red-700 rounded p-3 text-center font-medium dashboard-section">
            {error}
          </div>
        )}

        {/* Key Metrics - Most important for admin */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="animate-card-float"
          >
            <StatCard
              title="Total Users"
              value={totalAllUsers}
              subtitle={`${totalAdmins} admins • ${totalUsersOnly} users`}
              icon={<Users className="w-5 h-5 text-white" />}
              color="bg-gradient-to-r from-[#151619] to-[#3D3E3E]"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="animate-card-float animate-stagger-1"
          >
            <StatCard
              title="Total Books"
              value={totalBooks}
              subtitle={`${availableBooks} copies available`}
              icon={<Book className="w-5 h-5 text-white" />}
              color="bg-gradient-to-r from-indigo-700 to-indigo-500"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="animate-card-float animate-stagger-2"
          >
            <StatCard
              title="Currently Borrowed"
              value={totalBorrowedNow}
              subtitle="Books currently out"
              icon={<Bookmark className="w-5 h-5 text-white" />}
              color="bg-gradient-to-r from-blue-700 to-blue-500"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="animate-card-float animate-stagger-3"
          >
            <StatCard
              title="Overdue Books"
              value={pendingReturns}
              subtitle="Books past due date"
              icon={<Clock className="w-5 h-5 text-white" />}
              color="bg-gradient-to-r from-red-700 to-red-500"
            />
          </motion.div>
        </section>

        {/* Financial Overview - Critical for admin */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="animate-card-float animate-stagger-4"
          >
            <StatCard
              title="Unpaid Fines"
              value={`₹${totalUnpaidFines.toFixed(2)}`}
              subtitle="Outstanding amounts"
              icon={<IndianRupee className="w-5 h-5 text-white" />}
              color="bg-gradient-to-r from-orange-700 to-orange-500"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="animate-card-float"
          >
            <StatCard
              title="Fine Revenue"
              value={`₹${totalFineRevenue.toFixed(2)}`}
              subtitle="Collected from fines"
              icon={<Award className="w-5 h-5 text-white" />}
              color="bg-gradient-to-r from-green-700 to-green-500"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
            className="animate-card-float animate-stagger-1"
          >
            <StatCard
              title="Payment Success"
              value={`${paymentSuccessRate}%`}
              subtitle="Successful payments"
              icon={<Target className="w-5 h-5 text-white" />}
              color="bg-gradient-to-r from-teal-700 to-teal-500"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
            className="animate-card-float animate-stagger-2"
          >
            <StatCard
              title="Active Users"
              value={userEngagementStats?.activeUsers || 0}
              subtitle={`${userEngagementStats?.engagementRate || 0}% engagement`}
              icon={<UserPlus className="w-5 h-5 text-white" />}
              color="bg-gradient-to-r from-purple-700 to-purple-500"
            />
          </motion.div>
        </section>

        {/* Main content area - Restructured for better 1024px layout */}
        <section className={`grid grid-cols-1 ${is1024Breakpoint ? 'lg:grid-cols-1' : 'lg:grid-cols-3'} gap-6`}>
          {/* LEFT: Charts section */}
          <div className={`${is1024Breakpoint ? 'lg:col-span-1' : 'lg:col-span-2'} space-y-6`}>
            {/* Charts */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pie chart */}
              <motion.article 
                className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden animate-fade-in-up dashboard-section"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <h3 className="text-lg font-semibold mb-4 text-[#3D3E3E] overflow-hidden flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-[#3D3E3E]" />
                  Borrowed vs Returned
                </h3>
                <div className="flex items-center justify-between gap-6 overflow-hidden">
                  <div className="w-44 h-44 mx-auto overflow-hidden">
                    <Pie
                      data={pieData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: "bottom",
                            labels: {
                              usePointStyle: true,
                              padding: 20,
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <div className="grid grid-cols-2 gap-y-3 items-center text-[#151619]">
                    <span className="text-sm font-medium flex items-center gap-1 justify-end">
                      <Bookmark className="w-4 h-4 text-blue-500" />
                      Currently Borrowed:
                    </span>
                    <span className="text-base font-semibold text-right">
                      {totalBorrowedNow}
                    </span>

                    <span className="text-sm font-medium flex items-center gap-1 justify-end">
                      <BookOpen className="w-4 h-4 text-green-500" />
                      Returned:
                    </span>
                    <span className="text-base font-semibold text-right">
                      {totalReturned}
                    </span>
                  </div>
                </div>
              </motion.article>

              {/* Line chart */}
              <motion.article 
                className="bg-white p-5 rounded-lg shadow-md dashboard-section hover:shadow-lg transition-all duration-300"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3">
                  <h3 className="text-lg font-semibold text-[#3D3E3E] flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#3D3E3E]" />
                    Borrowing Trend (last 8 days)
                  </h3>
                  <span className="text-sm text-gray-500">
                    Realtime insights
                  </span>
                </header>
                <div className="h-48">
                  <Line
                    data={lineData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { labels: { color: "#151619" } },
                      },
                      scales: {
                        x: { ticks: { color: "#3D3E3E" } },
                        y: { ticks: { color: "#3D3E3E" } },
                      },
                    }}
                  />
                </div>
              </motion.article>
            </section>

            {/* Additional Charts */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Genre Distribution Chart */}
              <motion.article 
                className="bg-white p-5 rounded-lg shadow-md dashboard-section hover:shadow-lg transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3">
                  <h3 className="text-lg font-semibold text-[#3D3E3E] flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-[#3D3E3E]" />
                    Books by Genre
                  </h3>
                </header>
                <div className="h-48">
                  <Pie
                    data={genreChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "right",
                          labels: {
                            usePointStyle: true,
                            padding: 10,
                            font: {
                              size: 10
                            }
                          },
                        },
                      },
                    }}
                  />
                </div>
              </motion.article>

              {/* Monthly Trend Chart */}
              <motion.article 
                className="bg-white p-5 rounded-lg shadow-md dashboard-section hover:shadow-lg transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3">
                  <h3 className="text-lg font-semibold text-[#3D3E3E] flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#3D3E3E]" />
                    Monthly Borrowing Trend
                  </h3>
                </header>
                <div className="h-48">
                  <Line
                    data={monthlyTrendData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        },
                      },
                      scales: {
                        x: {
                          grid: {
                            display: false
                          },
                          ticks: {
                            color: "#3D3E3E",
                            maxRotation: 0
                          }
                        },
                        y: {
                          beginAtZero: true,
                          ticks: {
                            color: "#3D3E3E",
                            precision: 0
                          }
                        },
                      },
                    }}
                  />
                </div>
              </motion.article>
            </section>

            {/* Recent activity */}
            <motion.article 
              className="bg-white p-5 rounded-lg shadow-md dashboard-section hover:shadow-lg transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-gray-700" />
                  Recent Activity
                </h4>
                <input
                  type="text"
                  placeholder="Search activity..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md text-gray-700 text-sm w-full sm:w-48"
                />
              </div>
              {filteredRecentActivity.length === 0 ? (
                <p className="text-gray-500 text-sm">No recent activity.</p>
              ) : (
                <div className="space-y-3">
                  {filteredRecentActivity.map((rec, i) => (
                    <motion.div
                      key={i}
                      className="flex flex-col md:flex-row md:items-center gap-3 border-b border-gray-100 pb-3 last:border-none last:pb-0 rounded p-2 hover:bg-gray-200 text-gray-800 transition-colors duration-200 cursor-pointer"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.1 }}
                      whileHover={{ x: 5, transition: { duration: 0.2 } }}
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex-shrink-0">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 break-words">
                          {rec?.book?.title || rec.bookName || "Untitled Book"}
                        </p>
                        <p className="text-xs text-gray-500 break-words">
                          Borrower: {rec?.user?.email || rec.email || "Unknown"}
                        </p>
                        <div className="flex flex-wrap justify-between items-center mt-1 gap-2">
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDateTime(rec.borrowDate || rec.createdAt)}
                          </span>
                          {rec.fine > 0 && (
                            <span className={`text-xs font-semibold flex items-center gap-1 ${rec.paymentStatus === "completed" ? "text-green-600" : "text-red-600"}`}>
                              <IndianRupee className="w-3 h-3" />
                              {rec.fine.toFixed(2)} {rec.paymentStatus === "completed" ? "(Paid)" : "(Unpaid)"}
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        className={`text-xs font-semibold shrink-0 px-2 py-1 rounded flex items-center gap-1 ${
                          rec.returnDate 
                            ? "bg-green-100 text-green-800 hover-green" 
                            : "bg-red-100 text-red-800 hover-red"
                        }`}
                      >
                        {rec.returnDate ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Returned
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            Borrowed
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.article>
          </div>

          {/* RIGHT: Lists and profile section */}
          <div className={is1024Breakpoint ? 'lg:col-span-1' : ''}>
            {/* Top Borrowers - IMPROVED EMAIL VISIBILITY AND DESIGN */}
            <motion.article 
              className="bg-white p-5 rounded-lg shadow-md dashboard-section hover:shadow-lg transition-all duration-300"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <h4 className="font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-700" />
                Top Borrowers
              </h4>
              {topBorrowers.length === 0 ? (
                <p className="text-gray-500 text-sm">No borrowers found.</p>
              ) : (
                <div className="space-y-3">
                  {topBorrowers.map((borrower, idx) => (
                    <motion.div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200 transition-all duration-300"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.1 }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm ${
                          idx === 0 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                          idx === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                          idx === 2 ? 'bg-gradient-to-r from-amber-700 to-amber-800' :
                          'bg-gradient-to-r from-blue-500 to-blue-600'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-800 flex items-center gap-1">
                            <User className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <span className="truncate max-w-[120px] lg:max-w-[160px]">{borrower.name || borrower.email}</span>
                          </div>
                          <div className="text-xs text-gray-600 flex items-start gap-1 mt-1">
                            <Mail className="w-3 h-3 flex-shrink-0 mt-0.5" />
                            <span className="break-all">{borrower.email}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                          <Bookmark className="w-3 h-3" />
                          {borrower.count}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.article>

            {/* Popular Books - RESPONSIVE DESIGN */}
            <motion.article 
              className="bg-white p-5 rounded-lg shadow-md dashboard-section hover:shadow-lg transition-all duration-300"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <h4 className="font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-gray-700" />
                Most Popular Books
              </h4>
              {popularBooks.length === 0 ? (
                <p className="text-gray-500 text-sm">No borrowing data.</p>
              ) : (
                <div className="space-y-4">
                  {popularBooks.map((book, idx) => (
                    <motion.div
                      key={idx}
                      className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 border border-gray-200 transition-all duration-300 hover:shadow-md"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.1 }}
                    >
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full text-white font-bold text-sm flex-shrink-0 mt-1 ${
                        idx === 0 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                        idx === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                        idx === 2 ? 'bg-gradient-to-r from-amber-700 to-amber-800' :
                        'bg-gradient-to-r from-purple-500 to-purple-600'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row md:items-start md:justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-gray-800 text-sm break-words">
                              {book.title || "Unknown Title"}
                            </h3>
                            <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                              <User className="w-3 h-3 flex-shrink-0" />
                              <span className="break-words truncate max-w-[140px] md:max-w-none">{book.author || "Unknown Author"}</span>
                            </p>
                          </div>
                          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0 self-start">
                            <Bookmark className="w-3 h-3" />
                            <span>{book.count || 0}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.article>

            {/* Popular Genres */}
            <motion.article 
              className="bg-white p-5 rounded-lg shadow-md dashboard-section hover:shadow-lg transition-all duration-300"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <h4 className="font-semibold mb-4 text-[#3D3E3E] flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-[#3D3E3E]" />
                Popular Genres
              </h4>
              {genreDistribution.length === 0 ? (
                <p className="text-gray-500 text-sm">No genre data.</p>
              ) : (
                <div className="space-y-4">
                  {genreDistribution.map((genre, idx) => (
                    <motion.div 
                      key={idx} 
                      className="group"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.1 }}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-[#151619] break-words max-w-[120px] lg:max-w-[160px]">
                          {genre.genre}
                        </span>
                        <span className="text-sm font-semibold text-[#151619] flex items-center gap-1">
                          <Book className="w-4 h-4 text-gray-500" />
                          {genre.count}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <motion.div
                          className="bg-gradient-to-r from-[#3D3E3E] to-[#151619] h-2.5 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(genre.count / genreDistribution[0].count) * 100}%` }}
                          transition={{ duration: 1, delay: idx * 0.1 }}
                        ></motion.div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.article>

            {/* Profile Card - FIXED POSITION */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="sticky top-24"
            >
              <div className="bg-gray-900 text-white rounded-2xl shadow-xl p-5 dashboard-section border border-gray-700">
                <ProfileCard
                  name={adminName}
                  email={adminEmail}
                  role={adminRole}
                  avatar={adminAvatar}
                  memberSince={memberSince}
                  totals={{
                    books: totalBooks,
                    users: totalAllUsers,
                    overdue: overdueCount,
                    borrowedNow: totalBorrowedNow,
                    fineRevenue: totalFineRevenue
                  }}
                  onLogout={handleLogout}
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer tips */}
        <footer className="bg-white p-4 rounded-lg shadow-md flex flex-col sm:flex-row justify-between items-center gap-3 text-gray-600 text-sm dashboard-section hover:shadow-lg transition-all duration-300">
          <div className="text-center sm:text-left">
            Pro Tip: Keep ISBNs unique and update book quantities when
            recording borrow/return.
          </div>
          <div className="text-center sm:text-right">
            Dashboard powered by LibraFlow • Designed for learning projects
          </div>
        </footer>
      </section>
    </main>
  );
};

/** Profile card without edit functionality */
const MiniStat = ({ icon: Icon, label, value, color = "bg-gray-800" }) => (
  <div
    className={`flex flex-col items-center justify-center rounded-lg 
               ${color} border border-gray-700 
               p-2 shadow-sm select-none pointer-events-none`}
  >
    <Icon className="w-4 h-4 mb-1 text-white" />
    <span className="text-xs font-medium text-white">{value}</span>
    <span className="text-[10px] text-gray-300">{label}</span>
  </div>
);

const ProfileCard = ({
  name,
  email,
  role,
  avatar,
  memberSince,
  totals,
  onLogout = () => {},
}) => {
  const since =
    memberSince &&
    `${String(memberSince.getDate()).padStart(2, "0")}/${String(
      memberSince.getMonth() + 1
    ).padStart(2, "0")}/${memberSince.getFullYear()}`;

  // Calculate unique profile stats
  const profileStats = [
    { icon: BookOpen, label: "Books", value: totals?.books ?? 0, color: "bg-gray-800" },
    { icon: Users, label: "Users", value: totals?.users ?? 0, color: "bg-gray-800" },
    { icon: Clock, label: "Loans", value: totals?.borrowedNow ?? 0, color: "bg-gray-800" },
    { icon: IndianRupee, label: "Revenue", value: "₹" + (totals?.fineRevenue ?? 0).toFixed(0), color: "bg-gray-800" }
  ];

  return (
    <div className="bg-gray-900 text-white rounded-lg shadow-md p-4 dashboard-section border border-gray-700">
      {/* Header section */}
      <div className="flex flex-col items-center">
        {/* Avatar */}
        <div className="relative w-16 h-16 rounded-full border-2 border-gray-600 shadow-sm overflow-hidden mb-3">
          <img
            src={avatar}
            alt="User Avatar"
            className="w-full h-full object-cover select-none pointer-events-none"
            draggable="false"
          />
          <span
            className="absolute -bottom-1 -right-1 inline-flex items-center justify-center w-6 h-6 
                       rounded-full bg-black text-white ring-2 ring-gray-800 text-[10px] font-bold uppercase"
          >
            {role?.[0] || "A"}
          </span>
        </div>

        {/* Name & Info */}
        <h3 className="text-lg font-bold truncate max-w-[180px] text-center text-white">
          {name}
        </h3>
        <div className="flex items-center gap-1 text-gray-300 text-xs mt-1">
          <Shield className="w-3 h-3 text-gray-300" />
          <span className="truncate font-medium">{role}</span>
        </div>
        <div className="flex items-center gap-1 text-gray-300 text-xs mt-1">
          <Mail className="w-3 h-3 text-gray-300 flex-shrink-0" />
          <span className="break-all">{email}</span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-700 my-3" />

      {/* Unique Profile Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {profileStats.map((stat, index) => (
          <MiniStat 
            key={index}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            color={stat.color}
          />
        ))}
      </div>

      {/* Logout */}
      <div>
        <motion.button
          whileHover={{ scale: 1.00 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg 
                     bg-black text-white transition-all duration-300 font-medium text-sm shadow-sm border"
        >
          <LogOut className="w-4 h-4 text-white" />
          <span>Logout</span>
        </motion.button>
      </div>
    </div>
  );
};

// 3D BookCard component with interactive effect and fixed positioning
const BookCard = ({
  title,
  value,
  subtitle,
  icon,
  colorClass = "from-[#151619] to-[#3D3E3E]",
}) => (
  <motion.div 
    className="relative h-32 perspective-1000 group cursor-pointer overflow-hidden rounded-lg fixed-card"
    whileHover={{ 
      y: -8,
      transition: { duration: 0.3, ease: "easeOut" }
    }}
    whileTap={{ scale: 0.95 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div
      className={`absolute inset-0 rounded-lg shadow-lg transform transition-all duration-300 group-hover:scale-105 overflow-hidden card-3d`}
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r ${colorClass} transform-style-3d shadow-inner z-10 overflow-hidden`}
      >
        <div className="absolute inset-0 bg-black bg-opacity-20 overflow-hidden"></div>
      </div>
      <div
        className={`absolute left-2 right-0 top-0 bottom-0 bg-gradient-to-br ${colorClass} p-4 flex flex-col justify-between transform-style-3d overflow-hidden card-content`}
      >
        <div className="flex justify-between items-start overflow-hidden">
          <div className="overflow-hidden">
            <h3 className="text-sm font-bold text-white mb-1 overflow-hidden card-title">
              {title}
            </h3>
            <p className="text-2xl font-extrabold text-white tracking-tight overflow-hidden card-value">
              {Number.isFinite(value) ? value : 0}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-white bg-opacity-20 p-1 overflow-hidden flex items-center justify-center card-icon">
            {icon}
          </div>
        </div>
        {subtitle && (
          <p className="text-[10px] text-white text-opacity-80 mt-1 overflow-hidden card-subtitle">
            {subtitle}
          </p>
        )}
      </div>
    </div>
    
    {/* Enhanced 3D effect shadow */}
    <div className="absolute inset-0 rounded-lg bg-black opacity-15 transform translate-y-2 translate-x-2 -z-10 transition-all duration-300 group-hover:translate-y-3 group-hover:translate-x-3 card-shadow"></div>
  </motion.div>
);

// Backward compatibility wrapper to reuse AdminDashboard props with fixed positioning
const StatCard = ({ color, ...rest }) => {
  const gradient = color
    ? color.replace(/bg-gradient-to-[\w-]+ /, "")
    : undefined;
  return <BookCard {...rest} colorClass={gradient} />;
};

export default AdminDashboard;