import nodemailer from "nodemailer";

export const sendOTPEmail = async (toEmail: string, otp: string) => {
  
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const cleanPass = process.env.SMTP_PASS.replace(/\s+/g, "");
      const host = process.env.SMTP_HOST || "smtp.gmail.com";
      const port = parseInt(process.env.SMTP_PORT || "587", 10);
      const isGmail = host.toLowerCase().includes("gmail") || (process.env.SMTP_USER || "").toLowerCase().includes("gmail");

      
      const transportConfig: any = isGmail
        ? {
            service: "gmail",
            auth: {
              user: process.env.SMTP_USER,
              pass: cleanPass,
            },
          }
        : {
            host,
            port,
            secure: port === 465, 
            auth: {
              user: process.env.SMTP_USER,
              pass: cleanPass,
            },
            tls: {
              rejectUnauthorized: false,
            },
          };

      const transporter = nodemailer.createTransport(transportConfig);

      
      const senderFrom = process.env.SMTP_FROM 
        ? process.env.SMTP_FROM.replace(/^["']|["']$/g, "") 
        : `"EMPMS System" <${process.env.SMTP_USER}>`;

      await transporter.sendMail({
        from: senderFrom,
        to: toEmail,
        subject: "EMPMS Account Verification Code",
        html: `
          <div style="font-family: Arial, sans-serif; background: #0B0B0D; color: #F5F5F7; padding: 24px; border-radius: 8px;">
            <h2 style="color: #A3E635;">EMPMS Verification</h2>
            <p>Your 6-digit verification code is:</p>
            <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; padding: 12px; background: #151519; border: 1px solid #292930; color: #A3E635; display: inline-block; border-radius: 6px;">
              ${otp}
            </div>
            <p style="color: #9E9EA8; margin-top: 16px; font-size: 13px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
          </div>
        `,
      });
      console.log(`[Email] OTP sent successfully via SMTP to ${toEmail}`);
      return true;
    } catch (err: any) {
      console.error(`[Email Error] Failed to send email to ${toEmail}:`, {
        message: err.message,
        code: err.code,
        response: err.response,
      });
      // Fallback to console so verification is unblocked during testing
      console.log(`\n========================================`);
      console.log(`[DEV OTP FALLBACK for ${toEmail}]: ${otp}`);
      console.log(`========================================\n`);
      return false;
    }
  } else {
    // In dev mode without configured SMTP, log clearly to console
    console.log(`\n========================================`);
    console.log(`[DEV OTP NOTIFICATION]`);
    console.log(`Sent To: ${toEmail}`);
    console.log(`Verification OTP: ${otp}`);
    console.log(`Expires: In 10 minutes`);
    console.log(`========================================\n`);
    return true;
  }
};

