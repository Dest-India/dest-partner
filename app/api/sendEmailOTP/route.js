import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { to, otp } = body;

    if (!to || !otp) {
      return NextResponse.json(
        { error: "Missing 'to' or 'otp' in request body" },
        { status: 400 }
      );
    }

    // Create transporter using environment variables
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
      connectionTimeout: 10000,  // fail after 10s instead of 120s
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject: "Verification Code for Dest",
      text: `Your Verification code is: ${otp}`,
      html: emailTemplate(otp),
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { success: true, message: "OTP sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending OTP:", error.message);
    console.error("SMTP details — code:", error.code, "| command:", error.command, "| response:", error.response);
    return NextResponse.json(
      { success: false, error: "Failed to send OTP", detail: error.message },
      { status: 500 }
    );
  }
}

const emailTemplate = (otp) => {
  return `<!DOCTYPE html><html lang="en" style="margin:0; padding:0; width:100%; background:#fafafa;"><head><meta charset="utf-8"><meta name="x-apple-disable-message-reformatting"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Verify your email – Dest</title></head><body style="margin:0; padding:0; background:#fafafa; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;"><!-- Preheader (hidden) --><div style="display:none!important; visibility:hidden; opacity:0; color:transparent; height:0; width:0;overflow:hidden; mso-hide:all;">Your Dest verification code: vP300a</div><!-- Full width background --><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"style="border-collapse:collapse; background:#fafafa;"><tr><td align="center" style="padding:12px;"><!-- Container --><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"style="max-width:450px; border-collapse:collapse; background:#FFFFFF; border-radius:20px; overflow:hidden; box-shadow:0 4px 16px rgba(16,24,40,0.06);"><!-- Header --><tr><td align="center" style="padding:28px 24px 12px 24px;"><!-- Logo (optional) --><img src="https://dest.co.in/og-image.png" height="96" alt="Dest" border="0"style="display:block; outline:none; text-decoration:none; border:none; height:96px;"></td></tr><tr><td style="padding:0 28px;"><h1 style="margin:0; font-family:system-ui, -apple-system, Roboto, Roboto, Helvetica, Arial,sans-serif; font-size:20px; line-height:28px; color:#2B7FFF; font-weight:700;letter-spacing:0.2px;">Verify your email to join Dest</h1></td></tr><!-- Hero / Message --><tr><td style="padding:20px 28px;"><p style="margin:0 0 12px 0; font-family:system-ui, -apple-system, Roboto, Roboto, Helvetica, Arial,sans-serif; font-size:15px; line-height:24px; color:#0a0a0a;">Join <strong>Dest</strong> and connectwith thousands of sports enthusiasts looking for<strong>Academies</strong>, <strong>GYMs</strong>,and <strong>Turfs</strong> like yours.</p><p style="margin:0 0 20px 0; font-family:system-ui, -apple-system, Roboto, Roboto, Helvetica, Arial,sans-serif; font-size:15px; line-height:22px; color:#0a0a0a;">Please use the verification codebelow to verify your email.</p><!-- Code block --><table role="presentation" cellpadding="0" cellspacing="0" border="0"style="border-collapse:collapse; width:100%; margin:0 0 16px 0;"><tr><td align="center" style="padding:18px 16px; border-radius:10px;"><div style="font-family:system-ui, -apple-system, Roboto, Roboto, Helvetica, Arial,sans-serif; font-size:28px;line-height:32px; letter-spacing:4px; color:#171717; font-weight:700;">${otp}</div></td></tr></table><p style="font-family:system-ui, -apple-system, Roboto, Roboto, Helvetica, Arial,sans-serif; font-size:12px; line-height:18px; color:#737373;">For your security, this codeexpires in 1:30 minutes and can be used only once. If you didn’t requestthis, you can safelyignore this email.</p></td></tr><!-- Divider --><tr><td style="padding:0 28px;"><hr style="border:0; height:1px; background:#e5e5e5; margin:0;"></td></tr><!-- Footer --><tr><td style="padding:20px 28px;"><p style="margin:0 0 6px 0; font-family:system-ui, -apple-system, Roboto, Roboto, Helvetica, Arial,sans-serif; font-size:15px; line-height:20px; color:#0a0a0a;">Regards,<br><strong>Dest Team</strong></p></td></tr></table><!-- Legal / Address --><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"style="max-width:500px; border-collapse:collapse;"><tr><td align="center" style="padding:16px 28px"><p style="margin:10px 0 0 0; font-family:system-ui, -apple-system, Roboto, Roboto, Helvetica, Arial,sans-serif; font-size:12px; line-height:18px; color:#737373;">You’re receiving this email becauseyou tried to register for Dest Partner. If this wasn’t you, pleaseignore this message.</p></td></tr></table></td></tr></table></body>
</html>`;
};
