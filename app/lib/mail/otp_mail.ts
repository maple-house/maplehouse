import { AppError } from "@/app/utils/error/AppError";
import transporter from "./config";

async function otp_mail(email : string, otp : string, name : string) {
    try {
        const info = await transporter.sendMail({
            from: 'info@maplehouse.in', // sender address
            to: email, // list of recipients
            subject: "OTP for login", // subject line
            html: template("2026",otp, name), // HTML body
        });
    } catch (error : any) {
        throw new AppError(error.message, false);
    }
}

export {otp_mail}


function template(year : string, otp : string, name : string) { 

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Your Maple House sign-in code</title>
</head>
<body style="margin:0;padding:0;background:#f5f1ef;font-family:Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1ef;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td align="center" style="background:#523B35;padding:32px 24px;color:#ffffff;">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:bold;letter-spacing:1px;">Maple House</div>
              <div style="font-size:14px;font-weight:300;letter-spacing:3px;margin-top:4px;">Interior and Decor Studio</div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 8px;color:#523B35;">
              <h1 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:22px;">Your sign-in code</h1>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#523B35;">
                Hi ${name}, use this code to sign in to Maple House. It expires in 10 minutes.
              </p>
            </td>
          </tr>
          <!-- OTP -->
          <tr>
            <td align="center" style="padding:24px 32px;">
              <div style="display:inline-block;background:#f5f1ef;border:1px solid #523B35;border-radius:6px;padding:16px 28px;font-family:Georgia,'Times New Roman',serif;font-size:34px;font-weight:bold;letter-spacing:10px;color:#523B35;">
                ${otp}
              </div>
            </td>
          </tr>
          <!-- Footer note -->
          <tr>
            <td style="padding:0 32px 32px;font-size:13px;line-height:1.6;color:#523B35;opacity:0.8;">
              Didn't request this? You can ignore this email. Never share this code with anyone, including Maple House staff.
            </td>
          </tr>
          <tr>
            <td align="center" style="background:#523B35;padding:16px;font-size:12px;color:#ffffff;">
              &copy; ${year} Maple House
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

}