import cron from "node-cron";
import { Borrow } from "../models/borrowModels.js";
import sendEmail from "../utils/sendEmail.js";
import fineCalculator from "../utils/fineCalculator.js";

export const notifyUsers = () => {
  // Schedule cron job every 20 seconds
  cron.schedule("*/20 * * * * *", async () => {
    try {
      const oneDaysAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const overdueBooks = await Borrow.find({
        dueDate: { $lt: new Date() },
        returnDate: null,
      }).populate("user book");

      for (const element of overdueBooks) {
        const { user, book, dueDate } = element;

        // Calculate current fine
        const { fine } = fineCalculator(dueDate, new Date());
        element.fine = fine;
        
        // Mark as pending if fine exists
        if (fine > 0) {
          element.paymentStatus = "pending";
        }

        if (user && user.email && !element.notified) {
          const emailContent = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; max-width: 600px; margin: auto; border-radius: 10px; background-color: #f9fafb; color: #1f2937; border: 1px solid #e5e7eb;">
              <h2 style="font-size: 24px; margin-bottom: 10px; color: #111827;">Hello ${user.name},</h2>
              <p style="font-size: 16px; margin-bottom: 16px;">
                📖 Just a gentle reminder from <strong>LibraFlow Library Management System</strong>:
              </p>
              <p style="font-size: 16px; margin-bottom: 16px;">
                You borrowed the book <strong style="color: #2563eb;">"${book.title}"</strong> and it's time to return it.
              </p>
              <p style="font-size: 16px; margin-bottom: 24px;">
                To avoid further fines and help others enjoy this book too, please return it as soon as possible.
              </p>
              ${fine > 0 ? `
              <div style="background-color: #fef2f2; border: 1px solid #fee2e2; padding: 15px; border-radius: 8px; margin-bottom: 24px;">
                <p style="margin: 0; color: #991b1b; font-weight: 600;">Current Fine: ₹${fine}</p>
                <p style="margin: 5px 0 0 0; font-size: 14px; color: #b91c1c;">Fine increases by ₹25 for each additional day late.</p>
              </div>
              ` : ''}
              <a href="${process.env.FRONTEND_URL}/return" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
                📦 Return Book Now
              </a>
              <p style="font-size: 14px; margin-top: 30px; color: #6b7280;">
                If you’ve already returned the book, please ignore this message. Thank you for being a responsible reader! 😊
              </p>
              <hr style="margin: 30px 0; border-color: #e5e7eb;">
              <p style="font-size: 14px; color: #9ca3af;">Need help? Contact us at <a href="mailto:support@LibraFlow.com" style="color: #2563eb;">support@LibraFlow.com</a></p>
            </div>
          `;

          await sendEmail({
            email: user.email,
            subject: "📚 Book Return Reminder - Action Needed!",
            message: emailContent,
          });

          element.notified = true;
          await element.save();

          console.log(`✅ Notification sent to ${user.email} for book "${book.title}"`);
        }
      }
    } catch (error) {
      console.error("❌ Error while notifying users:", error);
    }
  });
};