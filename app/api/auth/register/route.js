import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { email, password, otp, generatedOtp } = await request.json();

    // Validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate OTP if provided
    if (generatedOtp && otp !== generatedOtp) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from("partners")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password with bcrypt (10 rounds)
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user
    const { data: newUser, error: createError } = await supabaseAdmin
      .from("partners")
      .insert({ email, password_hash })
      .select()
      .single();

    if (createError) {
      console.error("Error creating user:", createError);
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Remove sensitive data before returning
    const userToReturn = { ...newUser };
    delete userToReturn.password_hash;

    return NextResponse.json(
      { success: true, user: userToReturn },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
