import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { email, password, userId } = await request.json();

    // Validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Build query based on whether userId is provided
    let query = supabaseAdmin.from("partners").select("*").eq("email", email);

    if (userId) {
      query = query.eq("id", userId);
    }

    const { data: user, error: fetchError } = await query.single();

    // Handle user not found
    if (fetchError || !user) {
      return NextResponse.json(
        { error: "Invalid email or password", code: 404 },
        { status: 401 }
      );
    }

    // Check if account is disabled
    if (user.disabled) {
      return NextResponse.json(
        { error: "Account deleted", code: 404 },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Remove sensitive data before returning
    const userToReturn = { ...user };
    delete userToReturn.password_hash;

    return NextResponse.json(
      { success: true, user: userToReturn },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
