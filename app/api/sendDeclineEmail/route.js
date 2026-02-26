import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { to, userName, courtName, turfName, sport, date, startTime, endTime, reason } = body;

    if (!to || !reason) {
      return NextResponse.json(
        { error: "Missing required fields in request body" },
        { status: 400 }
      );
    }

    // Create transporter using environment variables
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_PORT === "465",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Format date and time for display
    const formatTime12Hour = (time24) => {
      if (!time24) return '';
      const [hours, minutes] = time24.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    };

    const formattedDate = new Date(date).toLocaleDateString('en-IN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const formattedStartTime = formatTime12Hour(startTime);
    const formattedEndTime = formatTime12Hour(endTime);

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject: "Booking Cancellation - Dest",
      text: `Dear ${userName || 'User'},\n\nYour booking has been declined.\n\nBooking Details:\nCourt: ${courtName} (${sport})\nTurf: ${turfName}\nDate: ${formattedDate}\nTime: ${formattedStartTime} - ${formattedEndTime}\n\nReason: ${reason}\n\nWe apologize for any inconvenience.\n\nRegards,\nDest Team`,
      html: emailTemplate({
        userName,
        courtName,
        turfName,
        sport,
        formattedDate,
        formattedStartTime,
        formattedEndTime,
        reason
      }),
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { success: true, message: "Decline email sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending decline email:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send decline email" },
      { status: 500 }
    );
  }
}

const emailTemplate = ({ userName, courtName, turfName, sport, formattedDate, formattedStartTime, formattedEndTime, reason }) => {
  return `<!DOCTYPE html><html lang="en" style="margin:0; padding:0; width:100%;"><head><meta charset="utf-8"><meta name="x-apple-disable-message-reformatting"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Booking Cancellation – Dest</title></head><body style="margin:0; padding:0; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;"><!-- Preheader (hidden) --><div style="display:none!important; visibility:hidden; opacity:0; color:transparent; height:0; width:0;overflow:hidden; mso-hide:all;">Your booking has been declined</div><!-- Full width background --><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"style="border-collapse:collapse;"><tr><td align="center"><!-- Container --><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"style="max-width:450px; border-collapse:collapse; background:#FFFFFF; border-radius:20px; overflow:hidden; box-shadow:0 4px 16px rgba(16,24,40,0.06);"><!-- Header --><tr><td align="center" style="padding:24px 20px 8px 20px;"><!-- Logo --><img src="https://dest.co.in/og-image.png" height="96" alt="Dest" border="0"style="display:block; outline:none; text-decoration:none; border:none; height:96px;"></td></tr><tr><td style="padding:0 24px;"><h1 style="margin:0; font-family:system-ui, -apple-system, Roboto, Helvetica, Arial,sans-serif; font-size:20px; line-height:28px; color:#dc2626; font-weight:700;letter-spacing:0.2px;">Booking Declined</h1></td></tr><!-- Message --><tr><td style="padding:16px 24px;"><p style="margin:0 0 12px 0; font-family:system-ui, -apple-system, Roboto, Helvetica, Arial,sans-serif; font-size:15px; line-height:24px; color:#0a0a0a;">Dear <strong>${userName || 'User'}</strong>,</p><p style="margin:0 0 20px 0; font-family:system-ui, -apple-system, Roboto, Helvetica, Arial,sans-serif; font-size:15px; line-height:22px; color:#0a0a0a;">We regret to inform you that your booking has been declined.</p><!-- Booking Details --><table role="presentation" cellpadding="0" cellspacing="0" border="0"style="border-collapse:collapse; width:100%; margin:0 0 16px 0; background:#f5f5f5; border-radius:10px;"><tr><td style="padding:14px 12px;"><div style="font-family:system-ui, -apple-system, Roboto, Helvetica, Arial,sans-serif;"><p style="margin:0 0 8px 0; font-size:13px; color:#737373; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Booking Details</p><p style="margin:0 0 6px 0; font-size:15px; color:#0a0a0a;"><strong>Court:</strong> ${courtName || 'N/A'}${sport ? ` (${sport})` : ''}</p>${turfName ? `<p style="margin:0 0 6px 0; font-size:15px; color:#0a0a0a;"><strong>Turf:</strong> ${turfName}</p>` : ''}<p style="margin:0 0 6px 0; font-size:15px; color:#0a0a0a;"><strong>Date:</strong> ${formattedDate}</p><p style="margin:0; font-size:15px; color:#0a0a0a;"><strong>Time:</strong> ${formattedStartTime} - ${formattedEndTime}</p></div></td></tr></table><!-- Reason Box --><table role="presentation" cellpadding="0" cellspacing="0" border="0"style="border-collapse:collapse; width:100%; margin:0 0 16px 0; background:#fef2f2; border-left:4px solid #dc2626; border-radius:6px;"><tr><td style="padding:12px;"><p style="margin:0 0 6px 0; font-family:system-ui, -apple-system, Roboto, Helvetica, Arial,sans-serif; font-size:13px; color:#991b1b; font-weight:600;">Reason for Cancellation:</p><p style="margin:0; font-family:system-ui, -apple-system, Roboto, Helvetica, Arial,sans-serif; font-size:14px; line-height:20px; color:#0a0a0a;">${reason}</p></td></tr></table><p style="font-family:system-ui, -apple-system, Roboto, Helvetica, Arial,sans-serif; font-size:14px; line-height:20px; color:#0a0a0a;">We apologize for any inconvenience this may have caused. Please feel free to make another booking or contact us if you have any questions.</p></td></tr><!-- Divider --><tr><td style="padding:0 28px;"><hr style="border:0; height:1px; background:#e5e5e5; margin:0;"></td></tr><!-- Footer --><tr><td style="padding:16px 24px;"><p style="margin:0 0 6px 0; font-family:system-ui, -apple-system, Roboto, Helvetica, Arial,sans-serif; font-size:15px; line-height:20px; color:#0a0a0a;">Regards,<br><strong>Dest Team</strong></p></td></tr></table><!-- Legal / Address --><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"style="max-width:500px; border-collapse:collapse;"><tr><td align="center" style="padding:12px 24px"><p style="margin:10px 0 0 0; font-family:system-ui, -apple-system, Roboto, Helvetica, Arial,sans-serif; font-size:12px; line-height:18px; color:#737373;">You're receiving this email because you made a booking on Dest. If you have any questions, please contact support.</p></td></tr></table></td></tr></table></body></html>`;
};
