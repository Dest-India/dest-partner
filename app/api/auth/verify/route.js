import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { userId, email } = await request.json();

    // Validate inputs
    if (!userId || !email) {
      return NextResponse.json(
        { error: "User ID and email are required" },
        { status: 400 }
      );
    }

    // Fetch user by ID and email
    const { data: user, error: fetchError } = await supabaseAdmin
      .from("partners")
      .select("*")
      .eq("id", userId)
      .eq("email", email)
      .single();

    // Handle user not found
    if (fetchError || !user) {
      return NextResponse.json(
        { success: false, error: "User does not exist", code: 404 },
        { status: 404 }
      );
    }

    // Check if account is disabled
    if (user.disabled) {
      return NextResponse.json(
        { success: false, error: "Account deleted", code: 404 },
        { status: 403 }
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
    console.error("Verify error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
