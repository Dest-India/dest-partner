import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import nodemailer from "nodemailer";
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { email } = await request.json();

    // Validate input
    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find user by email
    const { data: user, error: userError } = await supabaseAdmin
      .from("partners")
      .select("id, email, name")
      .eq("email", email.trim())
      .eq("disabled", false)
      .single();

    // Always return success to prevent email enumeration
    // Even if user doesn't exist, we return 200 to not leak info
    if (userError || !user) {
      return NextResponse.json(
        {
          success: true,
          message:
            "If an account exists with this email, a reset link will be sent.",
        },
        { status: 200 }
      );
    }

    // Generate secure random token (32 bytes = 64 hex characters)
    const token = crypto.randomBytes(32).toString("hex");

    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Store token in database
    const { error: insertError } = await supabaseAdmin
      .from("password_reset_tokens")
      .insert({
        partner_id: user.id,
        token,
        expires_at: expiresAt.toISOString(),
        used: false,
      });

    if (insertError) {
      console.error("Error creating reset token:", insertError);
      return NextResponse.json(
        { error: "Failed to generate reset token" },
        { status: 500 }
      );
    }

    // Generate reset link
    const resetLink = `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/forgot-password?token=${token}`;

    // Send email with reset link
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || "587"),
        secure:
          process.env.EMAIL_PORT === "465" ||
          parseInt(process.env.EMAIL_PORT) === 465,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email.trim(),
        subject: "Reset Your Dest Password",
        text: `Hi ${
          user.name || "there"
        },\n\nYou requested to reset your password. Click the link below to set a new password:\n\n${resetLink}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\nRegards,\nDest Team`,
        html: emailTemplate(resetLink, user.name),
      };

      await transporter.sendMail(mailOptions);

      console.log("Password reset email sent to:", email.trim());
    } catch (emailError) {
      console.error("Error sending reset email:", emailError);
      // Don't reveal email sending failure to prevent enumeration
      // Continue and return success message
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "If an account exists with this email, a reset link will be sent.",
        // REMOVE THIS IN PRODUCTION - only for development
        debug:
          process.env.NODE_ENV === "development"
            ? { token, resetLink }
            : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Request reset token error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const emailTemplate = (resetLink, userName) => {
  return `<!DOCTYPE html>
<html lang="en" style="margin:0; padding:0; width:100%; background:#fafafa;">
<head>
  <meta charset="utf-8">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Reset Your Password – Dest</title>
</head>
<body style="margin:0; padding:0; background:#fafafa; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
  <!-- Preheader -->
  <div style="display:none!important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; overflow:hidden; mso-hide:all;">
    Reset your Dest password
  </div>
  
  <!-- Full width background -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse; background:#fafafa;">
    <tr>
      <td align="center" style="padding:12px;">
        <!-- Container -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:450px; border-collapse:collapse; background:#FFFFFF; border-radius:20px; overflow:hidden; box-shadow:0 4px 16px rgba(16,24,40,0.06);">
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding:28px 24px 12px 24px;">
              <img src="https://dest.co.in/og-image.png" height="96" alt="Dest" border="0" style="display:block; outline:none; text-decoration:none; border:none; height:96px;">
            </td>
          </tr>
          
          <tr>
            <td style="padding:0 28px;">
              <h1 style="margin:0; font-family:system-ui, -apple-system, Roboto, Helvetica, Arial, sans-serif; font-size:20px; line-height:28px; color:#2B7FFF; font-weight:700; letter-spacing:0.2px;">
                Reset Your Password
              </h1>
            </td>
          </tr>
          
          <!-- Message -->
          <tr>
            <td style="padding:20px 28px;">
              <p style="margin:0 0 12px 0; font-family:system-ui, -apple-system, Roboto, Helvetica, Arial, sans-serif; font-size:15px; line-height:24px; color:#0a0a0a;">
                Hi ${userName || "there"},
              </p>
              <p style="margin:0 0 20px 0; font-family:system-ui, -apple-system, Roboto, Helvetica, Arial, sans-serif; font-size:15px; line-height:22px; color:#0a0a0a;">
                You requested to reset your password for your <strong>Dest</strong> partner account. Click the button below to set a new password.
              </p>
              
              <!-- Reset Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; width:100%; margin:0 0 20px 0;">
                <tr>
                  <td align="center" style="padding:0;">
                    <a href="${resetLink}" style="display:inline-block; padding:14px 32px; background:#2B7FFF; color:#FFFFFF; text-decoration:none; border-radius:8px; font-family:system-ui, -apple-system, Roboto, Helvetica, Arial, sans-serif; font-size:15px; font-weight:600; line-height:20px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin:0 0 12px 0; font-family:system-ui, -apple-system, Roboto, Helvetica, Arial, sans-serif; font-size:13px; line-height:20px; color:#737373;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 20px 0; font-family:system-ui, -apple-system, Roboto, Helvetica, Arial, sans-serif; font-size:12px; line-height:18px; color:#2B7FFF; word-break:break-all;">
                ${resetLink}
              </p>
              
              <p style="font-family:system-ui, -apple-system, Roboto, Helvetica, Arial, sans-serif; font-size:12px; line-height:18px; color:#737373;">
                For your security, this link expires in <strong>1 hour</strong> and can be used only once. If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding:0 28px;">
              <hr style="border:0; height:1px; background:#e5e5e5; margin:0;">
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding:20px 28px;">
              <p style="margin:0 0 6px 0; font-family:system-ui, -apple-system, Roboto, Helvetica, Arial, sans-serif; font-size:15px; line-height:20px; color:#0a0a0a;">
                Regards,<br><strong>Dest Team</strong>
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Legal -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:500px; border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:16px 28px">
              <p style="margin:10px 0 0 0; font-family:system-ui, -apple-system, Roboto, Helvetica, Arial, sans-serif; font-size:12px; line-height:18px; color:#737373;">
                You're receiving this email because a password reset was requested for your Dest Partner account. If this wasn't you, please ignore this message.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
