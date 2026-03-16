import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { fetchAllBorrowedBooks } from "../store/slices/borrowSlice";
import PaymentPopup from "../popups/PaymentPopup";
import { X, Book, Calendar, User, Mail, Shield, Clock, BookOpen, CheckCircle, AlertCircle, CreditCard, Search, ArrowUpDown, TrendingUp } from "lucide-react";
import { toast } from "react-toastify";

const UserDetailsCard = ({ user, onClose }) => {
    const dispatch = useDispatch();
    const { allBorrowedBooks, fetchLoading } = useSelector((state) => state.borrow);
    const [activeTab, setActiveTab] = useState("profile");
    const [localBorrowedBooks, setLocalBorrowedBooks] = useState([]);
    const [selectedBorrowRecord, setSelectedBorrowRecord] = useState(null);
    const [selectedBorrowRecords, setSelectedBorrowRecords] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user?.email) {
            // Fetch all borrowed books and filter for this user
            setIsLoading(true);
            dispatch(fetchAllBorrowedBooks())
                .then(() => {
                    setIsLoading(false);
                })
                .catch(() => {
                    setIsLoading(false);
                    toast.error("Failed to fetch borrowing data");
                });
        }
    }, [user, dispatch]);

    useEffect(() => {
        if (allBorrowedBooks && user?.email) {
            // Filter borrowed books for this specific user
            let userBooks = allBorrowedBooks.filter(book =>
                (book.user?.email === user.email) || (book.email === user.email)
            );
            
            // Remove any potential duplicates by creating a map based on _id
            const uniqueBooksMap = new Map();
            userBooks.forEach(book => {
                if (book._id) {
                    uniqueBooksMap.set(book._id, book);
                } else {
                    // For books without _id, use a composite key
                    const compositeKey = `${book.book?._id || book.bookId}-${book.borrowDate || book.createdAt}`;
                    uniqueBooksMap.set(compositeKey, book);
                }
            });
            
            // Convert map back to array
            userBooks = Array.from(uniqueBooksMap.values());
            
            setLocalBorrowedBooks(userBooks);
        } else if (user?.BorrowBooks) {
            // Fallback to user.BorrowBooks if available
            setLocalBorrowedBooks(user.BorrowBooks);
        }
    }, [allBorrowedBooks, user]);

    // Cleanup function to reset state when component unmounts
    useEffect(() => {
        return () => {
            setLocalBorrowedBooks([]);
        };
    }, []);

    const formatDate = (timestamp) => {
        if (!timestamp) return "N/A";
        const date = new Date(timestamp);
        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const formatDateTime = (timestamp) => {
        if (!timestamp) return "N/A";
        const date = new Date(timestamp);
        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Shared transition configurations
    const springTransition = { type: "spring", damping: 25, stiffness: 300 };
    const defaultTransition = { duration: 0.3, ease: "easeInOut" };

    if (!user) return null;

    // Calculate statistics from user's borrowed books
    const borrowedBooks = localBorrowedBooks || [];
    const totalBorrowed = borrowedBooks.length;
    const returnedBooks = borrowedBooks.filter(b => b.returnDate).length;
    const activeLoans = borrowedBooks.filter(b => !b.returnDate).length;
    const overdueBooks = borrowedBooks.filter(b => {
        if (b.returnDate) return false;
        const dueDate = new Date(b.dueDate || b.borrowDate);
        if (b.dueDate) {
            dueDate.setDate(dueDate.getDate() + 60); // Assuming 60-day borrowing period
        }
        return new Date() > dueDate;
    }).length;
    
    // Calculate unpaid fines (only for books that haven't been returned)
    const unpaidFines = borrowedBooks.filter(b => b.fine > 0 && b.paymentStatus !== "completed" && !b.returnDate).length;
    const totalFineAmount = borrowedBooks.reduce((sum, book) => sum + (book.fine || 0), 0);
    const unpaidFineAmount = borrowedBooks.reduce((sum, book) => {
        if (book.fine > 0 && book.paymentStatus !== "completed" && !book.returnDate) {
            return sum + book.fine;
        }
        return sum;
    }, 0);

    // Filter and sort borrowed books
    const filteredAndSortedBooks = useMemo(() => {
        let result = [...borrowedBooks];
        
        // Apply search filter
        if (searchTerm) {
            result = result.filter(book => 
                (book.book?.title?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (book.book?.author?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (formatDate(book.borrowDate).toLowerCase().includes(searchTerm.toLowerCase())) ||
                (book.returnDate && formatDate(book.returnDate).toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        
        // Apply sorting
        if (sortConfig.key) {
            result.sort((a, b) => {
                let aValue, bValue;
                
                switch (sortConfig.key) {
                    case 'title':
                        aValue = a.book?.title?.toLowerCase() || '';
                        bValue = b.book?.title?.toLowerCase() || '';
                        break;
                    case 'author':
                        aValue = a.book?.author?.toLowerCase() || '';
                        bValue = b.book?.author?.toLowerCase() || '';
                        break;
                    case 'borrowDate':
                        aValue = new Date(a.borrowDate || a.createdAt);
                        bValue = new Date(b.borrowDate || b.createdAt);
                        break;
                    case 'returnDate':
                        aValue = a.returnDate ? new Date(a.returnDate) : new Date(0);
                        bValue = b.returnDate ? new Date(b.returnDate) : new Date(0);
                        break;
                    case 'fine':
                        aValue = a.fine || 0;
                        bValue = b.fine || 0;
                        break;
                    case 'dueDate':
                        const aDueDate = new Date(a.dueDate || a.borrowDate);
                        const bDueDate = new Date(b.dueDate || b.borrowDate);
                        if (a.dueDate) aDueDate.setDate(aDueDate.getDate() + 60);
                        if (b.dueDate) bDueDate.setDate(bDueDate.getDate() + 60);
                        aValue = aDueDate;
                        bValue = bDueDate;
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
        
        return result;
    }, [borrowedBooks, searchTerm, sortConfig]);

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
            return sortConfig.direction === 'asc' ? '↑' : '↓';
        }
        return '';
    };

    // Add this function to handle payment success
    const handlePaymentSuccess = (payment) => {
        // Update the local borrowed books to reflect the payment
        setLocalBorrowedBooks(prev => 
            prev.map(book => 
                book._id === payment.borrowRecord._id 
                    ? { ...book, paymentStatus: "completed" } 
                    : book
            )
        );
        setSelectedBorrowRecord(null);
        setSelectedBorrowRecords([]);
        toast.success("Payment processed successfully!");
    };

    // Handle "Pay All Fines" feature
    const handlePayAllFines = () => {
        const unpaidFines = borrowedBooks.filter(book => book.fine > 0 && book.paymentStatus !== "completed" && !book.returnDate);
        if (unpaidFines.length === 0) {
            toast.info("No unpaid fines found for this user.");
            return;
        }
        setSelectedBorrowRecords(unpaidFines);
        toast.info(`Processing payment for ${unpaidFines.length} fine${unpaidFines.length > 1 ? 's' : ''}`);
    };

    // Calculate borrowing statistics
    const borrowingStats = useMemo(() => {
        const totalBooks = borrowedBooks.length;
        const returned = borrowedBooks.filter(b => b.returnDate).length;
        const active = borrowedBooks.filter(b => !b.returnDate).length;
        const overdue = borrowedBooks.filter(b => {
            if (b.returnDate) return false;
            const dueDate = new Date(b.dueDate || b.borrowDate);
            if (b.dueDate) {
                dueDate.setDate(dueDate.getDate() + 60); // Assuming 60-day borrowing period
            }
            return new Date() > dueDate;
        }).length;
        
        const returnedPercentage = totalBooks > 0 ? Math.round((returned / totalBooks) * 100) : 0;
        const overduePercentage = active > 0 ? Math.round((overdue / active) * 100) : 0;
        
        return {
            totalBooks,
            returned,
            active,
            overdue,
            returnedPercentage,
            overduePercentage
        };
    }, [borrowedBooks]);

    return (
        <>
            {selectedBorrowRecord && (
                <PaymentPopup 
                    borrowRecord={selectedBorrowRecord} 
                    onClose={() => setSelectedBorrowRecord(null)} 
                    onPaymentSuccess={handlePaymentSuccess}
                />
            )}

            {selectedBorrowRecords.length > 0 && (
                <PaymentPopup 
                    multipleRecords={selectedBorrowRecords} 
                    onClose={() => setSelectedBorrowRecords([])} 
                    onPaymentSuccess={handlePaymentSuccess}
                />
            )}

            <AnimatePresence mode="wait">
                <motion.div
                    key={`user-details-card-${user._id || 'unknown'}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black bg-opacity-50"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        transition={springTransition}
                        className="w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col h-[95vh] sm:h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <style>{`
                            .custom-scrollbar::-webkit-scrollbar {
                                width: 4px;
                            }
                            .custom-scrollbar::-webkit-scrollbar-track {
                                background: #f1f1f1;
                                border-radius: 10px;
                            }
                            .custom-scrollbar::-webkit-scrollbar-thumb {
                                background: #c5c5c5;
                                border-radius: 10px;
                            }
                            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                                background: #a1a1a1;
                            }
                            .no-scrollbar::-webkit-scrollbar {
                                display: none;
                            }
                            .no-scrollbar {
                                -ms-overflow-style: none;
                                scrollbar-width: none;
                            }
                        `}</style>
                        
                        {/* Header - Fixed */}
                        <div className="bg-gradient-to-r from-[#151619] to-[#3D3E3E] p-4 sm:p-6 text-white flex-shrink-0">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
                                        <User className="w-5 h-5 sm:w-6 sm:h-6" />
                                        {user.name}
                                    </h2>
                                    <p className="text-blue-100 flex items-center gap-1 mt-1 text-xs sm:text-sm">
                                        <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                                        {user.email}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-white hover:text-gray-200 transition-colors"
                                    aria-label="Close user details"
                                >
                                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3 sm:mt-4">
                                <div className="bg-white bg-opacity-20 rounded-lg px-2 py-1 sm:px-3 sm:py-1 flex items-center gap-1">
                                    <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span className="text-xs sm:text-sm font-medium">{user.role}</span>
                                </div>
                                <div className="bg-white bg-opacity-20 rounded-lg px-2 py-1 sm:px-3 sm:py-1 flex items-center gap-1">
                                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span className="text-xs sm:text-sm">Joined: {formatDate(user.createdAt)}</span>
                                </div>
                                {unpaidFineAmount > 0 && (
                                    <div className="bg-red-500 bg-opacity-80 rounded-lg px-2 py-1 sm:px-3 sm:py-1 flex items-center gap-1 animate-pulse">
                                        <CreditCard className="w-3 h-3 sm:w-4 sm:h-4" />
                                        <span className="text-xs sm:text-sm font-medium">₹{unpaidFineAmount.toFixed(2)} in unpaid fines</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tabs - Fixed */}
                        <div className="border-b border-gray-200 flex-shrink-0">
                            <nav className="flex">
                                <button
                                    onClick={() => setActiveTab("profile")}
                                    className={`px-3 py-2 sm:px-6 sm:py-3 font-medium text-xs sm:text-sm relative transition-all duration-300 ease-in-out ${activeTab === "profile"
                                            ? "text-[#3D3E3E] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#3D3E3E] after:rounded-full"
                                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                        }`}
                                    aria-label="Profile tab"
                                >
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <User className="w-3 h-3 sm:w-4 sm:h-4" />
                                        <span>Profile</span>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setActiveTab("borrowing")}
                                    className={`px-3 py-2 sm:px-6 sm:py-3 font-medium text-xs sm:text-sm relative transition-all duration-300 ease-in-out ${activeTab === "borrowing"
                                            ? "text-[#3D3E3E] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#3D3E3E] after:rounded-full"
                                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                        }`}
                                    aria-label="Borrowing history tab"
                                >
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <Book className="w-3 h-3 sm:w-4 sm:h-4" />
                                        <span className="hidden xs:inline">Borrowing History</span>
                                        <span className="xs:hidden">Borrowing</span>
                                        {totalBorrowed > 0 && (
                                            <span className="bg-gradient-to-r from-[#3D3E3E] to-[#151619] text-white text-[8px] sm:text-xs font-bold px-1 py-0.5 sm:px-2 sm:py-0.5 rounded-full animate-pulse">
                                                {totalBorrowed}
                                            </span>
                                        )}
                                    </div>
                                </button>
                                <button
                                    onClick={() => setActiveTab("analytics")}
                                    className={`px-3 py-2 sm:px-6 sm:py-3 font-medium text-xs sm:text-sm relative transition-all duration-300 ease-in-out ${activeTab === "analytics"
                                            ? "text-[#3D3E3E] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#3D3E3E] after:rounded-full"
                                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                        }`}
                                    aria-label="Analytics tab"
                                >
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                                        <span>Analytics</span>
                                    </div>
                                </button>
                            </nav>
                        </div>

                        {/* Content - Scrollable */}
                        <div className="overflow-y-auto flex-1 no-scrollbar">
                            {activeTab === "profile" && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={defaultTransition}
                                    className="space-y-4 sm:space-y-6 p-3 sm:p-6"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 overflow-hidden no-scrollbar">
                                            <h3 className="font-semibold text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">Personal Information</h3>
                                            <div className="space-y-2 sm:space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500 text-xs sm:text-sm">Full Name</span>
                                                    <span className="font-medium text-[#3D3E3E] truncate max-w-[50%] sm:max-w-[60%] text-xs sm:text-sm">{user.name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500 text-xs sm:text-sm">Email</span>
                                                    <span className="font-medium text-[#3D3E3E] truncate max-w-[50%] sm:max-w-[60%] text-xs sm:text-sm">{user.email}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500 text-xs sm:text-sm">Role</span>
                                                    <span className="font-medium">
                                                        <span className={`px-1 py-0.5 sm:px-1.5 sm:py-0.5 rounded-full text-[10px] sm:text-sm ${user.role === "Admin"
                                                                ? "bg-purple-100 text-purple-800"
                                                                : "bg-blue-100 text-blue-800"
                                                            }`}>
                                                            {user.role}
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                                            <h3 className="font-semibold text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">Account Information</h3>
                                            <div className="space-y-2 sm:space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500 text-xs sm:text-sm">Account Status</span>
                                                    <span className="font-medium">
                                                        <span className={`px-1 py-0.5 sm:px-1.5 sm:py-0.5 rounded-full text-[10px] sm:text-sm ${user.accountVerified
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-red-100 text-red-800"
                                                            }`}>
                                                            {user.accountVerified ? "Verified" : "Pending"}
                                                        </span>
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500 text-xs sm:text-sm">Member Since</span>
                                                    <span className="font-medium text-[#3D3E3E] text-xs sm:text-sm">{formatDate(user.createdAt)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500 text-xs sm:text-sm">Last Updated</span>
                                                    <span className="font-medium text-[#3D3E3E] text-xs sm:text-sm">{formatDate(user.updatedAt)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-2 sm:p-3 overflow-hidden">
                                        <h3 className="font-semibold text-gray-700 mb-2 text-sm sm:text-sm">Statistics</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-white rounded-md shadow p-2 border-l-2 border-blue-500 hover:shadow-sm transition-all duration-300 cursor-pointer transform hover:-translate-y-0.5 hover:scale-102 group relative overflow-hidden">
                                                <div className="flex items-center">
                                                    <div className="p-1 sm:p-1.5 bg-blue-100 rounded-full">
                                                        <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                                                    </div>
                                                    <div className="ml-2">
                                                        <p className="text-[10px] sm:text-xs font-medium text-gray-600">Books Borrowed</p>
                                                        <p className="text-base sm:text-lg font-semibold text-[#3D3E3E]">
                                                            {totalBorrowed}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-800 to-transparent text-white p-1 sm:p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-full group-hover:translate-y-0 overflow-hidden">
                                                    <p className="text-[8px] sm:text-[10px] whitespace-nowrap overflow-hidden text-ellipsis">
                                                        Total books borrowed
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="bg-white rounded-md shadow p-2 border-l-2 border-green-500 hover:shadow-sm transition-all duration-300 cursor-pointer transform hover:-translate-y-0.5 hover:scale-102 group relative overflow-hidden">
                                                <div className="flex items-center">
                                                    <div className="p-1 sm:p-1.5 bg-green-100 rounded-full">
                                                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                                                    </div>
                                                    <div className="ml-2">
                                                        <p className="text-[10px] sm:text-xs font-medium text-gray-600">Books Returned</p>
                                                        <p className="text-base sm:text-lg font-semibold text-green-600">
                                                            {returnedBooks}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-800 to-transparent text-white p-1 sm:p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-full group-hover:translate-y-0 overflow-hidden">
                                                    <p className="text-[8px] sm:text-[10px] whitespace-nowrap overflow-hidden text-ellipsis">
                                                        Books successfully returned
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="bg-white rounded-md shadow p-2 border-l-2 border-orange-500 hover:shadow-sm transition-all duration-300 cursor-pointer transform hover:-translate-y-0.5 hover:scale-102 group relative overflow-hidden">
                                                <div className="flex items-center">
                                                    <div className="p-1 sm:p-1.5 bg-orange-100 rounded-full">
                                                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
                                                    </div>
                                                    <div className="ml-2">
                                                        <p className="text-[10px] sm:text-xs font-medium text-gray-600">Currently Borrowed</p>
                                                        <p className="text-base sm:text-lg font-semibold text-orange-600">
                                                            {activeLoans}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-800 to-transparent text-white p-1 sm:p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-full group-hover:translate-y-0 overflow-hidden">
                                                    <p className="text-[8px] sm:text-[10px] whitespace-nowrap overflow-hidden text-ellipsis">
                                                        Books currently borrowed
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="bg-white rounded-md shadow p-2 border-l-2 border-red-500 hover:shadow-sm transition-all duration-300 cursor-pointer transform hover:-translate-y-0.5 hover:scale-102 group relative overflow-hidden">
                                                <div className="flex items-center">
                                                    <div className="p-1 sm:p-1.5 bg-red-100 rounded-full">
                                                        <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                                                    </div>
                                                    <div className="ml-2">
                                                        <p className="text-[10px] sm:text-xs font-medium text-gray-600">Overdue Books</p>
                                                        <p className="text-base sm:text-lg font-semibold text-red-600">
                                                            {overdueBooks}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-800 to-transparent text-white p-1 sm:p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-full group-hover:translate-y-0 overflow-hidden">
                                                    <p className="text-[8px] sm:text-[10px] whitespace-nowrap overflow-hidden text-ellipsis">
                                                        Books past due date
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="bg-white rounded-md shadow p-2 border-l-2 border-red-500 hover:shadow-sm transition-all duration-300 cursor-pointer transform hover:-translate-y-0.5 hover:scale-102 group relative overflow-hidden">
                                                <div className="flex items-center">
                                                    <div className="p-1 sm:p-1.5 bg-red-100 rounded-full">
                                                        <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                                                    </div>
                                                    <div className="ml-2">
                                                        <p className="text-[10px] sm:text-xs font-medium text-gray-600">Unpaid Fines</p>
                                                        <p className="text-base sm:text-lg font-semibold text-red-600">
                                                            {unpaidFines}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-800 to-transparent text-white p-1 sm:p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-full group-hover:translate-y-0 overflow-hidden">
                                                    <p className="text-[8px] sm:text-[10px] whitespace-nowrap overflow-hidden text-ellipsis">
                                                        Books with unpaid fines
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="bg-white rounded-md shadow p-2 border-l-2 border-purple-500 hover:shadow-sm transition-all duration-300 cursor-pointer transform hover:-translate-y-0.5 hover:scale-102 group relative overflow-hidden">
                                                <div className="flex items-center">
                                                    <div className="p-1 sm:p-1.5 bg-purple-100 rounded-full">
                                                        <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                                                    </div>
                                                    <div className="ml-2">
                                                        <p className="text-[10px] sm:text-xs font-medium text-gray-600">Total Fines</p>
                                                        <p className="text-base sm:text-lg font-semibold text-purple-600">
                                                            ₹{totalFineAmount.toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-800 to-transparent text-white p-1 sm:p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-full group-hover:translate-y-0 overflow-hidden">
                                                    <p className="text-[8px] sm:text-[10px] whitespace-nowrap overflow-hidden text-ellipsis">
                                                        Total fine amount
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === "borrowing" && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={defaultTransition}
                                    className="space-y-4 sm:space-y-6 p-3 sm:p-6"
                                >
                                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                                            <h3 className="font-semibold text-gray-700 text-sm sm:text-base">Borrowing History</h3>
                                            
                                            {/* Search and Sort Controls */}
                                            <div className="flex flex-col sm:flex-row gap-2">
                                                {/* Search Input */}
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        placeholder="Search books..."
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        className="pl-8 pr-4 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                                        aria-label="Search borrowing history"
                                                    />
                                                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                </div>
                                                
                                                {/* Pay All Fines Button - Only show for unpaid fines on active loans */}
                                                {unpaidFineAmount > 0 ? (
                                                    <button
                                                        onClick={handlePayAllFines}
                                                        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition-colors"
                                                        aria-label="Pay all unpaid fines"
                                                    >
                                                        <CreditCard className="w-3 h-3" />
                                                        Pay All Fines (₹{unpaidFineAmount.toFixed(2)})
                                                    </button>
                                                ) : (
                                                    <div className="text-xs text-gray-500">
                                                        No unpaid fines (Amount: ₹{unpaidFineAmount.toFixed(2)}, Count: {unpaidFines})
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Sortable Table Header */}
                                        <div className="hidden md:grid grid-cols-12 gap-2 mb-2 px-2 py-1.5 bg-gray-100 rounded-md text-xs font-medium text-gray-600">
                                            <div 
                                                className="col-span-3 flex items-center cursor-pointer hover:text-gray-900"
                                                onClick={() => handleSort('title')}
                                            >
                                                <span>Book Title</span>
                                                <ArrowUpDown className="w-3 h-3 ml-1" />
                                                {getSortIndicator('title') && (
                                                    <span className="ml-1">{getSortIndicator('title')}</span>
                                                )}
                                            </div>
                                            <div 
                                                className="col-span-2 flex items-center cursor-pointer hover:text-gray-900"
                                                onClick={() => handleSort('author')}
                                            >
                                                <span>Author</span>
                                                <ArrowUpDown className="w-3 h-3 ml-1" />
                                                {getSortIndicator('author') && (
                                                    <span className="ml-1">{getSortIndicator('author')}</span>
                                                )}
                                            </div>
                                            <div 
                                                className="col-span-2 flex items-center cursor-pointer hover:text-gray-900"
                                                onClick={() => handleSort('borrowDate')}
                                            >
                                                <span>Borrowed</span>
                                                <ArrowUpDown className="w-3 h-3 ml-1" />
                                                {getSortIndicator('borrowDate') && (
                                                    <span className="ml-1">{getSortIndicator('borrowDate')}</span>
                                                )}
                                            </div>
                                            <div 
                                                className="col-span-2 flex items-center cursor-pointer hover:text-gray-900"
                                                onClick={() => handleSort('dueDate')}
                                            >
                                                <span>Due Date</span>
                                                <ArrowUpDown className="w-3 h-3 ml-1" />
                                                {getSortIndicator('dueDate') && (
                                                    <span className="ml-1">{getSortIndicator('dueDate')}</span>
                                                )}
                                            </div>
                                            <div 
                                                className="col-span-2 flex items-center cursor-pointer hover:text-gray-900"
                                                onClick={() => handleSort('fine')}
                                            >
                                                <span>Fine</span>
                                                <ArrowUpDown className="w-3 h-3 ml-1" />
                                                {getSortIndicator('fine') && (
                                                    <span className="ml-1">{getSortIndicator('fine')}</span>
                                                )}
                                            </div>
                                            <div className="col-span-1 text-center">Actions</div>
                                        </div>
                                        
                                        {isLoading ? (
                                            <div className="text-center py-6 sm:py-8">
                                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-3"></div>
                                                <h3 className="text-sm sm:text-base font-medium text-gray-700">Loading borrowing history...</h3>
                                            </div>
                                        ) : filteredAndSortedBooks?.length > 0 ? (
                                            <div className="space-y-2 sm:space-y-3 max-h-[50vh] sm:max-h-[65vh] overflow-y-auto custom-scrollbar">
                                                {filteredAndSortedBooks.map((borrow, index) => {
                                                    // Calculate due date (typically 60 days from borrow date)
                                                    const borrowDate = new Date(borrow.borrowDate || borrow.createdAt);
                                                    const dueDate = new Date(borrowDate);
                                                    dueDate.setDate(dueDate.getDate() + 60);
                                                    
                                                    // Calculate if overdue
                                                    const isOverdue = !borrow.returnDate && new Date() > dueDate;
                                                    
                                                    // Create a robust unique key that remains stable across renders
                                                    let uniqueKey;
                                                    if (borrow._id) {
                                                        uniqueKey = `borrow-${borrow._id}`;
                                                    } else {
                                                        // Create a composite key from available properties
                                                        const bookId = borrow.book?._id || borrow.bookId || 'no-book-id';
                                                        const borrowTimestamp = borrow.borrowDate || borrow.createdAt || Date.now();
                                                        const returnTimestamp = borrow.returnDate || 'not-returned';
                                                        // Include index to ensure uniqueness when other properties are the same
                                                        uniqueKey = `borrow-${bookId}-${borrowTimestamp}-${returnTimestamp}-${index}`;
                                                    }
                                                    
                                                    return (
                                                        <div 
                                                            key={uniqueKey}
                                                            className="bg-white rounded-lg shadow p-3 sm:p-4 border-l-2 border-blue-500 hover:shadow-sm transition-all duration-300 cursor-pointer transform hover:-translate-y-0.5 hover:scale-102 group relative overflow-hidden"
                                                        >
                                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-3">
                                                                <div className="flex items-start gap-2 sm:gap-3">
                                                                    <div className="bg-[#3D3E3E] p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                                                                        <Book className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className="font-semibold text-[#3D3E3E] text-sm truncate">{borrow.book?.title || borrow.bookName || "Untitled Book"}</h4>
                                                                        <p className="text-xs text-gray-600 truncate">by {borrow.book?.author || "Unknown Author"}</p>
                                                                        <div className="flex flex-wrap gap-1 mt-1.5 sm:mt-2">
                                                                            <span className="text-[8px] sm:text-[10px] bg-gray-100 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded text-[#3D3E3E]">
                                                                                Borrowed: {formatDate(borrow.borrowDate || borrow.createdAt)}
                                                                            </span>
                                                                            {borrow.returnDate ? (
                                                                                <span className="text-[8px] sm:text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded">
                                                                                    Returned: {formatDate(borrow.returnDate)}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-[8px] sm:text-[10px] bg-orange-100 text-orange-800 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded">
                                                                                    Not Returned
                                                                                </span>
                                                                            )}
                                                                            {!borrow.returnDate && (
                                                                                <span className="text-[8px] sm:text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded">
                                                                                    Due: {formatDate(dueDate)}
                                                                                </span>
                                                                            )}
                                                                            {isOverdue && (
                                                                                <span className="text-[8px] sm:text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded animate-pulse">
                                                                                    Overdue
                                                                                </span>
                                                                            )}
                                                                            {borrow.fine > 0 && borrow.paymentStatus !== "completed" && (
                                                                                <span className="text-[8px] sm:text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded">
                                                                                    Fine: ₹{borrow.fine.toFixed(2)}
                                                                                </span>
                                                                            )}
                                                                            {borrow.fine > 0 && borrow.paymentStatus === "completed" && (
                                                                                <span className="text-[8px] sm:text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded">
                                                                                    Fine Paid
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col sm:flex-row items-center gap-2">
                                                                    {borrow.fine > 0 && borrow.paymentStatus !== "completed" && !borrow.returnDate && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setSelectedBorrowRecord(borrow);
                                                                            }}
                                                                            className="text-[10px] sm:text-xs bg-black text-white px-2 py-1 rounded hover:bg-gray-800 transition-colors flex items-center"
                                                                            aria-label="Pay fine for this book"
                                                                        >
                                                                            <CreditCard className="w-3 h-3 mr-1" />
                                                                            Pay Fine
                                                                        </button>
                                                                    )}
                                                                    <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-600 bg-gray-50 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded whitespace-nowrap">
                                                                        <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                                                                        <span className="truncate">
                                                                            {borrow.returnDate
                                                                                ? `${Math.ceil((new Date(borrow.returnDate) - new Date(borrow.borrowDate || borrow.createdAt)) / (1000 * 60 * 60 * 24))} days`
                                                                                : `${Math.ceil((new Date() - new Date(borrow.borrowDate || borrow.createdAt)) / (1000 * 60 * 60 * 24))} days`}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 sm:py-8">
                                                <Book className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300 mx-auto mb-2 sm:mb-3" />
                                                <h3 className="text-sm sm:text-base font-medium text-gray-700">No borrowing history</h3>
                                                <p className="text-gray-500 mt-1 text-xs sm:text-sm">This user hasn't borrowed any books yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === "analytics" && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={defaultTransition}
                                    className="space-y-4 sm:space-y-6 p-3 sm:p-6"
                                >
                                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                                        <h3 className="font-semibold text-gray-700 mb-4 text-sm sm:text-base">Borrowing Analytics</h3>
                                        
                                        {/* Mini Analytics Cards */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                                            <div className="bg-white rounded-lg shadow p-3 border-l-4 border-blue-500">
                                                <div className="flex items-center">
                                                    <div className="p-2 bg-blue-100 rounded-full">
                                                        <BookOpen className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-xs text-gray-500">Total Books</p>
                                                        <p className="text-lg font-bold text-[#3D3E3E]">{borrowingStats.totalBooks}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="bg-white rounded-lg shadow p-3 border-l-4 border-green-500">
                                                <div className="flex items-center">
                                                    <div className="p-2 bg-green-100 rounded-full">
                                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-xs text-gray-500">Returned</p>
                                                        <p className="text-lg font-bold text-green-600">{borrowingStats.returned}</p>
                                                        <p className="text-[10px] text-gray-500">{borrowingStats.returnedPercentage}% of total</p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="bg-white rounded-lg shadow p-3 border-l-4 border-orange-500">
                                                <div className="flex items-center">
                                                    <div className="p-2 bg-orange-100 rounded-full">
                                                        <Clock className="w-4 h-4 text-orange-600" />
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-xs text-gray-500">Active Loans</p>
                                                        <p className="text-lg font-bold text-orange-600">{borrowingStats.active}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="bg-white rounded-lg shadow p-3 border-l-4 border-red-500">
                                                <div className="flex items-center">
                                                    <div className="p-2 bg-red-100 rounded-full">
                                                        <AlertCircle className="w-4 h-4 text-red-600" />
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-xs text-gray-500">Overdue</p>
                                                        <p className="text-lg font-bold text-red-600">{borrowingStats.overdue}</p>
                                                        <p className="text-[10px] text-gray-500">{borrowingStats.overduePercentage}% of active</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Mini Progress Bars */}
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-gray-600">Return Rate</span>
                                                    <span className="font-medium">{borrowingStats.returnedPercentage}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div 
                                                        className="bg-green-500 h-2 rounded-full" 
                                                        style={{ width: `${borrowingStats.returnedPercentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-gray-600">Overdue Rate</span>
                                                    <span className="font-medium">{borrowingStats.overduePercentage}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div 
                                                        className="bg-red-500 h-2 rounded-full" 
                                                        style={{ width: `${borrowingStats.overduePercentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-gray-600">Fine Payment Rate</span>
                                                    <span className="font-medium">
                                                        {unpaidFines > 0 
                                                            ? `${Math.round(((totalFineAmount - unpaidFineAmount) / totalFineAmount) * 100)}%` 
                                                            : "100%"}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div 
                                                        className="bg-purple-500 h-2 rounded-full" 
                                                        style={{ 
                                                            width: `${unpaidFines > 0 
                                                                ? Math.round(((totalFineAmount - unpaidFineAmount) / totalFineAmount) * 100) 
                                                                : 100}%` 
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Fine Summary */}
                                        <div className="mt-6 p-3 bg-white rounded-lg shadow">
                                            <h4 className="font-semibold text-gray-700 mb-3 text-sm">Fine Summary</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <div className="bg-blue-50 p-2 rounded">
                                                    <p className="text-xs text-gray-600">Total Fines</p>
                                                    <p className="text-lg font-bold text-blue-600">₹{totalFineAmount.toFixed(2)}</p>
                                                </div>
                                                <div className="bg-green-50 p-2 rounded">
                                                    <p className="text-xs text-gray-600">Paid Fines</p>
                                                    <p className="text-lg font-bold text-green-600">₹{(totalFineAmount - unpaidFineAmount).toFixed(2)}</p>
                                                </div>
                                                <div className="bg-red-50 p-2 rounded">
                                                    <p className="text-xs text-gray-600">Unpaid Fines</p>
                                                    <p className="text-lg font-bold text-red-600">₹{unpaidFineAmount.toFixed(2)}</p>
                                                </div>
                                            </div>
                                            
                                            {unpaidFineAmount > 0 ? (
                                                <div className="mt-3">
                                                    <button
                                                        onClick={handlePayAllFines}
                                                        className="w-full flex items-center justify-center gap-2 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition-colors text-sm"
                                                    >
                                                        <CreditCard className="w-4 h-4" />
                                                        Pay All Unpaid Fines (₹{unpaidFineAmount.toFixed(2)})
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="mt-3 text-xs text-gray-500">
                                                    No unpaid fines to pay (Amount: ₹{unpaidFineAmount.toFixed(2)})
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Footer - Fixed */}
                        <div className="border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 flex justify-end flex-shrink-0">
                            <button
                                onClick={onClose}
                                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base"
                                aria-label="Close user details"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        </>
    );
};

export default UserDetailsCard;