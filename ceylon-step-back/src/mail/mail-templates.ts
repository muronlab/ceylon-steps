import * as Handlebars from 'handlebars';

export const OTP_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <style>
        .container { font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #09090b; letter-spacing: 2px; }
        .content { color: #3f3f46; line-height: 1.6; }
        .otp-box { background: #f4f4f5; padding: 20px; text-align: center; border-radius: 8px; margin: 25px 0; }
        .otp-code { font-size: 32px; font-weight: bold; color: #09090b; letter-spacing: 5px; }
        .footer { margin-top: 30px; font-size: 12px; color: #a1a1aa; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Ceylon Stepsss</div>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>To complete your verification, please use the following One-Time Password (OTP). This code is valid for 10 minutes.</p>
            <div class="otp-box">
                <div class="otp-code">{{code}}</div>
            </div>
            <p>If you didn't request this code, please ignore this email.</p>
        </div>
        <div class="footer">
            &copy; {{year}} Ceylon Step. All rights reserved.
        </div>
    </div>
</body>
</html>
`;

export const WELCOME_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <style>
        .container { font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #09090b; letter-spacing: 2px; }
        .content { color: #3f3f46; line-height: 1.6; }
        .button-box { text-align: center; margin: 30px 0; }
        .button { background: #09090b; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 30px; font-weight: bold; }
        .footer { margin-top: 30px; font-size: 12px; color: #a1a1aa; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">CEYLON STEP</div>
        </div>
        <div class="content">
            <p>Welcome to Ceylon Step, {{name}}!</p>
            <p>We're thrilled to have you join our community. Whether you're exploring the hidden gems of Sri Lanka or offering your services as a partner, we're here to make the journey unforgettable.</p>
            <p>Start exploring our guides, transport options, and unique activities today.</p>
            <div class="button-box">
                <a href="{{loginUrl}}" class="button">Explore Dashboard</a>
            </div>
        </div>
        <div class="footer">
            &copy; {{year}} Ceylon Step. All rights reserved.
        </div>
    </div>
</body>
</html>
`;

export function compileTemplate(template: string, data: any) {
  const compiled = Handlebars.compile(template);
  return compiled(data);
}
