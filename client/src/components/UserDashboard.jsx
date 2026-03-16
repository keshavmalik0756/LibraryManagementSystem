// UserDashboard.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import logo_with_title from "../assets/logo-with-title-black.png";
import logo from "../assets/black-logo.png";
import returnIcon from "../assets/redo.png";
import browseIcon from "../assets/pointing.png";
import bookIcon from "../assets/book-square.png";
import { Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
  Filler,
} from "chart.js";
import { useSelector, useDispatch } from "react-redux";
import Header from "../layout/Header";
import { fetchUserBorrowedBooks } from "../store/slices/borrowSlice";
import { fetchUserPayments } from "../store/slices/fineSlice";
import { saveAs } from "file-saver";
import Papa from "papaparse";
import PaymentPopup from "../popups/PaymentPopup";
import { CreditCard, BookOpen, Clock, CheckCircle, TrendingUp, User, Mail, Calendar, Award, Target, Book, IndianRupee } from "lucide-react";
import { motion, useAnimation } from "framer-motion";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
  Filler
);

// Interactive BookCard component with 3D book effect
const BookCard = ({
  title,
  value,
  subtitle,
  icon,
  colorClass = "from-[#151619] to-[#3D3E3E]",
}) => (
  <div className="relative h-40 perspective-1000 group cursor-pointer overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
    {/* 3D Book Effect */}
    <div
      className={`absolute inset-0 rounded-lg shadow-xl transform transition-all duration-500 
      group-hover:rotate-y-[-15deg] group-hover:scale-105 overflow-hidden`}
    >
      {/* Book spine */}
      <div className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r ${colorClass} 
        transform-style-3d shadow-inner z-10 overflow-hidden`}>
        <div className="absolute inset-0 bg-black bg-opacity-20 overflow-hidden"></div>
      </div>

      {/* Book cover */}
      <div className={`absolute left-8 right-0 top-0 bottom-0 bg-gradient-to-br ${colorClass} p-4 
        flex flex-col justify-between transform-style-3d overflow-hidden`}>

        {/* Book title and value */}
        <div className="flex justify-between items-start overflow-hidden">
          <div className="overflow-hidden">
            <h3 className="text-md font-bold text-white mb-1 overflow-hidden">{title}</h3>
            <p className="text-3xl font-extrabold text-white tracking-tight overflow-hidden">
              {typeof value === "number" ? value : (value || "0")}
            </p>
          </div>

          {/* Icon with floating animation */}
          <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 p-2 animate-float overflow-hidden">
            {icon}
          </div>
        </div>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-xs text-white text-opacity-80 mt-1 overflow-hidden">{subtitle}</p>
        )}

        {/* Decorative elements */}
        <div className="absolute bottom-3 left-3 w-12 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden"></div>
        <div className="absolute bottom-6 left-3 w-8 h-1 bg-white bg-opacity-20 rounded-full overflow-hidden"></div>

        {/* Interactive particles */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-5 rounded-full blur-xl 
          group-hover:scale-150 transition-all duration-700 group-hover:opacity-10 overflow-hidden"></div>
        <div className="absolute bottom-0 left-10 w-16 h-16 bg-white opacity-5 rounded-full blur-xl 
          group-hover:scale-150 transition-all duration-700 delay-100 group-hover:opacity-10 overflow-hidden"></div>
      </div>
    </div>

    {/* Interactive hover effect - page flip animation */}
    <div className="absolute top-0 right-0 bottom-0 w-1/2 bg-white bg-opacity-5 
      transform origin-left scale-y-100 scale-x-0 group-hover:scale-x-100 
      transition-transform duration-500 rounded-r-lg overflow-hidden">
    </div>
  </div>
);

// Backward compatibility wrapper for StatCard
const StatCard = (props) => <BookCard {...props} />;

const formatDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(
    2,
    "0"
  )}:${String(d.getMinutes()).padStart(2, "0")}`;
};

// Improved daysBetween function with better error handling
const daysBetween = (a, b = new Date()) => {
  // Handle null or undefined dates
  if (!a) return 0;

  const dateA = new Date(a);
  const dateB = new Date(b);

  // Check for invalid dates
  if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
    return 0;
  }

  // Calculate difference in days
  const diffTime = Math.abs(dateB - dateA);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

