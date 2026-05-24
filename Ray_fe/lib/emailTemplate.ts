// Deliverability-tuned OTP email.
//
// Design choices to reduce spam-folder hits on first-contact mail:
//  - One small inline image (the RAY mascot, ~124 KB). The src is passed in
//    from the caller — in production it's an https URL (renders reliably in
//    every webmail client); in dev it falls back to a `cid:` reference.
//  - No "click here", "free", "guaranteed", "act now" wording.
//  - No emoji in subject or headline.
//  - Conservative inline styles only — most email clients strip <style> blocks
//    or partial CSS, so we put critical styles inline on each element.
//  - High text-to-formatting ratio.
export function generateOTPEmailHTML(
  otp: string,
  email: string,
  mascotSrc: string = 'cid:ray-chatbot',
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your RAY verification code</title>
</head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#f4f7fb;">
    Your RAY verification code is ${otp}. It expires in 15 minutes.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f7fb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">

          <!-- Header bar -->
          <tr>
            <td style="padding:28px 32px 20px 32px;border-bottom:1px solid #f1f5f9;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="vertical-align:middle;">
                          <img src="${mascotSrc}" alt="RAY" width="48" height="48" style="display:block;width:48px;height:48px;border:0;outline:none;" />
                        </td>
                        <td style="padding-left:14px;vertical-align:middle;">
                          <div style="font-size:18px;font-weight:600;color:#0f172a;line-height:1.2;">RAY</div>
                          <div style="font-size:12px;color:#64748b;line-height:1.2;">by Vexar Tech</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:28px 32px 8px 32px;">
              <h1 style="margin:0 0 8px 0;font-size:22px;line-height:1.3;font-weight:600;color:#0f172a;">
                Verify your email to continue
              </h1>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#475569;">
                Hi there,<br />
                Thanks for signing up. Please use the verification code below to finish setting up your RAY account.
              </p>
            </td>
          </tr>

          <!-- Code box -->
          <tr>
            <td style="padding:24px 32px 8px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                <tr>
                  <td align="center" style="padding:24px 16px;">
                    <div style="font-size:11px;font-weight:600;letter-spacing:1.5px;color:#64748b;text-transform:uppercase;margin-bottom:10px;">
                      Verification code
                    </div>
                    <div style="font-family:'SF Mono',Menlo,Consolas,'Liberation Mono',monospace;font-size:32px;font-weight:600;letter-spacing:8px;color:#0f172a;line-height:1;">
                      ${otp}
                    </div>
                    <div style="font-size:12px;color:#64748b;margin-top:12px;">
                      Valid for 15 minutes
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:20px 32px 8px 32px;">
              <p style="margin:0 0 12px 0;font-size:14px;line-height:1.7;color:#475569;">
                Enter this code on the verification page to activate your account.
              </p>
              <p style="margin:0 0 12px 0;font-size:14px;line-height:1.7;color:#475569;">
                RAY will never ask you to share this code with anyone, including team members. If someone is asking for it, do not share it.
              </p>
              <p style="margin:0;font-size:14px;line-height:1.7;color:#475569;">
                If you did not sign up for a RAY account, you can safely ignore this email and no account will be created.
              </p>
            </td>
          </tr>

          <!-- Help line -->
          <tr>
            <td style="padding:20px 32px 28px 32px;">
              <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
                Need help? Just reply to this email and we will get back to you.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px 24px 32px;border-top:1px solid #f1f5f9;background:#f8fafc;">
              <p style="margin:0 0 4px 0;font-size:12px;line-height:1.5;color:#64748b;">
                This message was sent to <strong style="color:#475569;">${email}</strong> because someone used it to sign up for RAY.
              </p>
              <p style="margin:0;font-size:12px;line-height:1.5;color:#94a3b8;">
                RAY · Vexar Tech · Hyderabad, India
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
