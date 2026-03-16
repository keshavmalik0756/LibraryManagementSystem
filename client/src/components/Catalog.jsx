import React, { useEffect, useState, useMemo } from "react";
import { PiKeyReturnBold } from "react-icons/pi";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { BookOpen, Calendar, CheckCircle, Search, Eye, Download, Filter } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toggleReturnBookPopup } from "../store/slices/popupSlice";
import { toast } from "react-toastify";
import { fetchAllBooks, resetBookSlice } from "../store/slices/bookSlice";
import {
  fetchAllBorrowedBooks,
  resetBorrowSlice,
  returnBorrowBook
} from "../store/slices/borrowSlice";
import ReturnBookPopup from "../popups/ReturnBookPopup";
import Header from "../layout/Header";
import PaymentPopup from "../popups/PaymentPopup";

const Catalog = () => {
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth || {});
  const { returnBookPopup } = useSelector((state) => state.popup || {});
  const { loading, message, error, allBorrowedBooks } = useSelector(
    (state) => state.borrow || {}
  );

  const [filter, setFilter] = useState("borrowed");
  const [email, setEmail] = useState("");
  const [borrowedBookId, setBorrowedBookId] = useState("");
  const [selectedBorrowRecord, setSelectedBorrowRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [stats, setStats] = useState({
    borrowed: 0,
    overdue: 0,
    returned: 0
  });
  const [selectedBook, setSelectedBook] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [fineFilter, setFineFilter] = useState("all"); // all, unpaid, paid
  // New state for confirmation popup
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingReturn, setPendingReturn] = useState({ book: null, email: "" });

  // Calculate statistics
  useEffect(() => {
    if (Array.isArray(allBorrowedBooks)) {
      const currentDate = new Date();
      const borrowed = allBorrowedBooks.filter(book => {
        const dueDate = new Date(book.dueDate);
        return !book.returnDate && dueDate > currentDate;
      }).length;
      
      const overdue = allBorrowedBooks.filter(book => {
        const dueDate = new Date(book.dueDate);
        return !book.returnDate && dueDate <= currentDate;
      }).length;
      
      const returned = allBorrowedBooks.filter(book => book.returnDate).length;
      
      setStats({ borrowed, overdue, returned });
    }
  }, [allBorrowedBooks]);

  const formatDateAndTime = (timestamp) => {
    if (!timestamp) return "-";
    const date = new Date(timestamp);
    return `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}/${date.getFullYear()} ${String(
      date.getHours()
    ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    const date = new Date(timestamp);
    return `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}/${date.getFullYear()}`;
  };

  const currentDate = new Date();

  // Filter books based on status
  const borrowedBooks = useMemo(() => {
    return Array.isArray(allBorrowedBooks)
      ? allBorrowedBooks.filter((book) => {
          const dueDate = new Date(book.dueDate);
          return !book.returnDate && dueDate > currentDate;
        })
      : [];
  }, [allBorrowedBooks]);

  const overdueBooks = useMemo(() => {
    return Array.isArray(allBorrowedBooks)
      ? allBorrowedBooks.filter((book) => {
          const dueDate = new Date(book.dueDate);
          return !book.returnDate && dueDate <= currentDate;
        })
      : [];
  }, [allBorrowedBooks]);

  const returnedBooks = useMemo(() => {
    return Array.isArray(allBorrowedBooks)
      ? allBorrowedBooks.filter((book) => book.returnDate)
      : [];
  }, [allBorrowedBooks]);

  // Filter books based on search term and fine status
  const filteredBorrowedBooks = useMemo(() => {
    let result = borrowedBooks;
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(book => 
        (book?.user?.username?.toLowerCase().includes(term) ||
         book?.user?.name?.toLowerCase().includes(term) ||
         book?.user?.email?.toLowerCase().includes(term) ||
         book?.book?.title?.toLowerCase().includes(term) ||
         book?.book?.author?.toLowerCase().includes(term))
      );
    }
    
    // Apply fine filter
    if (fineFilter !== "all") {
      result = result.filter(book => {
        if (fineFilter === "unpaid") {
          return book.fine > 0 && book.paymentStatus !== "completed";
        } else if (fineFilter === "paid") {
          return book.fine > 0 && book.paymentStatus === "completed";
        }
        return true;
      });
    }
    
    return result;
  }, [borrowedBooks, searchTerm, fineFilter]);

  const filteredOverdueBooks = useMemo(() => {
    let result = overdueBooks;
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(book => 
        (book?.user?.username?.toLowerCase().includes(term) ||
         book?.user?.name?.toLowerCase().includes(term) ||
         book?.user?.email?.toLowerCase().includes(term) ||
         book?.book?.title?.toLowerCase().includes(term) ||
         book?.book?.author?.toLowerCase().includes(term))
      );
    }
    
    // Apply fine filter
    if (fineFilter !== "all") {
      result = result.filter(book => {
        if (fineFilter === "unpaid") {
          return book.fine > 0 && book.paymentStatus !== "completed";
        } else if (fineFilter === "paid") {
          return book.fine > 0 && book.paymentStatus === "completed";
        }
        return true;
      });
    }
    
    return result;
  }, [overdueBooks, searchTerm, fineFilter]);

  const filteredReturnedBooks = useMemo(() => {
    let result = returnedBooks;
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(book => 
        (book?.user?.username?.toLowerCase().includes(term) ||
         book?.user?.name?.toLowerCase().includes(term) ||
         book?.user?.email?.toLowerCase().includes(term) ||
         book?.book?.title?.toLowerCase().includes(term) ||
         book?.book?.author?.toLowerCase().includes(term))
      );
    }
    
    // Apply fine filter
    if (fineFilter !== "all") {
      result = result.filter(book => {
        if (fineFilter === "unpaid") {
          return book.fine > 0 && book.paymentStatus !== "completed";
        } else if (fineFilter === "paid") {
          return book.fine > 0 && book.paymentStatus === "completed";
        }
        return true;
      });
    }
    
    return result;
  }, [returnedBooks, searchTerm, fineFilter]);

  const booksToDisplay = useMemo(() => {
    let books = [];
    switch (filter) {
      case "borrowed": books = filteredBorrowedBooks; break;
      case "overdue": books = filteredOverdueBooks; break;
      case "returned": books = filteredReturnedBooks; break;
      default: books = filteredBorrowedBooks;
    }
    
    // Apply sorting
    if (sortConfig.key) {
      books.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortConfig.key) {
          case 'user':
            aValue = (a?.user?.username || a?.user?.name || a.username || a.name || "").toLowerCase();
            bValue = (b?.user?.username || b?.user?.name || b.username || b.name || "").toLowerCase();
            break;
          case 'email':
            aValue = (a?.user?.email || a.email || "").toLowerCase();
            bValue = (b?.user?.email || b.email || "").toLowerCase();
            break;
          case 'book':
            aValue = (a?.book?.title || "").toLowerCase();
            bValue = (b?.book?.title || "").toLowerCase();
            break;
          case 'price':
            aValue = a?.book?.price || a.price || 0;
            bValue = b?.book?.price || b.price || 0;
            break;
          case 'dueDate':
            aValue = new Date(a.dueDate);
            bValue = new Date(b.dueDate);
            break;
          case 'borrowDate':
            aValue = new Date(a.borrowDate);
            bValue = new Date(b.borrowDate);
            break;
          case 'fine':
            aValue = a.fine || 0;
            bValue = b.fine || 0;
            break;
          default:
            return 0;
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return books;
  }, [filter, filteredBorrowedBooks, filteredOverdueBooks, filteredReturnedBooks, sortConfig]);

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get sort indicator
  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />;
    }
    return <FaSort className="ml-1 opacity-30" />;
  };

  // Show confirmation popup before returning book
  const showReturnConfirmation = (bookObj, emailParam) => {
    setPendingReturn({ book: bookObj, email: emailParam });
    setShowConfirmation(true);
  };

  // Confirm return action
  const confirmReturn = () => {
    const { book, email: emailParam } = pendingReturn;
    setShowConfirmation(false);
    setPendingReturn({ book: null, email: "" });
    
    let id = null;
    if (typeof book === "string") {
      id = book; // If book is already an ID string
    } else if (book && typeof book === "object") {
      id = book._id || book.bookId || null;
    }

    if (!id) {
      toast.error("Book ID not found, cannot open return popup.");
      return;
    }
    
    // Check if there's a fine for this book
    const borrowRecord = allBorrowedBooks.find(
      b => (b._id === id || b.bookId === id) && 
           (b.user?.email === emailParam || b.email === emailParam)
    );
    
    if (borrowRecord && borrowRecord.fine > 0 && borrowRecord.paymentStatus !== "completed") {
      // Show payment popup first
      setSelectedBorrowRecord(borrowRecord);
    } else {
      // No fine or already paid, proceed with return
      setBorrowedBookId(id);
      setEmail(emailParam);
      dispatch(toggleReturnBookPopup());
    }
  };

  // Cancel return action
  const cancelReturn = () => {
    setShowConfirmation(false);
    setPendingReturn({ book: null, email: "" });
  };

  // Handle payment success
  const handlePaymentSuccess = (payment) => {
    // After successful payment, refresh the borrowed books list
    dispatch(fetchAllBorrowedBooks());
    setSelectedBorrowRecord(null);
    toast.success("Payment successful! You can now return the book.");
    
    // Automatically open the return popup after payment
    if (selectedBorrowRecord) {
      setBorrowedBookId(selectedBorrowRecord._id || selectedBorrowRecord.bookId);
      setEmail(selectedBorrowRecord.user?.email || selectedBorrowRecord.email);
      dispatch(toggleReturnBookPopup());
    }
  };

  // Try to return book directly (will trigger payment if needed)
  const tryReturnBook = (bookObj, emailParam) => {
    let id = null;
    if (typeof bookObj === "string") {
      id = bookObj;
    } else if (bookObj && typeof bookObj === "object") {
      id = bookObj._id || bookObj.bookId || null;
    }

    if (!id) {
      toast.error("Book ID not found.");
      return;
    }

    // Try to return the book directly
    dispatch(returnBorrowBook({ email: emailParam, bookId: id }))
      .then((result) => {
        if (result.meta.requestStatus === "fulfilled") {
          // Success - book returned
          toast.success("Book returned successfully!");
        }
      })
      .catch((err) => {
        console.error("Return error:", err);
      });
  };

  // Export data to CSV
  const exportToCSV = () => {
    const data = booksToDisplay.map((book, index) => ({
      "ID": index + 1,
      "User": book?.user?.username || book?.user?.name || book.username || book.name || "N/A",
      "Email": book?.user?.email || book.email || "N/A",
      "Book": book?.book?.title || "N/A",
      "Author": book?.book?.author || "N/A",
      "Price": `₹${(book?.book?.price || book.price || 0).toFixed(2)}`,
      "Due Date": formatDate(book.dueDate),
      "Borrowed Date": formatDateAndTime(book.borrowDate),
      "Fine": `₹${(book.fine || 0).toFixed(2)}`,
      "Fine Status": book.fine > 0 ? (book.paymentStatus === "completed" ? "Paid" : "Unpaid") : "No Fine",
      "Return Status": book.returnDate ? "Returned" : "Not Returned"
    }));

    if (data.length === 0) {
      toast.info("No data to export");
      return;
    }

    const csvContent = [
      Object.keys(data[0]).join(","),
      ...data.map(row => Object.values(row).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `catalog-${filter}-books-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${data.length} records to CSV`);
  };

  useEffect(() => {
    if (message) {
      toast.success(message);
      dispatch(fetchAllBooks());
      dispatch(fetchAllBorrowedBooks());
      dispatch(resetBookSlice());
      dispatch(resetBorrowSlice());
    }
    if (error) {
      // Check if error indicates payment is required
      if (error.message && error.message.includes("Please pay the fine")) {
        // Find the borrow record that needs payment
        const parts = error.message.split(":");
        if (parts.length > 1) {
          const bookId = parts[1].trim();
          const borrowRecord = allBorrowedBooks.find(b => 
            (b._id === bookId || b.bookId === bookId)
          );
          
          if (borrowRecord) {
            setSelectedBorrowRecord(borrowRecord);
          }
        }
      } else {
        toast.error(error);
      }
      dispatch(resetBookSlice());
      dispatch(resetBorrowSlice());
    }
  }, [dispatch, message, error, allBorrowedBooks]);

  // Stats card data
  const statsData = [
    { 
      id: 1, 
      title: "Borrowed Books", 
      value: stats.borrowed, 
      icon: BookOpen, 
      borderClass: "border-black",
      bgClass: "bg-gray-100",
      textClass: "text-black"
    },
    { 
      id: 2, 
      title: "Overdue Books", 
      value: stats.overdue, 
      icon: Calendar, 
      borderClass: "border-black",
      bgClass: "bg-gray-200",
      textClass: "text-black"
    },
    { 
      id: 3, 
      title: "Returned Books", 
      value: stats.returned, 
      icon: CheckCircle, 
      borderClass: "border-black",
      bgClass: "bg-gray-300",
      textClass: "text-black"
    }
  ];

  // View book details
  const viewBookDetails = (book) => {
    setSelectedBook(book);
  };

  // Close book details
  const closeBookDetails = () => {
    setSelectedBook(null);
  };

  return (
    <>
      <main className="relative flex-1 p-4 sm:p-6 pt-20 sm:pt-24 bg-gray-50">
        <Header />

        {/* Enhanced Catalog Header */}
        <div className="mb-6 bg-gradient-to-r from-gray-800 to-black p-6 rounded-xl shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Library Catalog</h1>
              <p className="text-gray-300 mt-1">Manage all borrowed, overdue, and returned books</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {statsData.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div 
                key={stat.id}
                className={`bg-white rounded-lg shadow p-4 border-l-4 ${stat.borderClass} hover:shadow-md transition-all duration-300 cursor-pointer transform hover:-translate-y-1 hover:scale-105 group relative overflow-hidden`}
                style={{ 
                  transitionDelay: `${index * 50}ms`,
                  transitionProperty: 'transform, box-shadow',
                  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <div className="flex items-center">
                  <div className={`p-3 ${stat.bgClass} rounded-full`}>
                    <IconComponent className={`w-6 h-6 ${stat.textClass}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-800 animate-pulse">
                      {stat.value}
                    </p>
                  </div>
                </div>
                
                {/* Expanded information on hover */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent text-white p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-full group-hover:translate-y-0 overflow-hidden">
                  <p className="text-xs whitespace-nowrap overflow-hidden text-ellipsis">
                    {stat.id === 1 && "Books currently borrowed by users"}
                    {stat.id === 2 && "Books that are past their due date"}
                    {stat.id === 3 && "Books that have been returned"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search books..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black w-full transition-all duration-300 hover:shadow-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search books by user or book details"
            />
            <Search
              className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
            
            <button
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              onClick={exportToCSV}
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fine Status</label>
                <select
                  value={fineFilter}
                  onChange={(e) => setFineFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="all">All Books</option>
                  <option value="unpaid">Unpaid Fines</option>
                  <option value="paid">Paid Fines</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={sortConfig.key || ""}
                  onChange={(e) => handleSort(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="">None</option>
                  <option value="user">User</option>
                  <option value="email">Email</option>
                  <option value="book">Book</option>
                  <option value="price">Price</option>
                  <option value="dueDate">Due Date</option>
                  <option value="borrowDate">Borrowed Date</option>
                  <option value="fine">Fine</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  onClick={() => {
                    setSearchTerm("");
                    setFineFilter("all");
                    setSortConfig({ key: null, direction: 'asc' });
                  }}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Buttons */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
          <button
            className={`relative rounded sm:rounded-tr-none sm:rounded-br-none sm:rounded-tl-lg sm:rounded-bl-lg text-center border-2 font-semibold py-2 w-full sm:w-48 ${
              filter === "borrowed"
                ? "bg-black text-white border-black"
                : "bg-white text-black border-gray-300 hover:bg-gray-100"
            }`}
            onClick={() => setFilter("borrowed")}
          >
            Borrowed Books
          </button>
          <button
            className={`relative rounded sm:rounded-tl-none sm:rounded-bl-none sm:rounded-tr-lg sm:rounded-br-lg text-center border-2 font-semibold py-2 w-full sm:w-48 ${
              filter === "overdue"
                ? "bg-black text-white border-black"
                : "bg-white text-black border-gray-300 hover:bg-gray-100"
            }`}
            onClick={() => setFilter("overdue")}
          >
            Overdue Books
          </button>
          <button
            className={`relative rounded sm:rounded-tl-none sm:rounded-bl-none sm:rounded-tr-lg sm:rounded-br-lg text-center border-2 font-semibold py-2 w-full sm:w-48 ${
              filter === "returned"
                ? "bg-black text-white border-black"
                : "bg-white text-black border-gray-300 hover:bg-gray-100"
            }`}
            onClick={() => setFilter("returned")}
          >
            Returned Books
          </button>
        </header>

        {/* Books Table */}
        {booksToDisplay.length > 0 ? (
          <div className="overflow-auto bg-white rounded-md shadow-lg border border-gray-200">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-r border-gray-200 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('id')}>
                    <div className="flex items-center">
                      ID
                      {getSortIndicator('id')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-r border-gray-200 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('user')}>
                    <div className="flex items-center">
                      User
                      {getSortIndicator('user')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-r border-gray-200 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('email')}>
                    <div className="flex items-center">
                      Email
                      {getSortIndicator('email')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-r border-gray-200 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('book')}>
                    <div className="flex items-center">
                      Book
                      {getSortIndicator('book')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-r border-gray-200 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('price')}>
                    <div className="flex items-center">
                      Price
                      {getSortIndicator('price')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-r border-gray-200 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('dueDate')}>
                    <div className="flex items-center">
                      Due Date
                      {getSortIndicator('dueDate')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-r border-gray-200 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('borrowDate')}>
                    <div className="flex items-center">
                      Borrowed
                      {getSortIndicator('borrowDate')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-r border-gray-200 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('fine')}>
                    <div className="flex items-center">
                      Fine
                      {getSortIndicator('fine')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {booksToDisplay.map((book, index) => (
                  <tr
                    key={
                      book._id ||
                      book.bookId ||
                      (book.book && (book.book._id || book.book.bookId)) ||
                      index
                    }
                    className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100 transition-colors duration-200 border-b border-gray-100`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-100">{index + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-100">
                      {book?.user?.username ||
                        book?.user?.name ||
                        book.username ||
                        book.name ||
                        "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-100">
                      {book?.user?.email || book.email || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-100">
                      <div className="flex items-center gap-2">
                        <span>{book?.book?.title || "N/A"}</span>
                        <Eye 
                          className="w-4 h-4 text-gray-500 cursor-pointer hover:text-gray-700" 
                          onClick={() => viewBookDetails(book)}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-100">
                      ₹
                      {book?.book?.price
                        ? book.book.price.toFixed(2)
                        : book.price
                        ? book.price.toFixed(2)
                        : "0.00"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-100">{formatDate(book.dueDate)}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-100">
                      {formatDateAndTime(book.borrowDate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-100">
                      {book.fine > 0 && book.paymentStatus !== "completed" ? (
                        <span className="text-red-600 font-semibold">
                          ₹{book.fine.toFixed(2)} (Unpaid)
                        </span>
                      ) : book.fine > 0 && book.paymentStatus === "completed" ? (
                        <span className="text-green-600">
                          ₹{book.fine.toFixed(2)} (Paid)
                        </span>
                      ) : (
                        <span>₹0.00</span>
                      )}
                      {book.fine > 0 && book.fineDetails?.daysOverdue > 0 && (
                        <div className="text-xs text-gray-500">
                          {book.fineDetails.daysOverdue} days overdue
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {book.returnDate ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                          <PiKeyReturnBold
                            className="w-6 h-6 cursor-pointer text-gray-700 hover:text-black"
                            onClick={() =>
                              showReturnConfirmation(
                                book.book || book,
                                book?.user?.email || book.email
                              )
                            }
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-200">
            <div className="inline-block animate-bounce">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            </div>
            <h3 className="text-xl font-medium text-gray-700">
              No {filter === "borrowed" ? "borrowed" : filter === "overdue" ? "overdue" : "returned"} books found
            </h3>
            <p className="text-gray-500 mt-2">
              {searchTerm 
                ? "Try adjusting your search terms" 
                : `There are currently no ${filter} books in the library`}
            </p>
          </div>
        )}

        {/* Payment Popup */}
        {selectedBorrowRecord && (
          <PaymentPopup 
            borrowRecord={selectedBorrowRecord} 
            onClose={() => setSelectedBorrowRecord(null)} 
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}
        
        {/* Confirmation Popup */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl transform transition-all">
              <div className="p-6">
                <h3 className="text-2xl font-extrabold text-gray-900 mb-4">
                  Confirm Return
                </h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to return this book? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={cancelReturn}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmReturn}
                    className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Book Details Modal */}
      {selectedBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Book Details</h2>
                <button 
                  onClick={closeBookDetails}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Book Information</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Title:</span> {selectedBook?.book?.title || "N/A"}</p>
                    <p><span className="font-medium">Author:</span> {selectedBook?.book?.author || "N/A"}</p>
                    <p><span className="font-medium">Price:</span> ₹{selectedBook?.book?.price?.toFixed(2) || "0.00"}</p>
                    <p><span className="font-medium">ISBN:</span> {selectedBook?.book?.ISBN || "N/A"}</p>
                    <p><span className="font-medium">Genre:</span> {selectedBook?.book?.genre || "N/A"}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Borrowing Information</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Borrowed By:</span> {selectedBook?.user?.username || selectedBook?.user?.name || selectedBook?.username || selectedBook?.name || "N/A"}</p>
                    <p><span className="font-medium">Email:</span> {selectedBook?.user?.email || selectedBook?.email || "N/A"}</p>
                    <p><span className="font-medium">Borrowed Date:</span> {formatDateAndTime(selectedBook?.borrowDate)}</p>
                    <p><span className="font-medium">Due Date:</span> {formatDate(selectedBook?.dueDate)}</p>
                    <p><span className="font-medium">Return Date:</span> {selectedBook?.returnDate ? formatDateAndTime(selectedBook.returnDate) : "Not returned"}</p>
                    <p><span className="font-medium">Fine:</span> 
                      {selectedBook?.fine > 0 ? (
                        <span className={selectedBook?.paymentStatus === "completed" ? "text-green-600" : "text-red-600"}>
                          ₹{selectedBook?.fine?.toFixed(2)} ({selectedBook?.paymentStatus === "completed" ? "Paid" : "Unpaid"})
                        </span>
                      ) : "No fine"}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Description</h3>
                <p className="text-gray-600">{selectedBook?.book?.description || "No description available for this book."}</p>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeBookDetails}
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {returnBookPopup && (
        <ReturnBookPopup bookId={borrowedBookId} email={email} />
      )}
    </>
  );
};

export default Catalog;