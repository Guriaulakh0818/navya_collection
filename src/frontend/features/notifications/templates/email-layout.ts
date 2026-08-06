export function wrapEmailLayout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #F8FAFC; color: #1E293B; }
    .container { max-width: 600px; margin: 20px auto; background: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #E2E8F0; }
    .header { background: linear-gradient(135deg, #183A73 0%, #0F2145 100%); padding: 32px 24px; text-align: center; color: #FFFFFF; }
    .header-logo { font-size: 24px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #FFFFFF; text-decoration: none; display: inline-block; }
    .header-subtitle { font-size: 11px; font-weight: 800; letter-spacing: 4px; color: #F15A25; text-transform: uppercase; margin-top: 4px; }
    .content { padding: 32px 28px; line-height: 1.6; font-size: 14px; }
    .badge { display: inline-block; background: #FFF7ED; color: #F15A25; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 6px 14px; rounded: 999px; border: 1px solid #FFEDD5; margin-bottom: 16px; border-radius: 50px; }
    .button { display: inline-block; background: #F15A25; color: #FFFFFF !important; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 50px; text-align: center; margin: 20px 0; box-shadow: 0 4px 14px rgba(241, 90, 37, 0.3); }
    .item-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #F1F5F9; }
    .footer { background: #F8FAFC; padding: 24px; text-align: center; font-size: 12px; color: #64748B; border-top: 1px solid #E2E8F0; }
    .footer a { color: #183A73; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-logo">NAVYA</div>
      <div class="header-subtitle">COLLECTION</div>
    </div>
    <div class="content">
      ${bodyHtml}
    </div>
    <div class="footer">
      <p style="margin: 0 0 8px 0;"><strong>Navya Collection</strong> • Affordable Luxury Fashion for Gents & Kids</p>
      <p style="margin: 0 0 12px 0;">Have questions? Contact support at <a href="mailto:support@navyacollection.in">support@navyacollection.in</a></p>
      <p style="margin: 0; font-size: 11px; color: #94A3B8;">&copy; ${new Date().getFullYear()} Navya Collection. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}
