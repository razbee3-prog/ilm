import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

async function sendEmailAlert(email: string) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const alertEmail = process.env.WAITLIST_ALERT_EMAIL;

  if (!resendApiKey || !alertEmail) {
    console.warn("Resend or alert email not configured");
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "noreply@ilm.app",
        to: alertEmail,
        subject: "new registration",
        html: `<p>New waitlist signup:</p><p><strong>${email}</strong></p>`,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Failed to send email alert:", error);
    }
  } catch (error) {
    console.error("Error sending email alert:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email required" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("waitlist")
      .insert([{ email }])
      .select();

    if (error) {
      // Check if it's a unique constraint violation
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Email already registered", alreadyExists: true },
          { status: 400 }
        );
      }
      throw error;
    }

    // Send email alert asynchronously (don't wait for it)
    sendEmailAlert(email);

    return NextResponse.json(
      { success: true, message: "Successfully joined the waitlist!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Waitlist error:", error);
    return NextResponse.json(
      { error: "Failed to join waitlist" },
      { status: 500 }
    );
  }
}
