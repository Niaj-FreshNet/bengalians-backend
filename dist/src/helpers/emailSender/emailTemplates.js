"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ORDER_NOTIFICATION_TO_ADMIN_TEMPLATE = exports.ORDER_CONFIRMATION_TEMPLATE = exports.CONTACT_FORM_TEMPLATE = exports.WELCOME_EMAIL_TEMPLATE = exports.PASSWORD_RESET_REQUEST_TEMPLATE = exports.PASSWORD_RESET_SUCCESS_TEMPLATE = exports.VERIFICATION_EMAIL_TEMPLATE = void 0;
exports.VERIFICATION_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #4CAF50, #45a049); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Verify Your Email</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hello,</p>
    <p>Thank you for signing up! Your verification code is:</p>
    <div style="text-align: center; margin: 30px 0;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4CAF50;">{verificationCode}</span>
    </div>
    <p>Enter this code on the verification page to complete your registration.</p>
    <p>This code will expire in 15 minutes for security reasons.</p>
    <p>If you didn't create an account with us, please ignore this email.</p>
    <p>Best regards,<br>JudySeide Team</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;
exports.PASSWORD_RESET_SUCCESS_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Successful</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #4CAF50, #45a049); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Password Reset Successful</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hello,</p>
    <p>We're writing to confirm that your password has been successfully reset.</p>
    <div style="text-align: center; margin: 30px 0;">
      <div style="background-color: #4CAF50; color: white; width: 50px; height: 50px; line-height: 50px; border-radius: 50%; display: inline-block; font-size: 30px;">
        ✓
      </div>
    </div>
    <p>If you did not initiate this password reset, please contact our support team immediately.</p>
    <p>For security reasons, we recommend that you:</p>
    <ul>
      <li>Use a strong, unique password</li>
      <li>Avoid using the same password across multiple sites</li>
    </ul>
    <p>Thank you for helping us keep your account secure.</p>
    <p>Best regards,<br>Your JudySeide Team</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;
exports.PASSWORD_RESET_REQUEST_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #4CAF50, #45a049); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Password Reset</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hello,</p>
    <p>We received a request to reset your password. If you didn't make this request, please ignore this email.</p>
    <p>To reset your password, click the button below:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{resetURL}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
    </div>
    <p>This link will expire in 15 minutes for security reasons.</p>
    <p>Best regards,<br>Your Ruebzj Team</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;
exports.WELCOME_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome Aboard</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #4CAF50, #45a049); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Welcome to Our Community</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hi {name},</p>
    <p>We're thrilled to have you on board! 🎉</p>
    <p>Thanks for verifying your email and joining us. You’re now officially part of our awesome community.</p>
    <p>Feel free to explore, engage, and make the most of what we have to offer.</p>
    <p>If you ever have any questions, our team is here to help.</p>
    <p>Once again, welcome aboard!</p>
    <p>Best regards,<br>The JudySeide Team</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;
exports.CONTACT_FORM_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>New Contact Form Submission</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #2196F3, #0b7dda); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">New Contact Message</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p><strong>Name:</strong> {name}</p>
    <p><strong>Email:</strong> <a href="mailto:{email}">{email}</a></p>
    <p><strong>Subject:</strong> {subject}</p>
    <p><strong>Message:</strong></p>
    <p style="white-space: pre-line;">{message}</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This message was sent via the contact form on your website.</p>
  </div>
</body>
</html>
`;
exports.ORDER_CONFIRMATION_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Order Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
    <header style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee;">
      <h1 style="color: #4CAF50; margin: 0;">Thank You for Your Purchase!</h1>
      <p style="margin: 5px 0; color: #777;">Order Confirmation</p>
    </header>

    <section style="padding: 20px 0;">
      <h2 style="font-size: 1.2em; margin-bottom: 10px;">Order Details:</h2>
      <p><strong>Email:</strong> <a href="mailto:{email}">{email}</a></p>
      <p><strong>Shipping Address:</strong> {address}</p>
      <p><strong>Shipping Zip Code:</strong> {zipcode}</p>
      <p><strong>Phone:</strong> {phone}</p>
      <p><strong>Payment Method:</strong> Stripe</p>
      <p><strong>Total Paid:</strong> $ {amount}</p>
    </section>

    <section style="padding: 20px 0;">
      <h2 style="font-size: 1.2em; margin-bottom: 10px;">Items Ordered:</h2>
      <ul style="list-style: none; padding: 0;">
        {items}
      </ul>
    </section>

    <footer style="text-align: center; font-size: 0.9em; color: #888; padding-top: 20px; border-top: 1px solid #eee;">
      <p>If you have any questions about your order, feel free to reply to this email.</p>
      <p>&copy; ${new Date().getFullYear()} Judy Seide. All rights reserved.</p>
    </footer>
  </div>
</body>
</html>
`;
exports.ORDER_NOTIFICATION_TO_ADMIN_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>New Order Notification</title>
</head>
<body style="font-family: Arial, sans-serif;">
  <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 6px;">
    <h2 style="color: #d9534f;">New Order Received</h2>
    <p><strong>Order ID:</strong> {orderId}</p>
    <p><strong>Order Date:</strong> {date}</p>
    <p><strong>Customer Email:</strong> {email}</p>
    <p><strong>Shipping Address:</strong> {address}</p>
    <p><strong>Shipping Zip Code:</strong> {zipcode}</p>
    <p><strong>Phone:</strong> {phone}</p>
    <p><strong>Customer Note:</strong> {note}</p>
    <p><strong>Total Amount:</strong> $ {amount}</p>

    <section style="padding: 20px 0;">
      <h2 style="font-size: 1.2em; margin-bottom: 10px;">Items Ordered:</h2>
      <ul style="list-style: none; padding: 0;">
        {items}
      </ul>
    </section>

    <p style="margin-top: 30px; color: #888;">Please log in to the admin panel to process this order.</p>

    <footer style="text-align: center; font-size: 0.9em; color: #888; padding-top: 20px; border-top: 1px solid #eee;">
      <p>If you have any questions about your order, feel free to reply to this email.</p>
      <p>&copy; ${new Date().getFullYear()} Judy Seide. All rights reserved.</p>
    </footer>
  </div>
</body>
</html>
`;
