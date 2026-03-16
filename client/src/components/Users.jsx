import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import Header from "../layout/Header";
import UserDetailsCard from "./UserDetailsCard";
import { User, Mail, Shield, BookOpen, Calendar, Search, CreditCard } from "lucide-react";
import { fetchAllBorrowedBooks } from "../store/slices/borrowSlice";
import { toast } from "react-toastify";

const Users = () => {
  const { users } = useSelector((state) => state.user);
  const { allBorrowedBooks, fetchLoading } = useSelector((state) => state.borrow);
  const dispatch = useDispatch();
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Trigger animations when component mounts
  useEffect(() => {
    setIsVisible(true);
    return () => setIsVisible(false);
  }, []);

  // Fetch all borrowed books data
  useEffect(() => {
    dispatch(fetchAllBorrowedBooks());
  }, [dispatch]);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const formattedDate = `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}/${date.getFullYear()}`;
    const formattedTime = `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()
    ).padStart(2, "0")}`;
    const result = `${formattedDate} ${formattedTime}`;
    return result;
  };

  // Function to get borrowed books for a user
  const getBorrowedBooksForUser = (user) => {
    // Filter all borrowed books by user email
    if (allBorrowedBooks && user.email) {
      return allBorrowedBooks.filter(book => 
        (book.user?.email === user.email) || (book.email === user.email)
      );
    }
    // Fallback to user.BorrowBooks if available
    if (user.BorrowBooks) {
      return user.BorrowBooks;
    }
    // Return empty array if no data
    return [];
  };

  // Function to get active loans for a user
  const getActiveLoans = (user) => {
    const borrowedBooks = getBorrowedBooksForUser(user);
    return borrowedBooks.filter(book => !book.returnDate).length;
  };

  // Function to get overdue books for a user
  const getOverdueBooks = (user) => {
    const borrowedBooks = getBorrowedBooksForUser(user);
    const now = new Date();
    return borrowedBooks.filter(book => !book.returnDate && book.dueDate && new Date(book.dueDate) < now).length;
  };

  // Function to get total borrowed books for a user
  const getTotalBorrowed = (user) => {
    const borrowedBooks = getBorrowedBooksForUser(user);
    return borrowedBooks.length;
  };

  // Function to get total fines for a user
  const getTotalFines = (user) => {
    const borrowedBooks = getBorrowedBooksForUser(user);
    return borrowedBooks.reduce((sum, book) => sum + (book.fine || 0), 0);
  };

  // Function to get unpaid fines for a user
  const getUnpaidFines = (user) => {
    const borrowedBooks = getBorrowedBooksForUser(user);
    return borrowedBooks.filter(book => book.fine > 0 && book.paymentStatus !== "completed").length;
  };

  // Filter users by role and search term
  const filteredUsers = useMemo(() => {
    let result = users?.filter(user => 
      user.role === "User" && 
      (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || [];
    
    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortConfig.key) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'email':
            aValue = a.email.toLowerCase();
            bValue = b.email.toLowerCase();
            break;
          case 'borrowed':
            aValue = getActiveLoans(a);
            bValue = getActiveLoans(b);
            break;
          case 'fines':
            aValue = getTotalFines(a);
            bValue = getTotalFines(b);
            break;
          case 'joined':
            aValue = new Date(a.createdAt);
            bValue = new Date(b.createdAt);
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
  }, [users, searchTerm, sortConfig]);

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

  // Calculate statistics
  const totalUsers = users?.filter(u => u.role === "User").length || 0;
  const activeBorrowers = users?.filter(u => u.role === "User" && u.BorrowBooks?.length > 0).length || 0;
  const overdueBooksCount = users?.reduce((count, user) => 
    count + (getBorrowedBooksForUser(user).filter(b => !b.returnDate && b.dueDate && new Date(b.dueDate) < new Date()).length || 0), 0) || 0;
  const verifiedUsers = users?.filter(u => u.role === "User" && u.accountVerified).length || 0;
  const totalFines = users?.reduce((sum, user) => 
    sum + (getBorrowedBooksForUser(user).reduce((bookSum, book) => bookSum + (book.fine || 0), 0) || 0), 0) || 0;

  // Stats card data
  const statsData = [
    { 
      id: 1, 
      title: "Total Users", 
      value: totalUsers, 
      icon: User, 
      color: "blue", 
      borderClass: "border-blue-500",
      bgClass: "bg-blue-100",
      textClass: "text-blue-600"
    },
    { 
      id: 2, 
      title: "Active Borrowers", 
      value: activeBorrowers, 
      icon: BookOpen, 
      color: "green", 
      borderClass: "border-green-500",
      bgClass: "bg-green-100",
      textClass: "text-green-600"
    },
    { 
      id: 3, 
      title: "Overdue Books", 
      value: overdueBooksCount, 
      icon: Calendar, 
      color: "orange", 
      borderClass: "border-orange-500",
      bgClass: "bg-orange-100",
      textClass: "text-orange-600"
    },
    { 
      id: 4, 
      title: "Verified Users", 
      value: verifiedUsers, 
      icon: Shield, 
      color: "purple", 
      borderClass: "border-purple-500",
      bgClass: "bg-purple-100",
      textClass: "text-purple-600"
    },
    { 
      id: 5, 
      title: "Total Fines", 
      value: `₹${totalFines.toFixed(2)}`, 
      icon: CreditCard, 
      color: "red", 
      borderClass: "border-red-500",
      bgClass: "bg-red-100",
      textClass: "text-red-600"
    }
  ];

  return (
    <>
      <main className="relative flex-1 p-2 sm:p-4 md:p-6 pt-16 sm:pt-20 md:pt-24">
        <Header />
        
        {/* Sub Header */}
        <div className={`flex flex-col gap-3 md:flex-row md:justify-between md:items-center mb-3 sm:mb-4 md:mb-6 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <h2 className="text-base sm:text-lg md:text-2xl font-medium text-[#3D3E3E]">
            Registered Users
          </h2>
          
          {/* Search Bar */}
          <div className="relative w-full sm:w-64 md:w-80">
            <input
              type="text"
              placeholder="Search users..."
              className="pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full transition-all duration-300 hover:shadow-md text-xs sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search users by name or email"
            />
            <Search
              className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-2.5 sm:left-3 top-2 sm:top-2.5"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4 mb-3 sm:mb-4 md:mb-6">
          {statsData.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div 
                key={stat.id}
                className={`bg-white rounded-lg shadow p-2 sm:p-3 md:p-4 border-l-4 ${stat.borderClass} hover:shadow-md transition-all duration-300 cursor-pointer transform hover:-translate-y-0.5 sm:hover:-translate-y-1 hover:scale-105 group relative overflow-hidden`}
                style={{ 
                  transitionDelay: `${index * 50}ms`,
                  transitionProperty: 'transform, box-shadow',
                  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <div className="flex items-center">
                  <div className={`p-1.5 sm:p-2 md:p-3 ${stat.bgClass} rounded-full`}>
                    <IconComponent className={`w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 ${stat.textClass}`} />
                  </div>
                  <div className="ml-2 sm:ml-3">
                    <p className="text-[10px] sm:text-xs font-medium text-gray-600">{stat.title}</p>
                    <p className="text-base sm:text-xl md:text-2xl font-semibold text-[#3D3E3E] animate-pulse">
                      {stat.value}
                    </p>
                  </div>
                </div>
                
                {/* Expanded information on hover - hidden by default, no scrollbars */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-800 to-transparent text-white p-1.5 sm:p-2 md:p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-full group-hover:translate-y-0 overflow-hidden">
                  <p className="text-[8px] sm:text-[10px] md:text-xs whitespace-nowrap overflow-hidden text-ellipsis">
                    {stat.id === 1 && "Total number of registered users in the system"}
                    {stat.id === 2 && "Users who currently have borrowed books"}
                    {stat.id === 3 && "Books that are past their due date"}
                    {stat.id === 4 && "Users who have verified their accounts"}
                    {stat.id === 5 && "Total unpaid fines across all users"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Users Grid with Sorting */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {filteredUsers.length > 0 ? (
            <>
              {/* Sortable Table Header for larger screens */}
              <div className="hidden md:grid grid-cols-12 gap-2 p-2 sm:p-3 bg-gray-100 text-[10px] sm:text-xs font-medium text-gray-600 border-b">
                <div 
                  className="col-span-3 flex items-center cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort('name')}
                >
                  <span>User Name</span>
                  {getSortIndicator('name') && (
                    <span className="ml-1">{getSortIndicator('name')}</span>
                  )}
                </div>
                <div 
                  className="col-span-3 flex items-center cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort('email')}
                >
                  <span>Email</span>
                  {getSortIndicator('email') && (
                    <span className="ml-1">{getSortIndicator('email')}</span>
                  )}
                </div>
                <div 
                  className="col-span-2 flex items-center cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort('borrowed')}
                >
                  <span>Active Loans</span>
                  {getSortIndicator('borrowed') && (
                    <span className="ml-1">{getSortIndicator('borrowed')}</span>
                  )}
                </div>
                <div 
                  className="col-span-2 flex items-center cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort('fines')}
                >
                  <span>Total Fines</span>
                  {getSortIndicator('fines') && (
                    <span className="ml-1">{getSortIndicator('fines')}</span>
                  )}
                </div>
                <div 
                  className="col-span-2 flex items-center cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort('joined')}
                >
                  <span>Joined</span>
                  {getSortIndicator('joined') && (
                    <span className="ml-1">{getSortIndicator('joined')}</span>
                  )}
                </div>
              </div>
              
              {/* Users List - Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 p-2 sm:p-4 md:p-6">
                {filteredUsers.map((user, index) => (
                  <div
                    key={user._id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 transform hover:-translate-y-0.5 sm:hover:-translate-y-1"
                    onClick={() => setSelectedUser(user)}
                    style={{
                      animation: 'fadeInUp 0.5s ease-out forwards',
                      animationDelay: `${index * 30}ms`,
                      opacity: 0,
                    }}
                  >
                    <div className="p-3 sm:p-4 md:p-5">
                      <div className="flex items-center">
                        <div className="bg-gradient-to-br from-[#151619] to-[#3D3E3E] rounded-lg w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-md">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-2 sm:ml-3 md:ml-4">
                          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-[#3D3E3E] truncate max-w-[120px] sm:max-w-[160px] md:max-w-none">{user.name}</h3>
                          <p className="text-[10px] sm:text-xs text-gray-600 flex items-center gap-1">
                            <Mail className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
                            <span className="truncate max-w-[100px] sm:max-w-[140px]">{user.email}</span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-2 sm:mt-3 flex flex-wrap gap-1">
                        <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[8px] sm:text-[10px] md:text-xs font-medium ${
                          user.accountVerified 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {user.accountVerified ? "Verified" : "Pending"}
                        </span>
                        <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[8px] sm:text-[10px] md:text-xs font-medium bg-blue-100 text-blue-800">
                          {user.role}
                        </span>
                        {getUnpaidFines(user) > 0 && (
                          <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[8px] sm:text-[10px] md:text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                            {getUnpaidFines(user)} Unpaid Fine{getUnpaidFines(user) > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      
                      {/* Stats Grid - Responsive */}
                      <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-1.5 sm:gap-2 md:gap-3">
                        <div className="bg-gradient-to-br from-blue-50 to-white p-1.5 sm:p-2 md:p-3 rounded-lg border border-blue-100 transition-all duration-300 hover:shadow-sm">
                          <p className="text-[8px] sm:text-[10px] text-gray-500 font-medium">Books Borrowed</p>
                          <p className="font-bold text-[#3D3E3E] text-sm sm:text-base">{getTotalBorrowed(user)}</p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-white p-1.5 sm:p-2 md:p-3 rounded-lg border border-orange-100 transition-all duration-300 hover:shadow-sm">
                          <p className="text-[8px] sm:text-[10px] text-gray-500 font-medium">Overdue Books</p>
                          <p className="font-bold text-[#3D3E3E] text-sm sm:text-base">
                            {getOverdueBooks(user)}
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-white p-1.5 sm:p-2 md:p-3 rounded-lg border border-green-100 transition-all duration-300 hover:shadow-sm">
                          <p className="text-[8px] sm:text-[10px] text-gray-500 font-medium">Active Loans</p>
                          <p className="font-bold text-[#3D3E3E] text-sm sm:text-base">
                            {getActiveLoans(user)}
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-white p-1.5 sm:p-2 md:p-3 rounded-lg border border-purple-100 transition-all duration-300 hover:shadow-sm">
                          <p className="text-[8px] sm:text-[10px] text-gray-500 font-medium">Total Fines</p>
                          <p className="font-bold text-[#3D3E3E] text-sm sm:text-base">
                            ₹{getTotalFines(user).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Quick Action Button */}
                      <div className="mt-2 sm:mt-3 md:mt-4">
                        <button 
                          className="w-full py-1.5 sm:py-2 bg-[#3D3E3E] text-white rounded-lg text-[10px] sm:text-xs md:text-sm font-medium hover:bg-[#151619] transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(user);
                          }}
                        >
                          View Details
                        </button>
                      </div>
                      
                      <div className="mt-2 sm:mt-3 text-[8px] sm:text-[10px] md:text-xs text-gray-500 flex items-center">
                        <Calendar className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 mr-1" />
                        <span className="truncate">Registered: {formatDate(user.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-6 sm:py-8 md:py-12">
              <div className="inline-block animate-bounce">
                <User className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-2 sm:mb-3 md:mb-4" />
              </div>
              <h3 className="text-sm sm:text-base md:text-lg font-medium text-gray-700">
                {searchTerm ? "No users found" : "No registered users found"}
              </h3>
              <p className="text-gray-500 mt-1 text-xs sm:text-sm md:text-base">
                {searchTerm 
                  ? "Try adjusting your search terms" 
                  : "There are currently no users registered in the library"}
              </p>
            </div>
          )}
        </div>

        {/* User Details Card Modal */}
        {selectedUser && (
          <UserDetailsCard 
            user={selectedUser} 
            onClose={() => setSelectedUser(null)} 
          />
        )}
      </main>

      {/* Custom CSS Animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        
        @media (max-width: 640px) {
          .grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        
        @media (max-width: 480px) {
          .grid-cols-2 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
};

export default Users;