const UserDashboard = () => {
  const dispatch = useDispatch();
  const { userBorrowedBooks = [] } = useSelector((state) => state.borrow || {});
  const { userPayments = [] } = useSelector((state) => state.fine || {});
  const authUser = useSelector((state) => state.auth?.user || null);
  const [selectedBorrowRecord, setSelectedBorrowRecord] = useState(null);
  const [is1024Breakpoint, setIs1024Breakpoint] = useState(false);

  // Animation controls
  const controls = useAnimation();

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

  // Trigger animations when data changes
  useEffect(() => {
    controls.start({
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    });
  }, [userBorrowedBooks, userPayments, controls]);

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

  // Fetch borrowed books and payments on component mount
  useEffect(() => {
    if (authUser?.email) {
      dispatch(fetchUserBorrowedBooks(authUser.email));
      dispatch(fetchUserPayments());
    }
  }, [authUser, dispatch]);

  // Local UI state
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("All");
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [sortBy, setSortBy] = useState("latest");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(6);
  const [selectedBook, setSelectedBook] = useState(null);
  const [localState, setLocalState] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // New tab state: all, borrowed, returned

  // Enhanced totals with additional stats
  const totals = useMemo(() => {
    const borrowed = userBorrowedBooks.filter((b) => !b.returnDate).length;
    const returned = userBorrowedBooks.filter((b) => !!b.returnDate).length;

    // Improved overdue calculation using dueDate if available, otherwise fallback to 60 days from borrowDate
    const overdue = userBorrowedBooks.filter((b) => {
      if (b.returnDate) return false;
      if (b.dueDate) {
        return new Date(b.dueDate) < new Date();
      }
      return false;
    }).length;

    // Debug: Log overdue calculation
    // console.log("Overdue calculation:", {
    //   totalBooks: userBorrowedBooks.length,
    //   borrowed,
    //   returned,
    //   overdue
    // });

    // Calculate fine statistics
    const totalFines = userBorrowedBooks.reduce((sum, book) => sum + (book.fine || 0), 0);
    const paidFines = userBorrowedBooks
      .filter(book => book.paymentStatus === "completed")
      .reduce((sum, book) => sum + (book.fine || 0), 0);
    const pendingFines = totalFines - paidFines;

    // Calculate payment statistics
    const totalPayments = userPayments.length;
    const totalPaymentAmount = userPayments.reduce((sum, payment) => sum + (payment.fine || 0), 0);
    const successfulPayments = userPayments.filter(payment => payment.paymentStatus === 'completed').length;

    const totalInteractions = userBorrowedBooks.length;

    // Calculate total reading days (only for returned books)
    const totalReadingDays = userBorrowedBooks
      .filter((b) => b.returnDate && b.borrowDate)
      .reduce(
        (sum, b) => sum + daysBetween(b.borrowDate, new Date(b.returnDate)),
        0
      );

    // Calculate average reading days
    const avgReadingDays =
      returned > 0 ? Math.round(totalReadingDays / returned) : 0;

    return {
      borrowed,
      returned,
      overdue,
      totalFines,
      paidFines,
      pendingFines,
      totalPayments,
      totalPaymentAmount,
      successfulPayments,
      totalInteractions,
      totalReadingDays,
      avgReadingDays,
    };
  }, [userBorrowedBooks, userPayments]);

  // Enhanced genres with counts
  const genres = useMemo(() => {
    const genreMap = new Map();

    // Debug: Log userBorrowedBooks
    // console.log("User borrowed books:", userBorrowedBooks);

    userBorrowedBooks.forEach((rec) => {
      // More robust genre extraction - handle various edge cases
      let genre = "Other";

      // Check if book object exists and has genre property
      if (rec?.book?.genre) {
        genre = rec.book.genre.trim();
      }

      // If genre is empty or just whitespace, default to "Other"
      if (!genre || genre === "") {
        genre = "Other";
      }

      // Debug: Log each book's genre
      // console.log("Book genre:", rec?.book?.title, "->", genre);

      genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
    });

    // Convert to array and sort by count
    const genreArray = Array.from(genreMap, ([name, count]) => ({
      name,
      count,
    }));
    genreArray.sort((a, b) => b.count - a.count);

    // Debug: Log final genres array
    // console.log("Final genres array:", genreArray);

    return [{ name: "All", count: userBorrowedBooks.length }, ...genreArray];
  }, [userBorrowedBooks]);

  // Find favorite genre with percentage
  const favoriteGenre = useMemo(() => {
    // Debug: Log genres array
    // console.log("Genres array:", genres);

    // Check if we have any genres besides "All"
    if (genres.length <= 1) {
      // console.log("Only All genre exists or no genres found");
      return null;
    }

    // Find the first genre that's not "All" and has a count > 0
    const favorite = genres.find(g => g.name !== "All" && g.count > 0);
    // console.log("Favorite genre found:", favorite);

    // If no favorite genre found or count is 0, return null
    if (!favorite || favorite.count === 0) {
      // console.log("No favorite genre with count > 0");
      return null;
    }

    const totalBooks = userBorrowedBooks.length;
    const percentage = totalBooks > 0 ? Math.round((favorite.count / totalBooks) * 100) : 0;

    // console.log("Favorite genre with percentage:", {...favorite, percentage});

    return {
      ...favorite,
      percentage
    };
  }, [genres, userBorrowedBooks]);

  // Enhanced pie chart with more visual appeal - now including all three categories
  const pieData = useMemo(
    () => ({
      labels: ["Total Borrowed", "Currently Borrowed", "Returned"],
      datasets: [
        {
          data: [userBorrowedBooks.length, totals.borrowed, totals.returned],
          backgroundColor: ["#6b7280", "#3b82f6", "#10b981"],
          hoverBackgroundColor: ["#9ca3af", "#60a5fa", "#34d399"],
          borderWidth: 2,
          borderColor: "#fff",
          hoverOffset: 8,
        },
      ],
    }),
    [userBorrowedBooks.length, totals.borrowed, totals.returned]
  );

  // Genre distribution chart data
  const genreDistributionData = useMemo(() => {
    const genreMap = new Map();
    userBorrowedBooks.forEach(book => {
      // More robust genre extraction for genre distribution chart
      let genre = "Other";

      // Check if book object exists and has genre property
      if (book?.book?.genre) {
        genre = book.book.genre.trim();
      }

      // If genre is empty or just whitespace, default to "Other"
      if (!genre || genre === "") {
        genre = "Other";
      }

      genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
    });

    const labels = Array.from(genreMap.keys());
    const data = Array.from(genreMap.values());

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            "#151619",
            "#3D3E3E",
            "#5a5b5b",
            "#2a2a2a",
            "#454646",
            "#606161"
          ],
          hoverBackgroundColor: [
            "#2a2b2b",
            "#4b4c4c",
            "#6b6c6c",
            "#3a3b3b",
            "#555656",
            "#707171"
          ],
          borderWidth: 2,
          borderColor: "#fff",
        },
      ],
    };
  }, [userBorrowedBooks]);

  // Enhanced line chart with better visuals
  const lineData = useMemo(() => {
    const days = [];
    const counts = [];

    for (let i = 13; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      days.push(
        `${String(day.getDate()).padStart(2, "0")}/${String(
          day.getMonth() + 1
        ).padStart(2, "0")}`
      );

      const count = userBorrowedBooks.filter((b) => {
        if (!b.borrowDate) return false;
        const bd = new Date(b.borrowDate);
        return (
          bd.getDate() === day.getDate() &&
          bd.getMonth() === day.getMonth() &&
          bd.getFullYear() === day.getFullYear()
        );
      }).length;

      counts.push(count);
    }

    return {
      labels: days,
      datasets: [
        {
          label: "Daily Borrows",
          data: counts,
          borderColor: "#151619",
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 200);
            gradient.addColorStop(0, "rgba(21, 22, 25, 0.3)");
            gradient.addColorStop(1, "rgba(21, 22, 25, 0.0)");
            return gradient;
          },
          tension: 0.4,
          fill: true,
          pointBackgroundColor: "#151619",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [userBorrowedBooks]);

  // Enhanced filtering with tab support
  const filtered = useMemo(() => {
    let arr = userBorrowedBooks.slice();

    // Apply optimistic local state
    arr = arr.map((r) => {
      if (localState[r._id]) {
        return { ...r, ...localState[r._id] };
      }
      return r;
    });

    // Apply tab filter
    if (activeTab === "borrowed") {
      arr = arr.filter((r) => !r.returnDate);
    } else if (activeTab === "returned") {
      arr = arr.filter((r) => !!r.returnDate);
    }

    // Apply search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter((r) => {
        const title =
          r?.book?.title?.toLowerCase() || r.bookName?.toLowerCase?.() || "";
        const email =
          r?.user?.email?.toLowerCase?.() || r.email?.toLowerCase?.() || "";
        return (
          title.includes(q) ||
          email.includes(q) ||
          (r.book?.isbn || "").toLowerCase().includes(q)
        );
      });
    }

    // Apply genre filter
    if (genreFilter !== "All") {
      arr = arr.filter((r) => (r?.book?.genre || "Other") === genreFilter);
    }

    // Apply overdue filter - FIXED: Use 60 days instead of 14 days
    if (onlyOverdue) {
      arr = arr.filter((r) => {
        if (r.returnDate) return false;
        if (r.dueDate) {
          return new Date(r.dueDate) < new Date();
        }
        return false;
      });
    }

    // Apply sorting
    switch (sortBy) {
      case "oldest":
        arr.sort(
          (a, b) =>
            new Date(a.borrowDate || a.createdAt) -
            new Date(b.borrowDate || b.createdAt)
        );
        break;
      case "title":
        arr.sort((a, b) =>
          (a.book?.title || "").localeCompare(b.book?.title || "")
        );
        break;
      case "dueSoon":
        arr.sort((a, b) => {
          const da = a.dueDate ? new Date(a.dueDate) : new Date(9999, 0, 1);
          const db = b.dueDate ? new Date(b.dueDate) : new Date(9999, 0, 1);
          return da - db;
        });
        break;
      default: // latest
        arr.sort(
          (a, b) =>
            new Date(b.borrowDate || b.createdAt) -
            new Date(a.borrowDate || a.createdAt)
        );
    }

    return arr;
  }, [
    userBorrowedBooks,
    search,
    genreFilter,
    onlyOverdue,
    sortBy,
    localState,
    activeTab,
  ]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const paginated = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page, perPage]);

  // Enhanced recent activity with icons
  const recentActivity = useMemo(() => {
    return userBorrowedBooks
      .slice()
      .sort(
        (a, b) =>
          new Date(b.borrowDate || b.createdAt) -
          new Date(a.borrowDate || a.createdAt)
      )
      .slice(0, 6);
  }, [userBorrowedBooks]);

  // Enhanced CSV export with more data
  const handleExportCSV = useCallback(() => {
    if (!userBorrowedBooks || userBorrowedBooks.length === 0) return;
    const data = userBorrowedBooks.map((r) => ({
      id: r._id,
      title: r.book?.title || r.bookName || "Untitled",
      isbn: r.book?.ISBN || r.book?.isbn || "",
      genre: r.book?.genre || "Other",
      borrowDate: r.borrowDate || r.createdAt || "",
      returnDate: r.returnDate || "",
      dueDate: r.dueDate || "",
      status: r.returnDate ? "Returned" : "Borrowed",
      price: r.price ?? 0,
      fine: r.fine ?? 0,
      paymentStatus: r.paymentStatus || "unpaid",
      daysBorrowed: r.returnDate
        ? daysBetween(r.borrowDate, new Date(r.returnDate))
        : daysBetween(r.borrowDate),
    }));
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(
      blob,
      `borrowed-books-${authUser?.email || "user"}-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`
    );
  }, [userBorrowedBooks, authUser]);

  // Enhanced mark as returned with confirmation
  const markReturnedLocally = async (recordId) => {
    if (!window.confirm("Are you sure you want to mark this book as returned?"))
      return;

    // Optimistic UI update
    setLocalState((s) => ({
      ...s,
      [recordId]: { returnDate: new Date().toISOString() },
    }));

    // TODO: Add actual API call here
  };

  // Enhanced refresh with visual feedback
  const onRefresh = async () => {
    if (!authUser?.email) return;

    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchUserBorrowedBooks(authUser.email)),
        dispatch(fetchUserPayments())
      ]);
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // Book detail modal
  const openBookDetail = (record) => setSelectedBook(record);
  const closeBookDetail = () => setSelectedBook(null);

  // Loading indicator for async operations
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-20">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#3D3E3E]"></div>
    </div>
  );

  // Add this function to handle payment success
  const handlePaymentSuccess = (payment) => {
    // Refresh borrowed books to reflect the payment
    if (authUser?.email) {
      dispatch(fetchUserBorrowedBooks(authUser.email));
    }
    setSelectedBorrowRecord(null);
  };

  // Calculate reading habits
  const readingHabits = useMemo(() => {
    const totalBooks = userBorrowedBooks.length;
    const returnedBooks = userBorrowedBooks.filter(b => b.returnDate).length;
    const activeLoans = userBorrowedBooks.filter(b => !b.returnDate).length;
    const overdueBooks = userBorrowedBooks.filter(b => {
      if (b.returnDate) return false;
      if (b.dueDate) {
        return new Date(b.dueDate) < new Date();
      }
      return false;
    }).length;

    const returnRate = totalBooks > 0 ? Math.round((returnedBooks / totalBooks) * 100) : 0;
    const overdueRate = activeLoans > 0 ? Math.round((overdueBooks / activeLoans) * 100) : 0;

    return {
      totalBooks,
      returnedBooks,
      activeLoans,
      overdueBooks,
      returnRate,
      overdueRate
    };
  }, [userBorrowedBooks]);

  // Calculate favorite genres
  const favoriteGenres = useMemo(() => {
    const genreMap = new Map();
    userBorrowedBooks.forEach(book => {
      // More robust genre extraction for favorite genres calculation
      let genre = "Other";

      // Check if book object exists and has genre property
      if (book?.book?.genre) {
        genre = book.book.genre.trim();
      }

      // If genre is empty or just whitespace, default to "Other"
      if (!genre || genre === "") {
        genre = "Other";
      }

      genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
    });

    // Convert to array and sort by count
    const genreArray = Array.from(genreMap.entries())
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Debug: Log favorite genres
    // console.log("Favorite genres:", genreArray);

    return genreArray;
  }, [userBorrowedBooks]);

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

      const count = userBorrowedBooks.filter(book => {
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
  }, [userBorrowedBooks]);

  return (
    <main className="relative flex-1 p-4 md:p-6 pt-20 md:pt-24 bg-gray-50 min-h-screen">
      {selectedBorrowRecord && (
        <PaymentPopup
          borrowRecord={selectedBorrowRecord}
          onClose={() => setSelectedBorrowRecord(null)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      <Header />

      <div className="space-y-6 overflow-hidden">
        {/* Top header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 dashboard-section bg-gray-100 rounded-lg p-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#3D3E3E]">
              Welcome back{authUser ? `, ${authUser.name}` : ""}
            </h1>
            <p className="text-sm text-[#151619] mt-1">
              Personal summary of your borrowing activity
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:shadow-md transition disabled:opacity-50 w-full sm:w-auto justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v6h6M20 20v-6h-6"
                />
              </svg>
              <span className="text-sm text-[#3D3E3E]">
                {refreshing ? "Refreshing..." : "Refresh"}
              </span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#151619] text-white rounded-md shadow-sm hover:opacity-90 transition w-full sm:w-auto justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <span className="text-sm">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Enhanced stat cards with 3D book effect */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 15,
              mass: 0.5,
              duration: 0.3,
              delay: 0.1
            }}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <BookCard
              title="Overdue"
              value={totals?.overdue ?? 0}
              subtitle="Borrowed > 60 days"
              colorClass="from-red-700 to-red-500"
              icon={<img src={bookIcon} alt="book" className="w-full h-full object-contain" />}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 15,
              mass: 0.5,
              duration: 0.3,
              delay: 0.2
            }}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <BookCard
              title="Fine Paid vs Pending"
              value={`₹${totals?.paidFines?.toFixed(2) ?? "0.00"}`}
              subtitle={`Paid vs ₹${totals?.pendingFines?.toFixed(2) ?? "0.00"} pending`}
              colorClass="from-green-700 to-green-500"
              icon={<CreditCard className="w-full h-full text-white" />}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 15,
              mass: 0.5,
              duration: 0.3,
              delay: 0.3
            }}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <BookCard
              title={favoriteGenre?.name || "Favorite Genre"}
              value={favoriteGenre ? `${favoriteGenre.percentage}%` : "0%"}
              subtitle="Most Borrowed Genre"
              colorClass="from-purple-700 to-purple-500"
              icon={<Award className="w-full h-full text-white" />}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 15,
              mass: 0.5,
              duration: 0.3,
              delay: 0.4
            }}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <BookCard
              title="Reading Stats"
              value={totals?.returned ?? 0}
              subtitle={
                totals?.returned > 0
                  ? `${totals?.totalReadingDays ?? 0} days reading`
                  : "No books returned yet"
              }
              colorClass="from-blue-700 to-blue-500"
              icon={<BookOpen className="w-full h-full text-white" />}
            />
          </motion.div>
        </section>


        {/* Enhanced charts section */}
        <section className={`grid grid-cols-1 ${is1024Breakpoint ? 'lg:grid-cols-1' : 'lg:grid-cols-3'} gap-6 overflow-hidden`}>
          {/* Enhanced pie chart */}
          <motion.article
            className="col-span-1 bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden animate-fade-in-up dashboard-section"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="text-lg font-semibold mb-4 text-[#3D3E3E] overflow-hidden flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#3D3E3E]" />
              Borrowing Statistics
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
                        display: false,
                      },
                    },
                  }}
                />
              </div>
            </div>
            <div className="mt-4 text-center">
              <div className="grid grid-cols-2 gap-y-3 items-center text-[#151619]">
                <span className="text-sm font-medium flex items-center gap-1 justify-end">
                  <div className="w-4 h-4 rounded-full bg-[#6b7280]"></div>
                  Total Borrowed:
                </span>
                <span className="text-base font-semibold text-left">
                  {userBorrowedBooks.length}
                </span>

                <span className="text-sm font-medium flex items-center gap-1 justify-end">
                  <div className="w-4 h-4 rounded-full bg-[#3b82f6]"></div>
                  Currently Borrowed:
                </span>
                <span className="text-base font-semibold text-left">
                  {totals.borrowed}
                </span>

                <span className="text-sm font-medium flex items-center gap-1 justify-end">
                  <div className="w-4 h-4 rounded-full bg-[#10b981]"></div>
                  Returned:
                </span>
                <span className="text-base font-semibold text-left">
                  {totals.returned}
                </span>
              </div>
            </div>
          </motion.article>

          {/* Enhanced trend line */}
          <motion.article className={`col-span-1 ${is1024Breakpoint ? 'lg:col-span-1' : 'lg:col-span-2'} bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden animate-fade-in-up dashboard-section`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3 overflow-hidden">
              <h3 className="text-lg font-semibold text-[#3D3E3E] overflow-hidden flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#3D3E3E]" />
                Borrowing Trend (last 14 days)
              </h3>
              <span className="text-sm text-gray-500 overflow-hidden">Recent activity</span>
            </header>
            <div className="h-40 overflow-hidden">
              <Line
                data={lineData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    x: {
                      grid: { display: false },
                      ticks: { color: "#3D3E3E" },
                    },
                    y: {
                      beginAtZero: true,
                      ticks: { color: "#3D3E3E" },
                    },
                  },
                }}
              />
            </div>
          </motion.article>
        </section>

        {/* New Charts Section - Genre Distribution */}
        <section className={`grid grid-cols-1 ${is1024Breakpoint ? 'lg:grid-cols-1' : 'lg:grid-cols-3'} gap-6`}>
          {/* Genre Distribution Chart */}
          <motion.article className={`col-span-1 ${is1024Breakpoint ? 'lg:col-span-1' : 'lg:col-span-1'} bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 dashboard-section`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
            <h4 className="font-semibold mb-4 text-[#3D3E3E] flex items-center gap-2">
              <Target className="w-5 h-5 text-[#3D3E3E]" />
              Your Reading Mix
            </h4>
            <div className="h-48">
              <Pie
                data={genreDistributionData}
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

          {/* Reading Habits */}
          <motion.article className={`col-span-1 ${is1024Breakpoint ? 'lg:col-span-1' : 'lg:col-span-1'} bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 dashboard-section`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
            <h4 className="font-semibold mb-4 text-[#3D3E3E] flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Reading Habits
            </h4>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Total Books</p>
                  <p className="text-xl font-bold text-[#3D3E3E]">{readingHabits.totalBooks}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Active Loans</p>
                  <p className="text-xl font-bold text-[#3D3E3E]">{readingHabits.activeLoans}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Return Rate</p>
                  <p className="text-xl font-bold text-green-600">{readingHabits.returnRate}%</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Overdue Rate</p>
                  <p className="text-xl font-bold text-red-600">{readingHabits.overdueRate}%</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-[#3D3E3E] mb-2">Return Rate Progress</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-green-600 h-2.5 rounded-full"
                    style={{ width: `${readingHabits.returnRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </motion.article>

          {/* Fine Summary */}
          <motion.article className={`col-span-1 ${is1024Breakpoint ? 'lg:col-span-1' : 'lg:col-span-1'} bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 dashboard-section`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}>
            <h4 className="font-semibold mb-4 text-[#3D3E3E] flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#3D3E3E]" />
              Fine Summary
            </h4>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Total Fines</p>
                  <p className="text-xl font-bold text-[#3D3E3E]">₹{totals.totalFines?.toFixed(2) ?? "0.00"}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Paid Fines</p>
                  <p className="text-xl font-bold text-green-600">₹{totals.paidFines?.toFixed(2) ?? "0.00"}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Pending Fines</p>
                  <p className="text-xl font-bold text-red-600">₹{totals.pendingFines?.toFixed(2) ?? "0.00"}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Payment Rate</p>
                  <p className="text-xl font-bold text-blue-600">
                    {totals.totalFines > 0 ? Math.round((totals.paidFines / totals.totalFines) * 100) : 0}%
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-[#3D3E3E] mb-2">Payment Progress</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${totals.totalFines > 0 ? (totals.paidFines / totals.totalFines) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </motion.article>
        </section>

        {/* Enhanced controls & list with tabs */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Enhanced controls */}
          <motion.article
            className="lg:col-span-1 bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 dashboard-section"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <h4 className="font-semibold mb-3 text-[#3D3E3E] flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Search & Filters
            </h4>

            {/* Tab filters */}
            <div className="flex mb-4 border-b">
              <button
                className={`px-4 py-2 text-sm font-medium ${activeTab === "all"
                  ? "border-b-2 border-[#3D3E3E] text-[#3D3E3E]"
                  : "text-gray-500"
                  }`}
                onClick={() => setActiveTab("all")}
              >
                All ({userBorrowedBooks.length})
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${activeTab === "borrowed"
                  ? "border-b-2 border-[#3D3E3E] text-[#3D3E3E]"
                  : "text-gray-500"
                  }`}
                onClick={() => setActiveTab("borrowed")}
              >
                Borrowed ({totals.borrowed})
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${activeTab === "returned"
                  ? "border-b-2 border-[#3D3E3E] text-[#3D3E3E]"
                  : "text-gray-500"
                  }`}
                onClick={() => setActiveTab("returned")}
              >
                Returned ({totals.returned})
              </button>
            </div>

            <div className="space-y-3">
              <input
                placeholder="Search by title, ISBN or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full p-2 border border-gray-200 rounded-md text-[#3D3E3E]"
              />

              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={genreFilter}
                  onChange={(e) => setGenreFilter(e.target.value)}
                  className="flex-1 p-2 border rounded-md"
                >
                  {genres.map((g) => (
                    <option value={g.name} key={g.name}>
                      {g.name} ({g.count})
                    </option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-36 p-2 border rounded-md"
                >
                  <option value="latest">Latest</option>
                  <option value="oldest">Oldest</option>
                  <option value="title">Title</option>
                  <option value="dueSoon">Due Soon</option>
                </select>
              </div>

              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="form-checkbox rounded text-[#3D3E3E]"
                  checked={onlyOverdue}
                  onChange={(e) => {
                    setOnlyOverdue(e.target.checked);
                    setPage(1);
                  }}
                />
                <span>Only show overdue</span>
              </label>
            </div>

            <div className="mt-4 pt-4 border-t">
              <h5 className="text-sm text-gray-500 mb-2">Quick actions</h5>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setSearch("");
                    setGenreFilter("All");
                    setOnlyOverdue(false);
                    setSortBy("latest");
                    setActiveTab("all");
                  }}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  Reset Filters
                </button>
                <button
                  onClick={() => {
                    setPerPage(10);
                    setPage(1);
                  }}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  Show 10
                </button>
              </div>
            </div>
          </motion.article>

          {/* Enhanced list */}
          <motion.article
            className="lg:col-span-2 bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 dashboard-section"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h4 className="font-semibold text-[#3D3E3E] flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 4v12l-4-2-4 2V4M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Your Borrowed Items
              </h4>
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {filtered.length} records
                </span>
              </div>
            </div>

            {paginated.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="mt-2">No records found with current filters</p>
                <button
                  onClick={() => {
                    setSearch("");
                    setGenreFilter("All");
                    setOnlyOverdue(false);
                    setSortBy("latest");
                    setActiveTab("all");
                  }}
                  className="mt-3 px-4 py-2 bg-[#3D3E3E] text-white rounded-md text-sm"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {paginated.map((rec) => {
                  const isReturned = !!rec.returnDate;
                  // FIXED: Use consistent 60-day logic for determining overdue status
                  const isOverdue = !isReturned && (
                    (rec.dueDate && new Date(rec.dueDate) < new Date()) ||
                    (rec.borrowDate && daysBetween(rec.borrowDate) > 60)
                  );
                  const daysBorrowed = isReturned
                    ? daysBetween(rec.borrowDate, new Date(rec.returnDate))
                    : daysBetween(rec.borrowDate);

                  return (
                    <div
                      key={rec._id}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 border-b last:border-none pb-3 transition-all hover:bg-gray-50 p-2 rounded"
                    >
                      <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
                        <img src={bookIcon} alt="book" className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#151619] truncate">
                              {rec?.book?.title ||
                                rec.bookName ||
                                "Untitled Book"}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {rec.book?.ISBN || rec.book?.isbn || "No ISBN"} • {rec.book?.genre || "Other"}
                            </p>
                          </div>
                          <div className="text-right sm:text-left">
                            <p
                              className={`text-xs font-semibold ${isReturned
                                ? "text-green-600"
                                : isOverdue
                                  ? "text-red-600"
                                  : "text-indigo-700"
                                }`}
                            >
                              {isReturned
                                ? "Returned"
                                : isOverdue
                                  ? `Overdue (${daysBetween(rec.borrowDate)}d)`
                                  : "Borrowed"}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDate(rec.borrowDate || rec.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => openBookDetail(rec)}
                            className="px-2 py-1 text-xs border rounded-md hover:bg-gray-100 transition"
                          >
                            Details
                          </button>

                          {!isReturned && (
                            <button
                              onClick={() => markReturnedLocally(rec._id)}
                              className="px-2 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                            >
                              Mark Returned
                            </button>
                          )}

                          {isReturned && (
                            <span className="px-2 py-1 text-xs bg-gray-100 rounded-md">
                              Returned on {formatDate(rec.returnDate)}
                            </span>
                          )}

                          {/* Add payment button for unpaid fines */}
                          {rec.fine > 0 && rec.paymentStatus !== "completed" && (
                            <button
                              onClick={() => setSelectedBorrowRecord(rec)}
                              className="px-2 py-1 text-xs bg-black text-white rounded-md hover:bg-gray-800 transition flex items-center"
                            >
                              <CreditCard className="w-3 h-3 mr-1" />
                              Pay Fine (₹{rec.fine.toFixed(2)})
                            </button>
                          )}

                          {rec.fine > 0 && rec.paymentStatus === "completed" && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-md">
                              Fine Paid
                            </span>
                          )}

                          <span className="text-xs text-gray-400">
                            {isReturned
                              ? `Read in ${daysBorrowed} days`
                              : `Due: ${rec.dueDate ? formatDate(rec.dueDate) : "—"
                              }`}
                          </span>
                          <span className="text-xs text-gray-400">
                            Price: ₹{rec.price?.toFixed?.(2) ?? "0.00"} • Fine: ₹{rec.fine?.toFixed?.(2) ?? "0.00"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Enhanced pagination */}
            {filtered.length > 0 && (
              <div className="mt-6 pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    className="px-2 py-1 border rounded disabled:opacity-50 text-sm"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-2 py-1 border rounded disabled:opacity-50 text-sm"
                  >
                    Prev
                  </button>
                  <span className="px-3 text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-2 py-1 border rounded disabled:opacity-50 text-sm"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                    className="px-2 py-1 border rounded disabled:opacity-50 text-sm"
                  >
                    Last
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-500">Per page</label>
                  <select
                    value={perPage}
                    onChange={(e) => {
                      setPerPage(Number(e.target.value));
                      setPage(1);
                    }}
                    className="p-1 border rounded text-sm"
                  >
                    <option value={6}>6</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>
              </div>
            )}
          </motion.article>
        </section>

        {/* Enhanced activity + branding */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity - Enhanced with more stats and visual appeal */}
          <motion.article
            className="lg:col-span-2 bg-white p-5 rounded-lg shadow-md dashboard-section hover:shadow-lg transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Recent Activity
              </h4>
              <input
                type="text"
                placeholder="Search activity..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="p-2 border border-gray-300 rounded-md text-gray-700 text-sm w-full sm:w-48"
              />
            </div>

            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto flex items-center justify-center">
                  <Clock className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm mt-3">No recent activity yet</p>
                <p className="text-gray-400 text-xs mt-1">Start borrowing books to see your activity here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((rec, i) => {
                  const isReturned = !!rec.returnDate;
                  // FIXED: Use consistent 60-day logic for determining overdue status
                  const isOverdue = !isReturned && (
                    (rec.dueDate && new Date(rec.dueDate) < new Date()) ||
                    (rec.borrowDate && daysBetween(rec.borrowDate) > 60)
                  );

                  return (
                    <motion.div
                      key={i}
                      className="flex flex-col md:flex-row md:items-center gap-4 border-b border-gray-100 pb-4 last:border-none last:pb-0 rounded-lg p-3 hover:bg-gray-50 text-gray-800 transition-all duration-200 cursor-pointer group"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.1 }}
                      whileHover={{ x: 5, transition: { duration: 0.2 } }}
                      onClick={() => openBookDetail(rec)}
                    >
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                              {rec?.book?.title || rec.bookName || "Untitled Book"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Borrowed: {formatDate(rec.borrowDate || rec.createdAt)}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {rec.fine > 0 && (
                              <span className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${rec.paymentStatus === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                                }`}>
                                <IndianRupee className="w-3 h-3" />
                                {rec.fine.toFixed(2)}
                              </span>
                            )}

                            <div className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${isReturned
                                ? "bg-green-100 text-green-800"
                                : isOverdue
                                  ? "bg-red-100 text-red-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}>
                              {isReturned ? (
                                <>
                                  <CheckCircle className="w-3 h-3" />
                                  Returned
                                </>
                              ) : isOverdue ? (
                                <>
                                  <Clock className="w-3 h-3" />
                                  Overdue
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3" />
                                  Borrowed
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          <div className="flex items-center text-xs text-gray-500 gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Due: {rec.dueDate ? formatDate(rec.dueDate) : "—"}</span>
                          </div>

                          {isReturned && rec.returnDate && (
                            <div className="flex items-center text-xs text-gray-500 gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Returned: {formatDate(rec.returnDate)}</span>
                            </div>
                          )}

                          {rec.fine > 0 && (
                            <div className="flex items-center text-xs text-gray-500 gap-1">
                              <CreditCard className="w-3 h-3" />
                              <span>{rec.paymentStatus === "completed" ? "Paid" : "Unpaid"}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.article>

          {/* Enhanced Stats Section */}
          <motion.article
            className="lg:col-span-1 bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex flex-col dashboard-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            {/* Logo and Branding */}
            <div className="flex flex-col items-center mb-6">
              <img
                src={logo_with_title}
                alt="LibraFlow Logo"
                className="max-w-[140px] mb-3"
              />
              <p className="text-sm text-gray-500 text-center">
                Library made simple. Track your books and never lose an ISBN again.
              </p>
            </div>

            {/* Reading Stats */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-5">
              <h5 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Your Reading Stats
              </h5>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-500">Books Read</p>
                  <p className="text-xl font-bold text-blue-600">{totals.returned}</p>
                </div>

                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-500">Reading Days</p>
                  <p className="text-xl font-bold text-indigo-600">{totals.totalReadingDays}</p>
                </div>

                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-500">Avg. Days/Book</p>
                  <p className="text-xl font-bold text-purple-600">{totals.avgReadingDays}</p>
                </div>

                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-500">Return Rate</p>
                  <p className="text-xl font-bold text-green-600">
                    {readingHabits.totalBooks > 0
                      ? Math.round((readingHabits.returnedBooks / readingHabits.totalBooks) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            </div>

            {/* Current Status */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4">
              <h5 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                Current Status
              </h5>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Borrowings</span>
                  <span className="font-semibold text-gray-800">{totals.borrowed}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Overdue Books</span>
                  <span className="font-semibold text-red-600">{totals.overdue}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Favorite Genre</span>
                  <span className="font-semibold text-amber-600">
                    {favoriteGenre?.name || "None"}
                  </span>
                </div>
              </div>
            </div>
          </motion.article>
        </section>

        {/* Enhanced footer tip */}
        <footer className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 mt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-gray-600 text-sm dashboard-section">
          <div>
            <span className="font-semibold">Pro Tip:</span> Return books before
            due date to avoid overdue status. You can export your history for
            records.
          </div>
          <div>Dashboard powered by LibraFlow • Made for learners</div>
        </footer>
      </div>

      {/* Enhanced Modal - Book Detail */}
      {selectedBook && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm">
          <motion.div 
            className="bg-white w-full max-w-3xl rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-3 sm:p-4 md:p-6 flex justify-between items-center">
              <h3 className="font-bold text-base sm:text-lg md:text-xl text-white">Book Details</h3>
              <button
                onClick={closeBookDetail}
                className="text-gray-300 hover:text-white transition-colors p-1 sm:p-2 rounded-full hover:bg-white/10"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            
            <div className="p-3 sm:p-4 md:p-6">
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                {/* Book Cover and Actions - Stacked on mobile, side-by-side on larger screens */}
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  <div className="flex-grow">
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <h4 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-2">
                          {selectedBook.book?.title || selectedBook.bookName}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {selectedBook.book?.genre || "Other"}
                          </span>
                          {selectedBook.fine > 0 && selectedBook.paymentStatus !== "completed" && (
                            <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                              ₹{selectedBook.fine.toFixed(2)} (Unpaid)
                            </span>
                          )}
                          {selectedBook.fine > 0 && selectedBook.paymentStatus === "completed" && (
                            <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                              ₹{selectedBook.fine.toFixed(2)} (Paid)
                            </span>
                          )}
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                            ISBN: {selectedBook.book?.ISBN || selectedBook.book?.isbn || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Cards - Responsive grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 sm:p-4 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      </div>
                      <h5 className="font-semibold text-gray-800 text-sm sm:text-base">Status</h5>
                    </div>
                    <p className={`text-base sm:text-lg font-bold ${selectedBook.returnDate ? "text-green-600" : "text-blue-600"}`}>
                      {selectedBook.returnDate ? "Returned" : "Borrowed"}
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3 sm:p-4 rounded-xl border border-amber-100">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                      </div>
                      <h5 className="font-semibold text-gray-800 text-sm sm:text-base">Borrowed On</h5>
                    </div>
                    <p className="text-sm sm:text-base font-bold text-gray-800">
                      {formatDate(selectedBook.borrowDate || selectedBook.createdAt)}
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 p-3 sm:p-4 rounded-xl border border-purple-100">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h5 className="font-semibold text-gray-800 text-sm sm:text-base">Due Date</h5>
                    </div>
                    <p className="text-sm sm:text-base font-bold text-gray-800">
                      {selectedBook.dueDate ? formatDate(selectedBook.dueDate) : "—"}
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 sm:p-4 rounded-xl border border-green-100">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      </div>
                      <h5 className="font-semibold text-gray-800 text-sm sm:text-base">Price</h5>
                    </div>
                    <p className="text-sm sm:text-base font-bold text-gray-800">
                      ₹{selectedBook.price?.toFixed?.(2) ?? "0.00"}
                    </p>
                  </div>
                </div>

                {/* Fine Information */}
                <div className="bg-gradient-to-r from-gray-50 to-neutral-50 p-3 sm:p-4 rounded-xl border border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <h5 className="font-semibold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
                      <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                      Fine Information
                    </h5>
                    {selectedBook.fine > 0 && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedBook.paymentStatus === "completed" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {selectedBook.paymentStatus === "completed" ? "Paid" : "Unpaid"}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div>
                      <p className="text-gray-600 text-xs sm:text-sm">Total Fine</p>
                      <p className="text-lg sm:text-xl font-bold text-gray-800">
                        ₹{selectedBook.fine?.toFixed?.(2) ?? "0.00"}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-gray-600 text-xs sm:text-sm">Reading Time</p>
                      <p className="text-lg sm:text-xl font-bold text-gray-800">
                        {selectedBook.returnDate
                          ? `${daysBetween(
                            selectedBook.borrowDate,
                            new Date(selectedBook.returnDate)
                          )} days`
                          : `${daysBetween(selectedBook.borrowDate)} days so far`}
                      </p>
                    </div>
                  </div>
                  
                  {selectedBook.fine > 0 && selectedBook.paymentStatus !== "completed" && (
                    <button
                      onClick={() => setSelectedBorrowRecord(selectedBook)}
                      className="w-full py-2 sm:py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                      <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                      Pay Fine (₹{selectedBook.fine.toFixed(2)})
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
};

export default UserDashboard;