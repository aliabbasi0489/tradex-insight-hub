import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const smtpHost = Deno.env.get('SMTP_HOST');
const smtpPort = Number(Deno.env.get('SMTP_PORT') ?? 587);
const smtpUser = Deno.env.get('SMTP_USER');
const smtpPass = Deno.env.get('SMTP_PASSWORD');
const fromEmail = Deno.env.get('FROM_EMAIL') || Deno.env.get('FROM_MAIL') || 'no-reply@example.com';

const sendEmail = async (to: string, subject: string, html: string) => {
  const client = new SMTPClient({
    connection: {
      hostname: smtpHost!,
      port: smtpPort,
      tls: true,
      auth: {
        username: smtpUser!,
        password: smtpPass!,
      },
    },
  });

  await client.send({
    from: fromEmail!,
    to,
    subject,
    content: html,
  });
  await client.close();
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  subject: string;
  messageType: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, messageType, message }: ContactEmailRequest = await req.json();

    console.log("Sending contact form email to:", email);

    // Store in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: dbError } = await supabase
      .from('contact_submissions')
      .insert({
        name,
        email,
        subject,
        message_type: messageType,
        message,
      });

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Failed to store contact submission");
    }

    // Send confirmation email to user
    await sendEmail(
      email,
      "We received your message!",
      `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
              h1 { margin: 0; font-size: 28px; }
              .highlight { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Thank You, ${name}!</h1>
              </div>
              <div class="content">
                <p>We have received your message and appreciate you taking the time to contact us.</p>
                
                <div class="highlight">
                  <strong>Your Message:</strong><br>
                  <strong>Subject:</strong> ${subject}<br>
                  <strong>Type:</strong> ${messageType}<br>
                  <strong>Message:</strong> ${message}
                </div>
                
                <p>Our team will review your inquiry and get back to you as soon as possible.</p>
                
                <p>Best regards,<br>
                <strong>The TradeX Team</strong></p>
              </div>
              <div class="footer">
                <p>© 2025 TradeX. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `
    );

    console.log("Contact email sent successfully via SMTP");

    return new Response(
      JSON.stringify({ success: true, message: "Contact form submitted successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
