import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_SERVER || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports (STARTTLS)
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
});

const FROM_EMAIL = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USERNAME || 'noreply@learnsphere.com';
const APP_NAME = 'LearnSphere';
const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3001';

// ─── Base HTML wrapper ───
function wrapHtml(body: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">🎓 ${APP_NAME}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background-color:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
              </p>
              <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">
                <a href="${APP_URL}" style="color:#7c3aed;text-decoration:none;">${APP_URL}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Send a raw email ───
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  return transporter.sendMail({
    from: `"${APP_NAME}" <${FROM_EMAIL}>`,
    to,
    subject,
    html,
    text: text || subject,
  });
}

// ─── Course Invitation Email ───
export async function sendInvitationEmail({
  to,
  inviterName,
  courseName,
  courseSlug,
  message,
}: {
  to: string;
  inviterName: string;
  courseName: string;
  courseSlug: string;
  message?: string;
}) {
  const acceptUrl = `${APP_URL}/courses/${courseSlug}`;

  const messageBlock = message
    ? `<div style="margin:20px 0;padding:16px;background-color:#f5f3ff;border-left:4px solid #7c3aed;border-radius:0 8px 8px 0;">
         <p style="margin:0;font-size:14px;color:#4b5563;font-style:italic;">"${message}"</p>
       </div>`
    : '';

  const body = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827;font-weight:700;">You're Invited!</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#6b7280;line-height:1.6;">
      <strong style="color:#111827;">${inviterName}</strong> has invited you to join the course
      <strong style="color:#7c3aed;">${courseName}</strong> on ${APP_NAME}.
    </p>
    ${messageBlock}
    <table cellpadding="0" cellspacing="0" style="margin:28px 0;">
      <tr>
        <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:12px;padding:14px 32px;">
          <a href="${acceptUrl}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;display:inline-block;">
            View Course
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5;">
      Or copy this link into your browser:<br/>
      <a href="${acceptUrl}" style="color:#7c3aed;word-break:break-all;">${acceptUrl}</a>
    </p>
    <p style="margin:20px 0 0;font-size:12px;color:#d1d5db;">This invitation expires in 14 days.</p>
  `;

  return sendEmail({
    to,
    subject: `You've been invited to "${courseName}" on ${APP_NAME}`,
    html: wrapHtml(body),
    text: `${inviterName} has invited you to join "${courseName}" on ${APP_NAME}. View the course here: ${acceptUrl}`,
  });
}

// ─── Contact Attendees Email (bulk) ───
export async function sendContactEmail({
  to,
  senderName,
  courseName,
  subject,
  message,
}: {
  to: string;
  senderName: string;
  courseName: string;
  subject: string;
  message: string;
}) {
  const courseUrl = `${APP_URL}/my-courses`;

  const body = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827;font-weight:700;">${subject}</h2>
    <p style="margin:0 0 6px;font-size:13px;color:#9ca3af;">
      From <strong style="color:#6b7280;">${senderName}</strong> · Course: <strong style="color:#7c3aed;">${courseName}</strong>
    </p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />
    <div style="font-size:15px;color:#374151;line-height:1.7;white-space:pre-line;">${message}</div>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
    <table cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:12px;padding:12px 28px;">
          <a href="${courseUrl}" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;display:inline-block;">
            Go to My Courses
          </a>
        </td>
      </tr>
    </table>
  `;

  return sendEmail({
    to,
    subject: `[${courseName}] ${subject}`,
    html: wrapHtml(body),
    text: `From ${senderName} (${courseName}):\n\n${message}\n\nView your courses: ${courseUrl}`,
  });
}
