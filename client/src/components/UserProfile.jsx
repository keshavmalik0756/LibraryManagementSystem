import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import {
    User,
    Mail,
    Shield,
    Calendar,
    BookOpen,
    CheckCircle,
    Clock,
    AlertCircle,
    CreditCard,
    Search,
    ArrowUpDown,
    TrendingUp,
    RefreshCw,
    X
} from "lucide-react";
import { fetchUserBorrowedBooks } from "../store/slices/borrowSlice";
import { toast } from "react-toastify";
import Header from "../layout/Header";

const UserProfile = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { userBorrowedBooks, error } = useSelector((state) => state.borrow);

    const intervalRef = useRef(null);
    const isMountedRef = useRef(true);

    const [activeTab, setActiveTab] = useState("profile");
    const [borrowedBooks, setBorrowedBooks] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [lastRefreshed, setLastRefreshed] = useState(new Date());
    const [lastSuccessfulUpdate, setLastSuccessfulUpdate] = useState(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [localFetchLoading, setLocalFetchLoading] = useState(false);

    // Clear interval on component unmount
    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, []);

    // Set up interval to periodically refresh borrowing data with optimization
    useEffect(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (!user?.email) return;

        const fetchData = () => {
            if (!isMountedRef.current) return;

            setLocalFetchLoading(true);
            dispatch(fetchUserBorrowedBooks(user.email))
                .unwrap()
                .then(() => {
                    if (isMountedRef.current) {
                        setLastRefreshed(new Date());
                        setLastSuccessfulUpdate(new Date());
                    }
                })
                .catch((err) => {
                    if (isMountedRef.current) {
                        toast.error("Failed to fetch borrowing data: " + err);
                    }
                })
                .finally(() => {
                    if (isMountedRef.current) {
                        setLocalFetchLoading(false);
                    }
                });
        };

        fetchData();

        intervalRef.current = setInterval(() => {
            if (isMountedRef.current && !isRefreshing) {
                fetchData();
            }
        }, 60000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [user?.email, dispatch]);

    useEffect(() => {
        if (userBorrowedBooks) {
            setBorrowedBooks(userBorrowedBooks);
            setLastRefreshed(new Date());
            setLastSuccessfulUpdate(new Date());
        }
    }, [userBorrowedBooks]);

    useEffect(() => {
        if (error) {
            toast.error(error);
            setLastRefreshed(new Date());
        }
    }, [error]);

    const formatDate = (input) => {
        if (!input || input === "N/A") return "N/A";

        try {
            let date;

            if (input instanceof Date && !isNaN(input.getTime())) {
                date = input;
            } else if (typeof input === 'string') {
                if (input.trim() === '') return "N/A";
                date = new Date(input);
                if (isNaN(date.getTime())) {
                    const timestamp = parseInt(input, 10);
                    if (!isNaN(timestamp) && timestamp > 0) {
                        date = new Date(timestamp);
                    }
                }
            } else if (typeof input === 'number') {
                if (isNaN(input) || input <= 0) return "N/A";
                date = new Date(input);
            } else if (typeof input === 'object' && input !== null) {
                if (Object.prototype.toString.call(input) === '[object Date]') {
                    date = new Date(input.getTime());
                } else if (typeof input.toJSON === 'function') {
                    const jsonValue = input.toJSON();
                    if (jsonValue) {
                        date = new Date(jsonValue);
                    }
                } else if (input.$date !== undefined) {
                    date = new Date(input.$date);
                } else if (input._id && input.email && input.name) {
                    if (input.createdAt) {
                        return formatDate(input.createdAt);
                    }
                    return "N/A";
                } else {
                    const str = String(input);
                    if (str && str !== '[object Object]') {
                        date = new Date(str);
                    }
                }
            }

            if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
                return "N/A";
            }

            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();

            return `${day}/${month}/${year}`;
        } catch (error) {
            return "N/A";
        }
    };

    const filteredAndSortedBooks = useMemo(() => {
        let result = [...borrowedBooks];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(book =>
                (book.book?.title?.toLowerCase().includes(term)) ||
                (book.book?.author?.toLowerCase().includes(term)) ||
                (formatDate(book.borrowDate).toLowerCase().includes(term)) ||
                (book.returnDate && formatDate(book.returnDate).toLowerCase().includes(term))
            );
        }

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

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'asc' ? '↑' : '↓';
        }
        return '';
    };

    const totalBorrowed = borrowedBooks?.length || 0;
    const returnedBooks = borrowedBooks?.filter(b => b.returnDate)?.length || 0;
    const activeLoans = borrowedBooks?.filter(b => !b.returnDate)?.length || 0;

    const overdueBooks = borrowedBooks?.filter(b => {
        if (b.returnDate) return false;
        const dueDate = new Date(b.dueDate || b.borrowDate);
        if (b.dueDate) {
            dueDate.setDate(dueDate.getDate() + 60);
        }
        return new Date() > dueDate;
    })?.length || 0;

    const totalFines = borrowedBooks?.reduce((sum, book) => sum + (book.fine || 0), 0) || 0;
    const unpaidFines = borrowedBooks?.filter(b => b.fine > 0 && b.paymentStatus !== "completed" && !b.returnDate)?.length || 0;
    const unpaidFineAmount = borrowedBooks?.reduce((sum, book) => {
        if (book.fine > 0 && book.paymentStatus !== "completed" && !book.returnDate) {
            return sum + book.fine;
        }
        return sum;
    }, 0) || 0;

    const statsData = [
        {
            id: 1,
            title: "Books Borrowed",
            value: totalBorrowed,
            icon: BookOpen,
            color: "blue",
            borderClass: "border-blue-500",
            bgClass: "bg-blue-100",
            textClass: "text-blue-600"
        },
        {
            id: 2,
            title: "Books Returned",
            value: returnedBooks,
            icon: CheckCircle,
            color: "green",
            borderClass: "border-green-500",
            bgClass: "bg-green-100",
            textClass: "text-green-600"
        },
        {
            id: 3,
            title: "Active Loans",
            value: activeLoans,
            icon: Clock,
            color: "orange",
            borderClass: "border-orange-500",
            bgClass: "bg-orange-100",
            textClass: "text-orange-600"
        },
        {
            id: 4,
            title: "Overdue Books",
            value: overdueBooks,
            icon: AlertCircle,
            color: "red",
            borderClass: "border-red-500",
            bgClass: "bg-red-100",
            textClass: "text-red-600"
        },
        {
            id: 5,
            title: "Unpaid Fines",
            value: `₹${unpaidFineAmount.toFixed(2)}`,
            icon: CreditCard,
            color: "purple",
            borderClass: "border-purple-500",
            bgClass: "bg-purple-100",
            textClass: "text-purple-600"
        }
    ];

    const refreshData = () => {
        if (user?.email && !isRefreshing) {
            setIsRefreshing(true);
            setLocalFetchLoading(true);

            dispatch(fetchUserBorrowedBooks(user.email))
                .unwrap()
                .then(() => {
                    if (isMountedRef.current) {
                        toast.success("Data refreshed successfully");
                        setLastRefreshed(new Date());
                        setLastSuccessfulUpdate(new Date());
                    }
                })
                .catch((err) => {
                    if (isMountedRef.current) {
                        toast.error("Failed to refresh data: " + err);
                    }
                })
                .finally(() => {
                    if (isMountedRef.current) {
                        setIsRefreshing(false);
                        setLocalFetchLoading(false);
                    }
                });
        }
    };

    const getUserData = (field, fallback = "N/A") => {
        if (!user) {
            return fallback;
        }

        if (field === 'createdAt' || field === 'updatedAt') {
            let dateValue = null;

            if (user[field] !== undefined && user[field] !== null) {
                dateValue = user[field];
            } else if (user.full && user.full[field] !== undefined && user.full[field] !== null) {
                dateValue = user.full[field];
            }

            if (dateValue !== null) {
                if (typeof dateValue === 'string' || typeof dateValue === 'number') {
                    return dateValue;
                }
                if (dateValue instanceof Date) {
                    return dateValue;
                }
                if (dateValue.toJSON && typeof dateValue.toJSON === 'function') {
                    return dateValue.toJSON();
                }
                if (typeof dateValue === 'object' && dateValue._id && dateValue.email) {
                    if (dateValue[field]) {
                        return dateValue[field];
                    }
                    return fallback;
                }
            }
            return fallback;
        }

        const value = user[field];
        return (value === undefined || value === null) ? fallback : value;
    };

    // Shared transition configurations
    const springTransition = { type: "spring", damping: 25, stiffness: 300 };
    const defaultTransition = { duration: 0.3, ease: "easeInOut" };

    return (
        <>
            <main className="relative flex-1 p-2 sm:p-4 md:p-6 pt-16 sm:pt-20 md:pt-24 lg:pt-28">
                <Header />
                <div className="max-w-6xl mx-auto mt-4 sm:mt-6 md:mt-8 lg:mt-10">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 sm:mb-6 gap-3 md:gap-4">
                        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 overflow-hidden">
                            My Profile
                        </h1>

                        <div className="flex flex-wrap items-center gap-2 md:gap-3">
                            <span className="px-2 py-1 sm:px-3 sm:py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm font-medium">
                                {getUserData('role')}
                            </span>
                            <span className="px-2 py-1 sm:px-3 sm:py-1 bg-gray-100 text-gray-700 rounded-full text-xs sm:text-sm font-medium">
                                Last updated: {lastRefreshed.toLocaleTimeString()}
                            </span>
                            <button
                                onClick={refreshData}
                                disabled={isRefreshing}
                                className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 ${isRefreshing
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                aria-label="Refresh data"
                            >
                                {isRefreshing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-700"></div>
                                        <span className="hidden xs:inline">Refreshing...</span>
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="w-3 h-3" />
                                        <span className="hidden xs:inline">Refresh</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Profile Card */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6 sm:mb-8">
                        <div className="bg-gradient-to-r from-gray-800 to-black p-4 sm:p-5 md:p-6 lg:p-8">
                            <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6">
                                <div className="bg-gradient-to-br from-gray-800 to-black rounded-full w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 flex items-center justify-center text-white font-bold text-xl sm:text-2xl md:text-3xl shadow-lg border-2 sm:border-4 border-white">
                                    {getUserData('name')?.charAt(0).toUpperCase()}
                                </div>
                                <div className="text-center sm:text-left">
                                    <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white">{getUserData('name')}</h2>
                                    <p className="text-blue-200 flex items-center justify-center sm:justify-start mt-1 text-xs sm:text-sm md:text-base">
                                        <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                        {getUserData('email')}
                                    </p>
                                    <div className="flex flex-wrap justify-center sm:justify-start gap-1 sm:gap-2 mt-3 md:mt-4">
                                        <div className="bg-blue-500 bg-opacity-20 rounded-lg px-2 py-1 sm:px-3 sm:py-1 flex items-center border border-blue-400">
                                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-blue-300" />
                                            <span className="text-xs sm:text-sm text-blue-100 font-medium">
                                                Joined: {formatDate(getUserData('createdAt'))}
                                            </span>
                                        </div>
                                        <div className="bg-green-500 bg-opacity-20 rounded-lg px-2 py-1 sm:px-3 sm:py-1 flex items-center border border-green-400">
                                            <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-green-300" />
                                            <span className="text-xs sm:text-sm text-green-100 font-medium">
                                                {getUserData('accountVerified') ? "Verified" : "Pending Verification"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="p-3 sm:p-4 md:p-6">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
                                {statsData.map((stat) => {
                                    const IconComponent = stat.icon;
                                    return (
                                        <div
                                            key={stat.id}
                                            className={`bg-white rounded-lg shadow p-2 sm:p-3 md:p-4 border-l-2 sm:border-l-4 ${stat.borderClass} hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 group relative overflow-hidden`}
                                        >
                                            <div className="flex items-center">
                                                <div className={`p-1.5 sm:p-2 md:p-3 ${stat.bgClass} rounded-full`}>
                                                    <IconComponent className={`w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 ${stat.textClass}`} />
                                                </div>
                                                <div className="ml-2 sm:ml-3 md:ml-4">
                                                    <p className="text-[10px] sm:text-xs font-medium text-gray-600">{stat.title}</p>
                                                    <p className="text-sm sm:text-base md:text-xl font-bold text-gray-800">
                                                        {stat.value}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Expanded information on hover */}
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent text-white p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-full group-hover:translate-y-0 overflow-hidden">
                                                <p className="text-[8px]">
                                                    {stat.id === 1 && "Total books borrowed"}
                                                    {stat.id === 2 && "Books successfully returned"}
                                                    {stat.id === 3 && "Currently active loans"}
                                                    {stat.id === 4 && "Overdue book count"}
                                                    {stat.id === 5 && "Pending fine payments"}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Tabs */}
                            <div className="border-b border-gray-200 mb-4 sm:mb-6">
                                <nav className="flex pb-1 -mx-1 px-1">
                                    <button
                                        onClick={() => setActiveTab("profile")}
                                        className={`px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4 font-medium text-xs sm:text-sm relative transition-all duration-300 ease-in-out whitespace-nowrap mx-1 ${activeTab === "profile"
                                                ? "text-black after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-black after:rounded-full"
                                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                            }`}
                                    >
                                        <div className="flex items-center gap-1">
                                            <User className="w-3 h-3 sm:w-4 sm:h-4" />
                                            <span>Profile</span>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("borrowing")}
                                        className={`px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4 font-medium text-xs sm:text-sm relative transition-all duration-300 ease-in-out whitespace-nowrap mx-1 ${activeTab === "borrowing"
                                                ? "text-black after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-black after:rounded-full"
                                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                            }`}
                                    >
                                        <div className="flex items-center gap-1">
                                            <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                                            <span className="hidden xs:inline">Borrowing</span>
                                            <span className="xs:hidden">Borrow</span>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("analytics")}
                                        className={`px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4 font-medium text-xs sm:text-sm relative transition-all duration-300 ease-in-out whitespace-nowrap mx-1 ${activeTab === "analytics"
                                                ? "text-black after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-black after:rounded-full"
                                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                            }`}
                                    >
                                        <div className="flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                                            <span>Analytics</span>
                                        </div>
                                    </button>
                                </nav>
                            </div>

                            {/* Tab Content */}
                            {activeTab === "profile" && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={defaultTransition}
                                    className="space-y-3 sm:space-y-4 md:space-y-6"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                                        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 overflow-hidden">
                                            <h3 className="font-semibold text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">Personal Information</h3>
                                            <div className="space-y-2 sm:space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500 text-xs sm:text-sm">Full Name</span>
                                                    <span className="font-medium text-gray-800 truncate max-w-[50%] sm:max-w-[60%] text-xs sm:text-sm">{getUserData('name')}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500 text-xs sm:text-sm">Email</span>
                                                    <span className="font-medium text-gray-800 truncate max-w-[50%] sm:max-w-[60%] text-xs sm:text-sm">{getUserData('email')}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500 text-xs sm:text-sm">Role</span>
                                                    <span className="font-medium">
                                                        <span className={`px-1 py-0.5 sm:px-1.5 sm:py-0.5 rounded-full text-[10px] sm:text-sm ${getUserData('role') === "Admin"
                                                                ? "bg-purple-100 text-purple-800"
                                                                : "bg-blue-100 text-blue-800"
                                                            }`}>
                                                            {getUserData('role')}
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
                                                        <span className={`px-1 py-0.5 sm:px-1.5 sm:py-0.5 rounded-full text-[10px] sm:text-sm ${getUserData('accountVerified')
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-red-100 text-red-800"
                                                            }`}>
                                                            {getUserData('accountVerified') ? "Verified" : "Pending"}
                                                        </span>
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500 text-xs sm:text-sm">Member Since</span>
                                                    <span className="font-medium text-gray-800 text-xs sm:text-sm">{formatDate(getUserData('createdAt'))}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500 text-xs sm:text-sm">Last Updated</span>
                                                    <span className="font-medium text-gray-800 text-xs sm:text-sm">{formatDate(getUserData('updatedAt'))}</span>
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
                                >
                                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
                                            <h3 className="font-semibold text-gray-700 text-sm sm:text-base">Borrowing History</h3>

                                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        placeholder="Search books..."
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        className="pl-7 pr-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black w-full"
                                                        aria-label="Search borrowing history"
                                                    />
                                                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                                                </div>

                                                <button
                                                    onClick={refreshData}
                                                    disabled={isRefreshing}
                                                    className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 justify-center ${isRefreshing
                                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                            : 'bg-black text-white hover:bg-gray-800'
                                                        }`}
                                                    aria-label="Refresh borrowing history"
                                                >
                                                    {isRefreshing ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                            <span className="hidden xs:inline">Refreshing...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <RefreshCw className="w-3 h-3" />
                                                            <span className="hidden xs:inline">Refresh</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Sortable Table Header - Hidden on mobile */}
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

                                        {localFetchLoading && filteredAndSortedBooks?.length > 0 ? (
                                            <div className="space-y-2">
                                                {filteredAndSortedBooks.map((borrow, index) => {
                                                    const borrowDate = new Date(borrow.borrowDate || borrow.createdAt);
                                                    const dueDate = new Date(borrowDate);
                                                    dueDate.setDate(dueDate.getDate() + 60);

                                                    const isOverdue = !borrow.returnDate && new Date() > dueDate;

                                                    let uniqueKey;
                                                    if (borrow._id) {
                                                        uniqueKey = `borrow-${borrow._id}`;
                                                    } else {
                                                        const bookId = borrow.book?._id || borrow.bookId || 'no-book-id';
                                                        const borrowTimestamp = borrow.borrowDate || borrow.createdAt || Date.now();
                                                        const returnTimestamp = borrow.returnDate || 'not-returned';
                                                        uniqueKey = `borrow-${bookId}-${borrowTimestamp}-${returnTimestamp}-${index}`;
                                                    }

                                                    return (
                                                        <div
                                                            key={uniqueKey}
                                                            className="bg-white rounded-lg shadow p-3 border-l-2 border-black hover:shadow-sm transition-all duration-300 transform hover:-translate-y-0.5 group relative overflow-hidden opacity-70"
                                                        >
                                                            <div className="flex flex-col gap-2">
                                                                <div className="flex items-start gap-2">
                                                                    <div className="bg-black p-1.5 rounded-lg flex-shrink-0">
                                                                        <BookOpen className="w-3 h-3 text-white" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className="font-semibold text-gray-800 text-sm">{borrow.book?.title || borrow.bookName || "Untitled Book"}</h4>
                                                                        <p className="text-xs text-gray-600">by {borrow.book?.author || "Unknown Author"}</p>
                                                                    </div>
                                                                </div>

                                                                <div className="flex flex-wrap gap-1">
                                                                    <span className="text-[8px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">
                                                                        Borrowed: {formatDate(borrow.borrowDate || borrow.createdAt)}
                                                                    </span>
                                                                    {borrow.returnDate ? (
                                                                        <span className="text-[8px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                                                                            Returned: {formatDate(borrow.returnDate)}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[8px] bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded">
                                                                            Not Returned
                                                                        </span>
                                                                    )}
                                                                    {!borrow.returnDate && (
                                                                        <span className="text-[8px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                                                                            Due: {formatDate(dueDate)}
                                                                        </span>
                                                                    )}
                                                                    {isOverdue && (
                                                                        <span className="text-[8px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded animate-pulse">
                                                                            Overdue
                                                                        </span>
                                                                    )}
                                                                    {borrow.fine > 0 && borrow.paymentStatus !== "completed" && (
                                                                        <span className="text-[8px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded">
                                                                            Fine: ₹{borrow.fine.toFixed(2)}
                                                                        </span>
                                                                    )}
                                                                    {borrow.fine > 0 && borrow.paymentStatus === "completed" && (
                                                                        <span className="text-[8px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                                                                            Fine Paid
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                                                    {borrow.fine > 0 && borrow.paymentStatus !== "completed" && !borrow.returnDate && (
                                                                        <button className="text-[10px] bg-black text-white px-2 py-1 rounded hover:bg-gray-800 transition-colors flex items-center">
                                                                            <CreditCard className="w-2.5 h-2.5 mr-1" />
                                                                            Pay Fine
                                                                        </button>
                                                                    )}
                                                                    <div className="flex items-center gap-1 text-[10px] text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded whitespace-nowrap">
                                                                        <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                                                                        <span>
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
                                                <div className="text-center py-2">
                                                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-black"></div>
                                                    <p className="text-gray-500 text-xs mt-1">Refreshing data... (Last updated: {lastSuccessfulUpdate.toLocaleTimeString()})</p>
                                                </div>
                                            </div>
                                        ) : localFetchLoading ? (
                                            <div className="text-center py-4 sm:py-6">
                                                <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-black mb-2"></div>
                                                <h3 className="text-sm font-medium text-gray-700">Loading borrowing history...</h3>
                                                <p className="text-gray-500 text-xs mt-1">Last updated: {lastSuccessfulUpdate.toLocaleTimeString()}</p>
                                            </div>
                                        ) : filteredAndSortedBooks?.length > 0 ? (
                                            <div className="space-y-2">
                                                {filteredAndSortedBooks.map((borrow, index) => {
                                                    const borrowDate = new Date(borrow.borrowDate || borrow.createdAt);
                                                    const dueDate = new Date(borrowDate);
                                                    dueDate.setDate(dueDate.getDate() + 60);

                                                    const isOverdue = !borrow.returnDate && new Date() > dueDate;

                                                    let uniqueKey;
                                                    if (borrow._id) {
                                                        uniqueKey = `borrow-${borrow._id}`;
                                                    } else {
                                                        const bookId = borrow.book?._id || borrow.bookId || 'no-book-id';
                                                        const borrowTimestamp = borrow.borrowDate || borrow.createdAt || Date.now();
                                                        const returnTimestamp = borrow.returnDate || 'not-returned';
                                                        uniqueKey = `borrow-${bookId}-${borrowTimestamp}-${returnTimestamp}-${index}`;
                                                    }

                                                    return (
                                                        <div
                                                            key={uniqueKey}
                                                            className="bg-white rounded-lg shadow p-3 border-l-2 border-black hover:shadow-sm transition-all duration-300 transform hover:-translate-y-0.5 group relative overflow-hidden"
                                                        >
                                                            <div className="flex flex-col gap-2">
                                                                <div className="flex items-start gap-2">
                                                                    <div className="bg-black p-1.5 rounded-lg flex-shrink-0">
                                                                        <BookOpen className="w-3 h-3 text-white" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className="font-semibold text-gray-800 text-sm">{borrow.book?.title || borrow.bookName || "Untitled Book"}</h4>
                                                                        <p className="text-xs text-gray-600">by {borrow.book?.author || "Unknown Author"}</p>
                                                                    </div>
                                                                </div>

                                                                <div className="flex flex-wrap gap-1">
                                                                    <span className="text-[8px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">
                                                                        Borrowed: {formatDate(borrow.borrowDate || borrow.createdAt)}
                                                                    </span>
                                                                    {borrow.returnDate ? (
                                                                        <span className="text-[8px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                                                                            Returned: {formatDate(borrow.returnDate)}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[8px] bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded">
                                                                            Not Returned
                                                                        </span>
                                                                    )}
                                                                    {!borrow.returnDate && (
                                                                        <span className="text-[8px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                                                                            Due: {formatDate(dueDate)}
                                                                        </span>
                                                                    )}
                                                                    {isOverdue && (
                                                                        <span className="text-[8px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded animate-pulse">
                                                                            Overdue
                                                                        </span>
                                                                    )}
                                                                    {borrow.fine > 0 && borrow.paymentStatus !== "completed" && (
                                                                        <span className="text-[8px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded">
                                                                            Fine: ₹{borrow.fine.toFixed(2)}
                                                                        </span>
                                                                    )}
                                                                    {borrow.fine > 0 && borrow.paymentStatus === "completed" && (
                                                                        <span className="text-[8px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                                                                            Fine Paid
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                                                    {borrow.fine > 0 && borrow.paymentStatus !== "completed" && !borrow.returnDate && (
                                                                        <button className="text-[10px] bg-black text-white px-2 py-1 rounded hover:bg-gray-800 transition-colors flex items-center">
                                                                            <CreditCard className="w-2.5 h-2.5 mr-1" />
                                                                            Pay Fine
                                                                        </button>
                                                                    )}
                                                                    <div className="flex items-center gap-1 text-[10px] text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded whitespace-nowrap">
                                                                        <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                                                                        <span>
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
                                            <div className="text-center py-6">
                                                <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                                <h3 className="text-sm font-medium text-gray-700">No borrowing history</h3>
                                                <p className="text-gray-500 mt-1 text-xs">You haven't borrowed any books yet.</p>
                                                <p className="text-gray-500 text-xs mt-1">Last updated: {lastSuccessfulUpdate.toLocaleTimeString()}</p>
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
                                >
                                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                                        <h3 className="font-semibold text-gray-700 mb-3 sm:mb-4 md:mb-6 text-sm sm:text-base">Borrowing Analytics</h3>

                                        {/* Mini Analytics Cards */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
                                            <div className="bg-white rounded-lg shadow p-2 sm:p-3 md:p-4 border-l-2 sm:border-l-4 border-blue-500 hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 group relative overflow-hidden">
                                                <div className="flex items-center">
                                                    <div className="p-1.5 sm:p-2 md:p-3 bg-blue-100 rounded-full">
                                                        <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 text-blue-600" />
                                                    </div>
                                                    <div className="ml-2 sm:ml-3 md:ml-4">
                                                        <p className="text-[10px] sm:text-xs font-medium text-gray-600">Books Borrowed</p>
                                                        <p className="text-sm sm:text-base md:text-xl font-bold text-gray-800">
                                                            {totalBorrowed}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Expanded information on hover */}
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent text-white p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-full group-hover:translate-y-0 overflow-hidden">
                                                    <p className="text-[8px]">
                                                        Total books borrowed
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="bg-white rounded-lg shadow p-2 sm:p-3 md:p-4 border-l-2 sm:border-l-4 border-green-500 hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 group relative overflow-hidden">
                                                <div className="flex items-center">
                                                    <div className="p-1.5 sm:p-2 md:p-3 bg-green-100 rounded-full">
                                                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 text-green-600" />
                                                    </div>
                                                    <div className="ml-2 sm:ml-3 md:ml-4">
                                                        <p className="text-[10px] sm:text-xs font-medium text-gray-600">Books Returned</p>
                                                        <p className="text-sm sm:text-base md:text-xl font-bold text-gray-800">
                                                            {returnedBooks}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Expanded information on hover */}
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent text-white p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-full group-hover:translate-y-0 overflow-hidden">
                                                    <p className="text-[8px]">
                                                        Books successfully returned
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="bg-white rounded-lg shadow p-2 sm:p-3 md:p-4 border-l-2 sm:border-l-4 border-orange-500 hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 group relative overflow-hidden">
                                                <div className="flex items-center">
                                                    <div className="p-1.5 sm:p-2 md:p-3 bg-orange-100 rounded-full">
                                                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 text-orange-600" />
                                                    </div>
                                                    <div className="ml-2 sm:ml-3 md:ml-4">
                                                        <p className="text-[10px] sm:text-xs font-medium text-gray-600">Active Loans</p>
                                                        <p className="text-sm sm:text-base md:text-xl font-bold text-gray-800">
                                                            {activeLoans}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Expanded information on hover */}
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent text-white p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-full group-hover:translate-y-0 overflow-hidden">
                                                    <p className="text-[8px]">
                                                        Currently active loans
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="bg-white rounded-lg shadow p-2 sm:p-3 md:p-4 border-l-2 sm:border-l-4 border-red-500 hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 group relative overflow-hidden">
                                                <div className="flex items-center">
                                                    <div className="p-1.5 sm:p-2 md:p-3 bg-red-100 rounded-full">
                                                        <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 text-red-600" />
                                                    </div>
                                                    <div className="ml-2 sm:ml-3 md:ml-4">
                                                        <p className="text-[10px] sm:text-xs font-medium text-gray-600">Overdue Books</p>
                                                        <p className="text-sm sm:text-base md:text-xl font-bold text-gray-800">
                                                            {overdueBooks}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Expanded information on hover */}
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent text-white p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-full group-hover:translate-y-0 overflow-hidden">
                                                    <p className="text-[8px]">
                                                        Overdue book count
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="bg-white rounded-lg shadow p-2 sm:p-3 md:p-4 border-l-2 sm:border-l-4 border-purple-500 hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 group relative overflow-hidden">
                                                <div className="flex items-center">
                                                    <div className="p-1.5 sm:p-2 md:p-3 bg-purple-100 rounded-full">
                                                        <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 text-purple-600" />
                                                    </div>
                                                    <div className="ml-2 sm:ml-3 md:ml-4">
                                                        <p className="text-[10px] sm:text-xs font-medium text-gray-600">Unpaid Fines</p>
                                                        <p className="text-sm sm:text-base md:text-xl font-bold text-gray-800">
                                                            ₹{unpaidFineAmount.toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Expanded information on hover */}
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent text-white p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-full group-hover:translate-y-0 overflow-hidden">
                                                    <p className="text-[8px]">
                                                        Pending fine payments
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Bars */}
                                        <div className="space-y-3 sm:space-y-4 md:space-y-5">
                                            <div>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-gray-600">Return Rate</span>
                                                    <span className="font-medium">
                                                        {totalBorrowed > 0 ? `${Math.round((returnedBooks / totalBorrowed) * 100)}%` : "0%"}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                                                    <div
                                                        className="bg-black h-1.5 sm:h-2 rounded-full"
                                                        style={{ width: `${totalBorrowed > 0 ? (returnedBooks / totalBorrowed) * 100 : 0}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-gray-600">Overdue Rate</span>
                                                    <span className="font-medium">
                                                        {activeLoans > 0 ? `${Math.round((overdueBooks / activeLoans) * 100)}%` : "0%"}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                                                    <div
                                                        className="bg-black h-1.5 sm:h-2 rounded-full"
                                                        style={{ width: `${activeLoans > 0 ? (overdueBooks / activeLoans) * 100 : 0}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-gray-600">Fine Payment Rate</span>
                                                    <span className="font-medium">
                                                        {totalFines > 0
                                                            ? `${Math.round(((totalFines - unpaidFineAmount) / totalFines) * 100)}%`
                                                            : "100%"}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                                                    <div
                                                        className="bg-black h-1.5 sm:h-2 rounded-full"
                                                        style={{
                                                            width: `${totalFines > 0
                                                                ? Math.round(((totalFines - unpaidFineAmount) / totalFines) * 100)
                                                                : 100}%`
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Fine Summary */}
                                        <div className="mt-4 sm:mt-5 md:mt-6 p-2 sm:p-3 bg-white rounded-lg shadow">
                                            <h4 className="font-semibold text-gray-700 mb-2 sm:mb-3 text-sm">Fine Summary</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                                                <div className="bg-gray-50 p-2 rounded">
                                                    <p className="text-[10px] sm:text-xs text-gray-600">Total Fines</p>
                                                    <p className="text-sm sm:text-base font-bold text-gray-800">₹{totalFines.toFixed(2)}</p>
                                                </div>
                                                <div className="bg-gray-50 p-2 rounded">
                                                    <p className="text-[10px] sm:text-xs text-gray-600">Paid Fines</p>
                                                    <p className="text-sm sm:text-base font-bold text-gray-800">₹{(totalFines - unpaidFineAmount).toFixed(2)}</p>
                                                </div>
                                                <div className="bg-gray-50 p-2 rounded">
                                                    <p className="text-[10px] sm:text-xs text-gray-600">Unpaid Fines</p>
                                                    <p className="text-sm sm:text-base font-bold text-gray-800">₹{unpaidFineAmount.toFixed(2)}</p>
                                                </div>
                                            </div>

                                            {unpaidFineAmount > 0 ? (
                                                <div className="mt-2 sm:mt-3">
                                                    <button className="w-full flex items-center justify-center gap-1 py-1.5 sm:py-2 bg-black hover:bg-gray-800 text-white rounded-md transition-colors text-xs sm:text-sm">
                                                        <CreditCard className="w-3 h-3 sm:w-4 sm:h-4" />
                                                        <span>Pay All Unpaid Fines (₹{unpaidFineAmount.toFixed(2)})</span>
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-gray-500">
                                                    No unpaid fines to pay (Amount: ₹{unpaidFineAmount.toFixed(2)})
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
};

export default UserProfile;