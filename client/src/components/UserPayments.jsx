import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserPayments } from "../store/slices/fineSlice";
import { CreditCard, Book, IndianRupee, Calendar, Clock } from "lucide-react";

const UserPayments = () => {
  const dispatch = useDispatch();
  const { userPayments, loading, error } = useSelector((state) => state.fine);

  // Fetch user payments on component mount
  useEffect(() => {
    dispatch(fetchUserPayments());
  }, [dispatch]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate total paid
  const totalPaid = useMemo(() => {
    return userPayments.reduce((sum, payment) => sum + (payment.fine || 0), 0);
  }, [userPayments]);

  if (loading && userPayments.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
        <p className="text-sm text-gray-500 mt-1">View your library fine payment history</p>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Payments</p>
            <p className="text-2xl font-bold text-gray-900">{userPayments.length}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-500">Total Amount Paid</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
          </div>
        </div>
      </div>

      {/* Payments List */}
      {userPayments.length > 0 ? (
        <div className="divide-y divide-gray-200">
          {userPayments.map((payment) => (
            <div key={payment._id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <h4 className="text-sm font-medium text-gray-900">{payment.book?.title || 'Unknown Book'}</h4>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        payment.paymentStatus === "completed" 
                          ? "bg-green-100 text-green-800" 
                          : payment.paymentStatus === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {payment.paymentStatus === "completed" ? "Paid" : payment.paymentStatus || "Unpaid"}
                      </span>
                    </div>
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      <span>{payment.paymentStatus === "completed" ? "Paid on" : "Logged on"} {formatDate(payment.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <IndianRupee className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">{payment.fine?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
          <p className="mt-1 text-sm text-gray-500">
            You haven't made any fine payments yet.
          </p>
        </div>
      )}
    </div>
  );
};

export default UserPayments;