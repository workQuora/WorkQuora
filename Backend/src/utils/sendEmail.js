const nodemailer = require('nodemailer');

const getEmailTemplate = (subject, bodyHtml) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#1E00A9 0%,#3525CD 100%);padding:36px 40px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background:rgba(255,255,255,0.15);border-radius:14px;padding:10px 18px;display:inline-block;">
                    <span style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-1px;">WQ</span>
                  </td>
                  <td style="padding-left:12px;">
                    <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">WorkQuora</span>
                  </td>
                </tr>
              </table>
              <p style="color:rgba(255,255,255,0.75);font-size:13px;margin:12px 0 0 0;letter-spacing:0.5px;">India's Premier Freelance Marketplace</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:40px 40px 32px 40px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- DIVIDER -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:#e8e8f0;"></div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:28px 40px;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:13px;color:#9999aa;">This email was sent by WorkQuora. Please do not reply to this email.</p>
              <p style="margin:0;font-size:12px;color:#bbbbcc;">
                © ${new Date().getFullYear()} WorkQuora · 
                <a href="https://workquora.onrender.com" style="color:#3525CD;text-decoration:none;">workquora.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const getOtpTemplate = (otp, purpose = 'verification') => getEmailTemplate(
  `Your WorkQuora OTP`,
  `
  <h2 style="margin:0 0 8px 0;font-size:26px;font-weight:800;color:#0f0069;letter-spacing:-0.5px;">
    ${purpose === 'reset' ? '🔐 Reset Your Password' : '✅ Verify Your Account'}
  </h2>
  <p style="margin:0 0 28px 0;font-size:15px;color:#666677;line-height:1.6;">
    ${purpose === 'reset'
      ? 'Use the OTP below to reset your WorkQuora password. This code expires in <strong>10 minutes</strong>.'
      : 'Use the OTP below to complete your WorkQuora registration. This code expires in <strong>10 minutes</strong>.'}
  </p>

  <div style="background:linear-gradient(135deg,#f0eeff 0%,#e8e4ff 100%);border:2px dashed #3525CD;border-radius:14px;padding:28px;text-align:center;margin:0 0 28px 0;">
    <p style="margin:0 0 6px 0;font-size:12px;font-weight:700;color:#3525CD;letter-spacing:2px;text-transform:uppercase;">Your OTP Code</p>
    <p style="margin:0;font-size:44px;font-weight:900;color:#1E00A9;letter-spacing:10px;font-family:'Courier New',monospace;">${otp}</p>
  </div>

  <div style="background:#fff8e1;border-left:4px solid #ff9800;border-radius:8px;padding:14px 18px;margin:0 0 24px 0;">
    <p style="margin:0;font-size:13px;color:#8a6200;">
      ⚠️ <strong>Never share this OTP with anyone.</strong> WorkQuora will never ask for your OTP via phone or chat.
    </p>
  </div>

  <p style="margin:0;font-size:13px;color:#aaaabc;">If you didn't request this, you can safely ignore this email.</p>
  `
);

const getWelcomeTemplate = (name) => getEmailTemplate(
  'Welcome to WorkQuora!',
  `
  <h2 style="margin:0 0 8px 0;font-size:26px;font-weight:800;color:#0f0069;">
    🎉 Welcome aboard, ${name}!
  </h2>
  <p style="margin:0 0 24px 0;font-size:15px;color:#666677;line-height:1.6;">
    Your WorkQuora account is ready. You're now part of India's fastest-growing freelance marketplace.
  </p>

  <div style="display:flex;gap:16px;margin:0 0 28px 0;">
    ${[
      { icon: '🔍', title: 'Discover Talent', desc: 'Find skilled freelancers near you' },
      { icon: '💼', title: 'Post Jobs', desc: 'Post jobs and get proposals fast' },
      { icon: '💳', title: 'Secure Payments', desc: 'Escrow-protected transactions' },
    ].map(item => `
      <div style="flex:1;background:#f8f8ff;border-radius:12px;padding:16px;text-align:center;">
        <div style="font-size:24px;margin-bottom:8px;">${item.icon}</div>
        <p style="margin:0 0 4px 0;font-size:13px;font-weight:700;color:#1E00A9;">${item.title}</p>
        <p style="margin:0;font-size:11px;color:#888899;">${item.desc}</p>
      </div>
    `).join('')}
  </div>

  <a href="https://workquora.onrender.com" style="display:block;background:linear-gradient(135deg,#1E00A9,#3525CD);color:#fff;text-align:center;padding:16px;border-radius:12px;font-weight:800;font-size:16px;text-decoration:none;letter-spacing:0.3px;">
    Get Started →
  </a>
  `
);

const sendEmail = async (options) => {
  const isGmail = process.env.SMTP_HOST === 'smtp.gmail.com';
  const smtpPort = isGmail ? 465 : (Number(process.env.SMTP_PORT) || 587);
  const isSecure = smtpPort === 465;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: smtpPort,
    secure: isSecure,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
    family: 4,
  });

  // Auto-detect template type from subject
  let htmlContent = options.html;
  
  if (!htmlContent) {
    if (options.otp) {
      const purpose = options.subject?.toLowerCase().includes('reset') ? 'reset' : 'verification';
      htmlContent = getOtpTemplate(options.otp, purpose);
    } else if (options.subject?.toLowerCase().includes('welcome')) {
      htmlContent = getWelcomeTemplate(options.name || 'there');
    } else {
      // Generic branded template
      htmlContent = getEmailTemplate(options.subject, `
        <h2 style="margin:0 0 16px 0;font-size:22px;font-weight:800;color:#0f0069;">${options.subject}</h2>
        <p style="margin:0;font-size:15px;color:#444455;line-height:1.7;">${options.message}</p>
      `);
    }
  }

  const mailOptions = {
    from: `"WorkQuora" <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message || options.subject,
    html: htmlContent,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
module.exports.getOtpTemplate = getOtpTemplate;
module.exports.getWelcomeTemplate = getWelcomeTemplate;