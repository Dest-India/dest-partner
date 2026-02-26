import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { token, newPassword } = await request.json();

    // Validate inputs
    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Token and new password are required" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Find valid reset token
    const { data: resetToken, error: tokenError } = await supabaseAdmin
      .from("password_reset_tokens")
      .select("id, partner_id, expires_at, used")
      .eq("token", token)
      .single();

    // Token not found
    if (tokenError || !resetToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 401 }
      );
    }

    // Check if token is already used
    if (resetToken.used) {
      return NextResponse.json(
        { error: "Reset token has already been used" },
        { status: 401 }
      );
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(resetToken.expires_at);
    if (now > expiresAt) {
      return NextResponse.json(
        { error: "Reset token has expired" },
        { status: 401 }
      );
    }

    // Hash new password with bcrypt (10 rounds)
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    // Update user password
    const { error: updateError } = await supabaseAdmin
      .from("partners")
      .update({ password_hash })
      .eq("id", resetToken.partner_id);

    if (updateError) {
      console.error("Error updating password:", updateError);
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 }
      );
    }

    // Mark token as used
    await supabaseAdmin
      .from("password_reset_tokens")
      .update({ used: true })
      .eq("id", resetToken.id);

    return NextResponse.json(
      { success: true, message: "Password updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
