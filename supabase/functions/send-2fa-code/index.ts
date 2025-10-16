import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TwoFARequest {
  email: string;
  type: 'login' | 'signup' | 'reset-password';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, type }: TwoFARequest = await req.json();

    console.log("Generating 2FA code for:", email, "type:", type);

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration to 2 minutes from now
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString();

    // Store in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Clean up old codes for this email
    await supabase
      .from('two_factor_codes')
      .delete()
      .eq('email', email)
      .eq('verified', false);

    // Insert new code
    const { error: dbError } = await supabase
      .from('two_factor_codes')
      .insert({
        email,
        code,
        expires_at: expiresAt,
      });

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Failed to store 2FA code");
    }

    // Send email with 2FA code using Resend REST API (edge-friendly)
    const emailSubjects = {
      login: 'Your TradeX Login Code',
      signup: 'Verify Your TradeX Account',
      'reset-password': 'Reset Your TradeX Password'
    } as const;

    const fromEmail = Deno.env.get("FROM_EMAIL")!;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .code-box { background: white; padding: 25px; border-radius: 10px; text-align: center; margin: 20px 0; border: 2px dashed #2563eb; }
            .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2563eb; font-family: 'Courier New', monospace; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            h1 { margin: 0; font-size: 28px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Verification Code</h1>
            </div>
            <div class="content">
              <p>Enter this code to complete your ${type === 'login' ? 'login' : type === 'signup' ? 'signup' : 'password reset'}:</p>
              
              <div class="code-box">
                <div class="code">${code}</div>
                <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Valid for 2 minutes</p>
              </div>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong><br>
                Never share this code with anyone. TradeX will never ask for this code via phone or email.
              </div>
              
              <p>If you didn't request this code, please ignore this email or contact support if you have concerns.</p>
            </div>
            <div class="footer">
              <p>© 2025 TradeX. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    if (!RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY secret");
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail.includes('<') ? fromEmail : `TradeX <${fromEmail}>`,
        to: [email],
        subject: emailSubjects[type],
        html,
      }),
    });

    if (!emailRes.ok) {
      const text = await emailRes.text();
      console.error("Resend API error:", emailRes.status, text);
      throw new Error(`Email send failed (${emailRes.status})`);
    }

    const emailJson = await emailRes.json();
    console.log("2FA email sent successfully:", emailJson);

    return new Response(
      JSON.stringify({ success: true, message: "2FA code sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-2fa-code function:", error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Failed to send 2FA code' }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
