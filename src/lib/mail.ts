import nodemailer from "nodemailer";

// Configure transport options based on your provider
// defaulting to Gmail for this example (requires App Password)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export async function sendResolutionEmail(to: string, complaintId: string, title: string) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("⚠️ Email credentials missing in .env.local (EMAIL_USER, EMAIL_PASS). Skipping email.");
        return;
    }

    // Basic validation to check if 'to' looks like an email address
    if (!to || !to.includes("@")) {
        console.log(`ℹ️ User identifier '${to}' is not an email. Skipping notification.`);
        return;
    }

    const mailOptions = {
        from: `"CivicPulse" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: `✅ Resolved: Your Complaint #${complaintId}`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #10b981;">Complaint Resolved</h2>
                <p>Hello,</p>
                <p>Good news! Your complaint regarding <strong>"${title}"</strong> (ID: ${complaintId}) has been successfully resolved.</p>
                <p>You can view the details and leave feedback here:</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/complaint/${complaintId}" 
                   style="display: inline-block; padding: 10px 20px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
                   View Complaint
                </a>
                <p style="margin-top: 20px; font-size: 0.9em; color: #666;">Thank you for helping make our city better!</p>
                <p style="font-size: 0.8em; color: #999;">- Team CivicPulse</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 Resolution email sent to ${to} for complaint ${complaintId}`);
    } catch (error) {
        console.error("❌ Error sending email:", error);
    }
}
