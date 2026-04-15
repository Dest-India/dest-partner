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

    // ── Duplicate-account checks ──────────────────────────────────────────
    // 1. Registry check (fast path — catches cross-account collisions too)
    const { data: registry } = await supabaseAdmin
      .from("account_registry")
      .select("has_partner_account")
      .eq("email", email)
      .maybeSingle();

    if (registry?.has_partner_account) {
      return NextResponse.json(
        { error: "A partner account with this email already exists. Please log in." },
        { status: 409 }
      );
    }

    // 2. Direct partners table fallback (handles rows predating the registry)
    const { data: existingPartner } = await supabaseAdmin
      .from("partners")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingPartner) {
      return NextResponse.json(
        { error: "A partner account with this email already exists. Please log in." },
        { status: 409 }
      );
    }

    // Hash password with bcrypt (10 rounds)
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create partner
    const { data: newUser, error: createError } = await supabaseAdmin
      .from("partners")
      .insert({ email, password_hash })
      .select()
      .single();

    if (createError) {
      console.error("Error creating partner:", createError);
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      );
    }

    // ── Update account registry ───────────────────────────────────────────
    await supabaseAdmin.from("account_registry").upsert(
      {
        email,
        has_partner_account: true,
        partner_id:          newUser.id,
      },
      { onConflict: "email" },
    );

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
