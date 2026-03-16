import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { Borrow } from "../models/borrowModels.js";
import { User } from "../models/userModels.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import mongoose from "mongoose";

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_JTA2gns76PnMtx",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "your_razorpay_key_secret",
});

/**
 * Create Razorpay order
 * POST /create-order
 */
export const createOrder = catchAsyncErrors(async (req, res, next) => {
  const { borrowId, amount } = req.body;
  const userId = req.user._id;

  if (!borrowId || !amount) {
    return next(new ErrorHandler("Borrow ID and amount are required", 400));
  }

  // Validate borrow record
  const borrowRecord = await Borrow.findById(borrowId);
  if (!borrowRecord) {
    return next(new ErrorHandler("Borrow record not found", 404));
  }

  // Check if user owns this borrow record
  if (borrowRecord.user.toString() !== userId.toString()) {
    return next(new ErrorHandler("You are not authorized to pay for this record", 403));
  }

  // Check if fine amount matches
  if (Math.abs(borrowRecord.fine - amount) > 0.01) {
    return next(new ErrorHandler("Fine amount mismatch", 400));
  }

  // Check if payment already exists for this borrow record
  if (borrowRecord.paymentStatus === "completed") {
    return next(new ErrorHandler("Payment already made for this record", 400));
  }

  // Create Razorpay order
  const options = {
    amount: Math.round(amount * 100), // Convert to paise
    currency: "INR",
    receipt: `receipt_order_${borrowId}_${Date.now()}`,
  };

  const order = await razorpay.orders.create(options);

  res.status(200).json({
    success: true,
    order,
    message: "Order created successfully",
  });
});

/**
 * Verify Razorpay payment
 * POST /verify-payment
 */
export const verifyPayment = catchAsyncErrors(async (req, res, next) => {
  const { 
    razorpay_order_id, 
    razorpay_payment_id, 
    razorpay_signature
  } = req.body;

  // Verify signature
  const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "your_razorpay_key_secret");
  shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = shasum.digest("hex");

  if (digest !== razorpay_signature) {
    return next(new ErrorHandler("Payment verification failed", 400));
  }

  // Find the borrow record by order ID
  const borrowRecord = await Borrow.findOne({ razorpayOrderId: razorpay_order_id });
  if (!borrowRecord) {
    return next(new ErrorHandler("Borrow record not found", 404));
  }

  // Update borrow record with payment details
  borrowRecord.razorpayPaymentId = razorpay_payment_id;
  borrowRecord.paymentStatus = "completed";
  borrowRecord.razorpayOrderId = undefined; // Clear temporary order ID
  await borrowRecord.save();

  // Update user's payment history
  const user = await User.findById(borrowRecord.user);
  if (user) {
    if (!Array.isArray(user.payments)) user.payments = [];
    
    user.payments.push({
      paymentId: razorpay_payment_id,
      borrowRecord: borrowRecord._id,
      amount: borrowRecord.fine,
      status: "completed",
      paidAt: new Date(),
    });
    
    await user.save();
  }

  res.status(200).json({
    success: true,
    message: "Payment verified successfully",
    payment: {
      _id: razorpay_payment_id,
      user: borrowRecord.user,
      borrowRecord: borrowRecord._id,
      amount: borrowRecord.fine,
      status: "completed",
      createdAt: new Date(),
    }
  });
});

/**
 * Get user's payment history
 * GET /my-payments
 */
export const getUserPayments = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user._id;

  const payments = await Borrow.find({ 
    user: userId, 
    fine: { $gt: 0 } 
  })
  .populate("book")
  .select("razorpayPaymentId fine paymentStatus createdAt book")
  .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    payments,
  });
});

/**
 * Get all payments (admin only)
 * GET /all-payments
 */
export const getAllPayments = catchAsyncErrors(async (req, res, next) => {
  const payments = await Borrow.find({ 
    fine: { $gt: 0 } 
  })
  .populate("book user")
  .select("razorpayPaymentId fine paymentStatus createdAt book user")
  .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    payments,
  });
});