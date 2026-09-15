interface SendEmailParams {
  to: string
  code: string
  name?: string
}

export interface EmailResult {
  success: boolean
  provider: "resend" | "console"
  error?: string
}

function getResetEmailHtml(code: string, email: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0b0f19; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #111827; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; overflow: hidden; padding: 36px 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <div style="display: inline-block; padding: 10px 16px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.25); border-radius: 9999px; margin-bottom: 12px;">
                <span style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #60a5fa; text-transform: uppercase;">
                  LIFE DECISION LAB · SECURITY
                </span>
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                Password Reset Code
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 24px; color: #94a3b8; font-size: 14px; line-height: 1.6; text-align: center;">
              We received a request to reset the password for your account associated with 
              <strong style="color: #f1f5f9;">${email}</strong>. Use the 6-digit security code below to proceed:
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom: 28px;">
              <div style="background: rgba(15, 23, 42, 0.8); border: 2px dashed #3b82f6; border-radius: 12px; padding: 20px 32px; display: inline-block;">
                <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace; color: #60a5fa;">
                  ${code}
                </span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 28px; text-align: center; font-size: 12px; color: #64748b; line-height: 1.5;">
              ⏱️ This code will expire in <strong>15 minutes</strong>.<br>
              If you did not request this password reset, you can safely ignore this message. Your account remains secure.
            </td>
          </tr>
          <tr>
            <td style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 20px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #475569;">
                Life Decision Lab — Strategic Decision Support System<br>
                This is an automated security notification.
              </p>
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

export async function sendPasswordResetEmail({ to, code }: SendEmailParams): Promise<EmailResult> {
  const subject = `Your Life Decision Lab Security Code: ${code}`
  const html = getResetEmailHtml(code, to)
  const text = `Your Life Decision Lab password reset code is: ${code}\n\nThis code expires in 15 minutes. If you did not request this, please ignore this email.`

  const resendApiKey = process.env.RESEND_API_KEY
  if (resendApiKey) {
    try {
      const fromAddress = process.env.EMAIL_FROM || "Life Decision Lab <onboarding@resend.dev>"
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [to],
          subject,
          html,
          text,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        console.log(`[EMAIL] Successfully sent reset code to ${to} via Resend (ID: ${data.id})`)
        return { success: true, provider: "resend" }
      }

      console.error("[EMAIL] Resend API error:", data)
      return { success: false, provider: "resend", error: data.message || "Failed to send via Resend" }
    } catch (err) {
      console.error("[EMAIL] Failed to fetch Resend:", err)
    }
  }

  console.log(`\n[EMAIL NOTIFICATION] To: ${to} | Code: ${code}\n`)
  return {
    success: true,
    provider: "console",
  }
}
