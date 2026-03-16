import React, { useState, useEffect, useMemo } from "react";
import { BookA, Grid, List, BookOpen, Calendar, IndianRupee, Check, CheckCircle, Clock, AlertCircle, TrendingUp, Target, CreditCard, User, Book } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toggleReadBookPopup } from "../store/slices/popupSlice";
import { fetchUserBorrowedBooks } from "../store/slices/borrowSlice";
import Header from "../layout/Header";
import ReadBookPopup from "../popups/ReadBookPopup";
import PaymentPopup from "../popups/PaymentPopup";
import { motion, AnimatePresence } from "framer-motion";
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

const MyBorrowedBooks = () => {
  const dispatch = useDispatch();
  const { books } = useSelector((state) => state.book);
  const { userBorrowedBooks, fetchLoading } = useSelector((state) => state.borrow);
  const { readBookPopup } = useSelector((state) => state.popup);
  const authUser = useSelector((state) => state.auth?.user);

  const [readBook, setReadBook] = useState("");
  const [filter, setFilter] = useState("all"); // Changed from "returned" to "all"
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBorrowRecord, setSelectedBorrowRecord] = useState(null);
  const [timelineView, setTimelineView] = useState(false);
  const [timelineData, setTimelineData] = useState([]);
  const [quickFilters, setQuickFilters] = useState({
    overdue: false,
    dueSoon: false,
    unpaidFines: false
  });

  // Fetch user borrowed books on component mount
  useEffect(() => {
    if (authUser?.email) {
      dispatch(fetchUserBorrowedBooks(authUser.email));
    }
  }, [authUser, dispatch]);

  // Update timeline data when userBorrowedBooks changes
  useEffect(() => {
    if (userBorrowedBooks) {
      // Always show all borrowed books in timeline (both returned and non-returned)
      const sortedData = [...userBorrowedBooks]
        .sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate)); // Newest first by default
      setTimelineData(sortedData);
    }
  }, [userBorrowedBooks]);

  const openReadBookPopup = (id) => {
    const book = books.find((book) => book._id === id);
    setReadBook(book);
    dispatch(toggleReadBookPopup());
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    const date = new Date(timestamp);
    return `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}/${date.getFullYear()} ${String(
      date.getHours()
    ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  const formatDateShort = (timestamp) => {
    if (!timestamp) return "-";
    const date = new Date(timestamp);
    return `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}/${date.getFullYear()}`;
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const borrowed = userBorrowedBooks?.filter((book) => !book.returnDate).length || 0;
    const returned = userBorrowedBooks?.filter((book) => book.returnDate).length || 0;
    const total = userBorrowedBooks?.length || 0;
    
    // Calculate overdue books
    const now = new Date();
    const overdue = userBorrowedBooks?.filter((book) => {
      if (book.returnDate) return false;
      const dueDate = new Date(book.dueDate);
      return dueDate < now;
    }).length || 0;
    
    // Calculate pending fines
    const pendingFines = userBorrowedBooks?.filter(book => 
      book.fine > 0 && book.paymentStatus !== "completed" && !book.returnDate
    ).length || 0;
    
    // Calculate total fine amount
    const totalFines = userBorrowedBooks?.reduce((sum, book) => 
      sum + (book.fine || 0), 0
    ) || 0;
    
    // Calculate unpaid fine amount
    const unpaidFines = userBorrowedBooks?.reduce((sum, book) => {
      if (book.fine > 0 && book.paymentStatus !== "completed" && !book.returnDate) {
        return sum + book.fine;
      }
      return sum;
    }, 0) || 0;
    
    // Find favorite genre
    const genreCount = {};
    userBorrowedBooks?.forEach(book => {
      const genre = book.book?.genre || "Other";
      genreCount[genre] = (genreCount[genre] || 0) + 1;
    });
    
    const favoriteGenre = Object.keys(genreCount).reduce((a, b) => 
      genreCount[a] > genreCount[b] ? a : b, "Other"
    );
    
    return {
      borrowed,
      returned,
      total,
      overdue,
      pendingFines,
      totalFines,
      unpaidFines,
      favoriteGenre
    };
  }, [userBorrowedBooks]);

  // Filter and search borrowed books
  const filteredBooks = useMemo(() => {
    let result = userBorrowedBooks || [];
    
    // Apply filter
    if (filter === "returned") {
      result = result.filter((book) => book.returnDate);
    } else if (filter === "nonReturned") {
      result = result.filter((book) => !book.returnDate);
    }
    // If filter is "all", we don't filter at all, showing both returned and non-returned books
    
    // Apply quick filters
    if (quickFilters.overdue) {
      const now = new Date();
      result = result.filter((book) => {
        if (book.returnDate) return false;
        const dueDate = new Date(book.dueDate);
        return dueDate < now;
      });
    }
    
    if (quickFilters.dueSoon) {
      const now = new Date();
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(now.getDate() + 3);
      
      result = result.filter((book) => {
        if (book.returnDate) return false;
        const dueDate = new Date(book.dueDate);
        return dueDate >= now && dueDate <= threeDaysFromNow;
      });
    }
    
    if (quickFilters.unpaidFines) {
      result = result.filter(book => 
        book.fine > 0 && book.paymentStatus !== "completed" && !book.returnDate
      );
    }
    
    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(book => 
        (book.book?.title?.toLowerCase().includes(term)) ||
        (book.book?.author?.toLowerCase().includes(term)) ||
        (book.book?.genre?.toLowerCase().includes(term))
      );
    }
    
    return result;
  }, [userBorrowedBooks, filter, searchTerm, quickFilters]);

  // Get status for a book
  const getBookStatus = (book) => {
    if (book.returnDate) return "returned";
    
    const now = new Date();
    const dueDate = new Date(book.dueDate);
    
    if (dueDate < now) return "overdue";
    
    const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    if (daysUntilDue <= 3) return "dueSoon";
    
    return "borrowed";
  };

  // Get status badge for a book
  const getStatusBadge = (book) => {
    const status = getBookStatus(book);
    
    switch (status) {
      case "returned":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Returned
          </span>
        );
      case "overdue":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
            <AlertCircle className="mr-1 h-3 w-3" />
            Overdue
          </span>
        );
      case "dueSoon":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="mr-1 h-3 w-3" />
            Due Soon
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <BookOpen className="mr-1 h-3 w-3" />
            Borrowed
          </span>
        );
    }
  };

  // Toggle quick filter
  const toggleQuickFilter = (filterName) => {
    setQuickFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  // Reading streak calculation
  const readingStreak = useMemo(() => {
    if (!userBorrowedBooks || userBorrowedBooks.length === 0) return 0;
    
    // Sort returned books by return date
    const returnedBooks = userBorrowedBooks
      .filter(book => book.returnDate)
      .sort((a, b) => new Date(a.returnDate) - new Date(b.returnDate));
    
    if (returnedBooks.length === 0) return 0;
    
    let streak = 0;
    let currentDate = new Date(returnedBooks[returnedBooks.length - 1].returnDate);
    currentDate.setHours(0, 0, 0, 0);
    
    // Check backwards from most recent return
    for (let i = returnedBooks.length - 1; i >= 0; i--) {
      const returnDate = new Date(returnedBooks[i].returnDate);
      returnDate.setHours(0, 0, 0, 0);
      
      // If consecutive days or same day, increment streak
      if (i === returnedBooks.length - 1 || 
          (currentDate - returnDate) / (1000 * 60 * 60 * 24) <= 1) {
        streak++;
        currentDate = returnDate;
      } else {
        break;
      }
    }
    
    return streak;
  }, [userBorrowedBooks]);

  // Get recommended books based on favorite genre and borrowing history
  const recommendedBooks = useMemo(() => {
    if (!books || !userBorrowedBooks) return [];
    
    // Create a more robust set of borrowed book IDs for quick lookup
    // Handle different possible structures for borrowed books
    const borrowedBookIds = new Set();
    userBorrowedBooks.forEach(borrowedBook => {
      // Check multiple possible property names for book ID
      const bookId = borrowedBook.book?._id || 
                     borrowedBook.bookId || 
                     borrowedBook.book?._id ||
                     borrowedBook._id;
      if (bookId) {
        borrowedBookIds.add(bookId);
      }
    });
    
    // Get all genres from borrowed books and count them
    const genreCount = {};
    userBorrowedBooks?.forEach(book => {
      // Handle different possible structures for book data
      const genre = book.book?.genre || book.bookGenre || book.genre || "Other";
      genreCount[genre] = (genreCount[genre] || 0) + 1;
    });
    
    // Sort genres by frequency
    const sortedGenres = Object.keys(genreCount).sort((a, b) => genreCount[b] - genreCount[a]);
    const topGenres = sortedGenres.slice(0, 3); // Get top 3 genres
    
    // If we don't have favorite genres, use all available genres
    const genresToUse = topGenres.length > 0 ? topGenres : (books || []).map(book => book.genre).filter(Boolean);
    
    // Filter books by criteria with enhanced logic
    let filteredBooks = (books || []).filter(book => {
      // Exclude the currently viewed book
      if (book._id === readBook?._id) return false;
      
      // Only include available books
      if (!book.available) return false;
      
      // Exclude books that are already borrowed by the user
      if (borrowedBookIds.has(book._id)) return false;
      
      // Include books from user's preferred genres (if we have them)
      if (genresToUse.length > 0) {
        return genresToUse.includes(book.genre);
      }
      
      // If no preferred genres, include all available books not already borrowed
      return true;
    });
    
    // If we don't have enough books from preferred genres, add more books
    if (filteredBooks.length < 3) {
      const additionalBooks = (books || []).filter(book => {
        // Exclude the currently viewed book
        if (book._id === readBook?._id) return false;
        
        // Only include available books
        if (!book.available) return false;
        
        // Exclude books that are already borrowed by the user
        if (borrowedBookIds.has(book._id)) return false;
        
        // Exclude books already in filteredBooks
        return !filteredBooks.some(filteredBook => filteredBook._id === book._id);
      });
      
      filteredBooks = [...filteredBooks, ...additionalBooks];
    }
    
    // Sort by popularity (quantity) and rating if available
    filteredBooks.sort((a, b) => {
      // First sort by quantity (popularity)
      const quantityDiff = (b.quantity || 0) - (a.quantity || 0);
      if (quantityDiff !== 0) return quantityDiff;
      
      // If quantities are equal, sort by rating if available
      return (b.rating || 0) - (a.rating || 0);
    });
    
    return filteredBooks.slice(0, 3);
  }, [books, userBorrowedBooks, readBook]);

  // Handle payment success
  const handlePaymentSuccess = (payment) => {
    // Refresh borrowed books to update payment status
    if (authUser?.email) {
      dispatch(fetchUserBorrowedBooks(authUser.email));
    }
    setSelectedBorrowRecord(null);
  };

  return (
    <>
      <main className="relative flex-1 p-4 md:p-6 pt-20 md:pt-24 bg-gray-50 min-h-screen">
        <Header />

        {/* Sub Header */}
        <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-[#3D3E3E]">
            My Borrowed Books
          </h2>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg ${viewMode === "grid" ? "bg-black text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
              aria-label="Grid view"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg ${viewMode === "list" ? "bg-black text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Section */}
        <motion.div 
          className="bg-white rounded-lg shadow-md p-4 mb-4 card-3d"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                className={`relative rounded text-center font-semibold py-2 px-4 text-sm ${
                  filter === "returned"
                    ? "bg-black text-white"
                    : "bg-gray-200 text-black hover:bg-gray-300"
                } btn-3d`}
                onClick={() => setFilter("returned")}
              >
                Returned Books
              </button>
              <button
                className={`relative rounded text-center font-semibold py-2 px-4 text-sm ${
                  filter === "nonReturned"
                    ? "bg-black text-white"
                    : "bg-gray-200 text-black hover:bg-gray-300"
                } btn-3d`}
                onClick={() => setFilter("nonReturned")}
              >
                Non-Returned Books
              </button>
            </div>
            
            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              <button
                className={`px-3 py-1.5 text-xs rounded-full ${
                  quickFilters.overdue
                    ? "bg-red-100 text-red-800 border border-red-300"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                } btn-3d`}
                onClick={() => toggleQuickFilter("overdue")}
              >
                🔴 Overdue
              </button>
              <button
                className={`px-3 py-1.5 text-xs rounded-full ${
                  quickFilters.dueSoon
                    ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                } btn-3d`}
                onClick={() => toggleQuickFilter("dueSoon")}
              >
                🟡 Due Soon
              </button>
              <button
                className={`px-3 py-1.5 text-xs rounded-full ${
                  quickFilters.unpaidFines
                    ? "bg-purple-100 text-purple-800 border border-purple-300"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                } btn-3d`}
                onClick={() => toggleQuickFilter("unpaidFines")}
              >
                💰 Unpaid Fines
              </button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="mt-4 relative">
            <input
              type="text"
              placeholder="Search by title, author, or genre..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 btn-3d"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </motion.div>

        {/* Toggle Timeline View */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setTimelineView(!timelineView)}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm font-medium flex items-center gap-2 transition-all duration-300"
          >
            <Clock className="w-4 h-4" />
            {timelineView ? "Hide Timeline" : "Show Timeline"}
          </button>
        </div>

        {/* Timeline View */}
        {timelineView && (
          <motion.div 
            className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100 card-3d"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-[#3D3E3E] flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5 text-[#3D3E3E]" />
                Activity Timeline
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => setTimelineData(prev => [...prev].sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate)))}
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors btn-3d"
                >
                  Newest First
                </button>
                <button 
                  onClick={() => setTimelineData(prev => [...prev].sort((a, b) => new Date(a.borrowDate) - new Date(b.borrowDate)))}
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors btn-3d"
                >
                  Oldest First
                </button>
              </div>
            </div>
            <div className="relative">
              {/* Main timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 z-0"></div>
              <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {timelineData.length > 0 ? (
                  timelineData.map((book, index) => (
                    <motion.div 
                      key={book._id || index} 
                      className={`flex items-start p-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-md cursor-pointer mb-3 relative overflow-hidden ${
                        book.returnDate 
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500' 
                          : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500'
                      }`}
                      whileHover={{ 
                        y: -5,
                        scale: 1.01,
                        rotateX: 3,
                        rotateY: 3,
                        transition: { duration: 0.3 }
                      }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      {/* Timeline connector line */}
                      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300 z-0"></div>
                      
                      {/* Timeline node */}
                      <div className="flex flex-col items-center mr-4 mt-1 z-10 relative">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                          book.returnDate 
                            ? 'bg-green-500 shadow-sm' 
                            : 'bg-blue-500 shadow-sm'
                        } ${index === 0 ? 'animate-pulse' : ''}`}>
                          {book.returnDate ? (
                            <CheckCircle className="w-4 h-4 text-white" />
                          ) : (
                            <BookOpen className="w-4 h-4 text-white" />
                          )}
                        </div>
                        {index !== timelineData.length - 1 && (
                          <div className={`w-0.5 h-full ${
                            book.returnDate ? 'bg-green-300' : 'bg-blue-300'
                          }`}></div>
                        )}
                      </div>
                      
                      <div className="flex-1 z-10">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className={`font-bold ${
                              book.returnDate ? 'text-green-700' : 'text-blue-700'
                            }`}>
                              {book.book?.title || book.bookTitle || 'Unknown Book'}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              by {book.book?.author || book.bookAuthor || 'Unknown Author'}
                            </p>
                          </div>
                          {book.fine > 0 && book.paymentStatus !== "completed" && (
                            <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded-full animate-pulse btn-3d">
                              ₹{book.fine?.toFixed(2)}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            book.returnDate 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {book.returnDate ? "Returned" : "Borrowed"}
                          </span>
                          <span className="mx-2 text-gray-300">•</span>
                          <span className="text-xs text-gray-500">
                            {book.returnDate 
                              ? formatDateShort(book.returnDate)
                              : formatDateShort(book.borrowDate)}
                          </span>
                        </div>
                        
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                            {book.book?.genre || book.bookGenre || 'Unknown Genre'}
                          </span>
                          {book.returnDate && book.fine > 0 && (
                            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                              Fine: ₹{book.fine?.toFixed(2)}
                            </span>
                          )}
                        </div>
                        
                        {/* Duration information for returned books */}
                        {book.returnDate && (
                          <div className="flex items-center mt-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3 mr-1" />
                            <span>
                              {Math.ceil((new Date(book.returnDate) - new Date(book.borrowDate)) / (1000 * 60 * 60 * 24))} days borrowed
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No activity found</p>
                    <button 
                      onClick={() => dispatch(fetchUserBorrowedBooks(authUser.email))}
                      className="mt-4 text-sm bg-black text-white hover:bg-gray-800 px-4 py-2 rounded-lg transition-colors btn-3d"
                    >
                      Refresh Activity
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Book Grid/List View */}
        {filteredBooks?.length > 0 ? (
          <>
            {viewMode === "grid" ? (
              // Grid View
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filteredBooks.map((book, index) => (
                  <motion.div
                    key={book._id || index}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 transform hover:-translate-y-1 card-3d"
                    whileHover={{ 
                      y: -8,
                      scale: 1.02,
                      rotateX: 5,
                      rotateY: 5,
                      transition: { duration: 0.3 }
                    }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div className="p-4 card-content">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-[#3D3E3E] line-clamp-2">
                            {book.book?.title || 'Untitled Book'}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            by {book.book?.author || 'Unknown Author'}
                          </p>
                        </div>
                        <BookOpen className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {getStatusBadge(book)}
                        {book.fine > 0 && book.paymentStatus !== "completed" && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                            <IndianRupee className="mr-1 h-3 w-3" />
                            Fine: ₹{book.fine.toFixed(2)}
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-xs text-gray-600">
                        <div className="flex justify-between">
                          <span>Borrowed:</span>
                          <span>{formatDateShort(book.borrowDate)}</span>
                        </div>
                        {!book.returnDate && (
                          <div className="flex justify-between">
                            <span>Due Date:</span>
                            <span>{formatDateShort(book.dueDate)}</span>
                          </div>
                        )}
                        {book.returnDate && (
                          <div className="flex justify-between">
                            <span>Returned:</span>
                            <span>{formatDateShort(book.returnDate)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Price:</span>
                          <span>₹{book.price?.toFixed(2) || '0.00'}</span>
                        </div>
                        {/* Show fine information if it exists */}
                        {(book.fine > 0 || book.fineAmount > 0) && (
                          <div className="flex justify-between">
                            <span>Fine:</span>
                            <span className={book.paymentStatus === "completed" ? "text-green-600" : "text-red-600"}>
                              ₹{(book.fine || book.fineAmount)?.toFixed(2) || '0.00'} {book.paymentStatus === "completed" ? "(Paid)" : "(Unpaid)"}
                            </span>
                          </div>
                        )}
                        {/* Show fine information even if it's zero but exists in data */}
                        {book.fine !== undefined && book.fine === 0 && (
                          <div className="flex justify-between">
                            <span>Fine:</span>
                            <span className="text-green-600">₹0.00 (No Fine)</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 flex justify-between items-center">
                        <button
                          onClick={() => openReadBookPopup(book.book?._id || book.bookId)}
                          className="text-xs bg-black text-white hover:bg-gray-800 px-3 py-1.5 rounded-md transition-colors flex items-center btn-3d"
                        >
                          <BookA className="w-3 h-3 mr-1" />
                          View Details
                        </button>
                        
                        {/* Pay Fine button - more flexible conditions */}
                        {(!book.returnDate) && (book.fine > 0) && (book.paymentStatus !== "completed") && (
                          <button
                            onClick={() => setSelectedBorrowRecord(book)}
                            className="text-xs bg-black text-white hover:bg-gray-800 px-3 py-1.5 rounded-md transition-colors flex items-center btn-3d"
                          >
                            <CreditCard className="w-3 h-3 mr-1" />
                            Pay Fine
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              // List View (Table)
              <motion.div 
                className="bg-white rounded-lg shadow-md overflow-hidden overflow-x-auto table-3d"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book Title</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Borrow Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fine</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBooks.map((book, index) => (
                      <motion.tr 
                        key={book._id || index} 
                        className="hover:bg-gray-50 table-row-3d"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{book.book?.title || book.bookTitle}</div>
                          <div className="text-sm text-gray-500">{book.book?.author || 'Unknown Author'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateShort(book.borrowDate)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateShort(book.dueDate)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{book.returnDate ? formatDateShort(book.returnDate) : '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{book.price?.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {book.fine > 0 || book.fineAmount > 0 ? (
                            <span className={book.paymentStatus === "completed" ? "text-green-600" : "text-red-600"}>
                              ₹{(book.fine || book.fineAmount)?.toFixed(2)} {book.paymentStatus === "completed" ? "(Paid)" : "(Unpaid)"}
                            </span>
                          ) : book.fine !== undefined ? (
                            <span className="text-green-600">₹0.00 (No Fine)</span>
                          ) : (
                            "₹0.00"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {getStatusBadge(book)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openReadBookPopup(book.book?._id || book.bookId)}
                            className="text-blue-600 hover:text-blue-900 mr-3 flex items-center btn-3d"
                          >
                            <BookA className="w-4 h-4 mr-1" />
                            View
                          </button>
                          {(!book.returnDate) && (book.fine > 0) && (book.paymentStatus !== "completed") && (
                            <button
                              onClick={() => setSelectedBorrowRecord(book)}
                              className="text-red-600 hover:text-red-900 flex items-center btn-3d"
                            >
                              <CreditCard className="w-4 h-4 mr-1" />
                              Pay
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              {filter === "returned" 
                ? "No returned books found" 
                : filter === "nonReturned" 
                  ? "No non-returned books found" 
                  : "No books found"}
            </h3>
            <p className="mt-1 text-gray-500">
              {searchTerm || quickFilters.overdue || quickFilters.dueSoon || quickFilters.unpaidFines
                ? "Try adjusting your filters or search term"
                : filter === "all" 
                  ? "You haven't borrowed any books yet"
                  : filter === "returned" 
                    ? "You haven't returned any books yet"
                    : "You don't have any non-returned books"}
            </p>
          </div>
        )}

        {/* Recommendations Section */}
        {recommendedBooks.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#3D3E3E] flex items-center gap-2">
                <Book className="w-5 h-5 text-[#3D3E3E]" />
                Recommended for You
              </h3>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                Based on your reading history
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Discover books tailored to your interests and favorite genres
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {recommendedBooks.map((book) => (
                <motion.div
                  key={book._id}
                  className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer group"
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openReadBookPopup(book._id)}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-sm group-hover:text-blue-600 transition-colors line-clamp-2">
                      {book.title}
                    </h4>
                    {book.rating && (
                      <div className="flex items-center bg-amber-100 text-amber-800 text-xs px-1.5 py-0.5 rounded">
                        <span>{book.rating}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-1">by {book.author}</p>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {book.genre}
                    </span>
                    <div className="flex items-center text-xs text-gray-500">
                      <BookOpen className="w-3 h-3 mr-1" />
                      <span>{book.quantity} available</span>
                    </div>
                  </div>
                  {book.description && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                      {book.description}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>
      
      {/* Popups */}
      {readBookPopup && <ReadBookPopup book={readBook} />}
      {selectedBorrowRecord && (
        <PaymentPopup 
          borrowRecord={selectedBorrowRecord} 
          onClose={() => setSelectedBorrowRecord(null)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
};

export default MyBorrowedBooks;