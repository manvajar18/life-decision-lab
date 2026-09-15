import tls from "node:tls"

interface SendEmailParams {
  to: string
  code: string
  name?: string
}

export interface EmailResult {
  success: boolean
  provider: "gmail_smtp" | "brevo" | "resend" | "console"
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

function sendViaTlsSmtp({
  host = "smtp.gmail.com",
  port = 465,
  user,
  pass,
  to,
  subject,
  html,
  text,
}: {
  host?: string
  port?: number
  user: string
  pass: string
  to: string
  subject: string
  html: string
  text: string
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanPass = pass.replace(/\s+/g, "")
    const socket = tls.connect(
      {
        host,
        port,
        timeout: 12000,
      },
      () => {
        let step = 0
        let buffer = ""

        const send = (cmd: string) => {
          socket.write(cmd + "\r\n")
        }

        socket.on("data", (chunk: Buffer) => {
          buffer += chunk.toString()
          const lines = buffer.trim().split("\r\n")
          const lastLine = lines[lines.length - 1]

          if (!/^\d{3}\s/.test(lastLine)) {
            return
          }
          buffer = ""

          const code = parseInt(lastLine.slice(0, 3), 10)
          if (code >= 400) {
            socket.destroy()
            return reject(new Error(`SMTP Error ${code}: ${lastLine}`))
          }

          if (step === 0 && code === 220) {
            step = 1
            send("EHLO localhost")
          } else if (step === 1 && code === 250) {
            step = 2
            send("AUTH LOGIN")
          } else if (step === 2 && code === 334) {
            step = 3
            send(Buffer.from(user).toString("base64"))
          } else if (step === 3 && code === 334) {
            step = 4
            send(Buffer.from(cleanPass).toString("base64"))
          } else if (step === 4 && code === 235) {
            step = 5
            send(`MAIL FROM:<${user}>`)
          } else if (step === 5 && code === 250) {
            step = 6
            send(`RCPT TO:<${to}>`)
          } else if (step === 6 && code === 250) {
            step = 7
            send("DATA")
          } else if (step === 7 && code === 354) {
            step = 8
            const boundary = "----=_Part_" + Date.now().toString(36)
            const emailBody = [
              `From: "Life Decision Lab" <${user}>`,
              `To: <${to}>`,
              `Subject: =?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`,
              `MIME-Version: 1.0`,
              `Content-Type: multipart/alternative; boundary="${boundary}"`,
              ``,
              `--${boundary}`,
              `Content-Type: text/plain; charset=utf-8`,
              `Content-Transfer-Encoding: base64`,
              ``,
              Buffer.from(text).toString("base64"),
              ``,
              `--${boundary}`,
              `Content-Type: text/html; charset=utf-8`,
              `Content-Transfer-Encoding: base64`,
              ``,
              Buffer.from(html).toString("base64"),
              ``,
              `--${boundary}--`,
              `.`,
            ].join("\r\n")

            socket.write(emailBody + "\r\n")
          } else if (step === 8 && code === 250) {
            step = 9
            send("QUIT")
            socket.end()
            resolve()
          }
        })

        socket.on("error", (err) => {
          reject(err)
        })

        socket.on("timeout", () => {
          socket.destroy()
          reject(new Error("SMTP connection timed out"))
        })
      }
    )
  })
}

export async function sendPasswordResetEmail({ to, code }: SendEmailParams): Promise<EmailResult> {
  const subject = `Your Life Decision Lab Security Code: ${code}`
  const html = getResetEmailHtml(code, to)
  const text = `Your Life Decision Lab password reset code is: ${code}\n\nThis code expires in 15 minutes. If you did not request this, please ignore this email.`

  // 1. Gmail SMTP (Sends to ANY recipient worldwide with ZERO domain restrictions)
  const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER || process.env.EMAIL_USER
  const gmailPass = process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || process.env.EMAIL_PASS
  if (gmailUser && gmailPass) {
    try {
      await sendViaTlsSmtp({
        user: gmailUser.trim(),
        pass: gmailPass.trim(),
        to: to.trim(),
        subject,
        html,
        text,
      })

      console.log(`[EMAIL] Successfully sent reset code to ${to} via Gmail SMTP!`)
      return { success: true, provider: "gmail_smtp" }
    } catch (smtpErr) {
      const msg = smtpErr instanceof Error ? smtpErr.message : "Gmail SMTP error"
      console.error("[EMAIL] Gmail SMTP error:", msg)
    }
  }

  // Fallback console logging
  console.log(`\n==================================================`)
  console.log(`[EMAIL NOTIFICATION] To: ${to} | Code: ${code}`)
  console.log(`==================================================\n`)

  return {
    success: true,
    provider: "console",
  }
}
