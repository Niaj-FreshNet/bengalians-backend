import axios from 'axios';

import { response } from 'express';

// Brevo API key from config
const BREVO_API_KEY = process.env.BREVO_API_KEY;

if (!BREVO_API_KEY) {
  throw new Error('Missing Brevo API Key in .env');
}

// ======== Types ========
interface EmailContact {
  email: string;
  name?: string;
}

/**
 * Send a dynamic email using Brevo SMTP API
 * @param to - Array of recipients (email + name)
 * @param subject - Email subject
 * @param htmlContent - HTML content of the email
 * @param textContent - Optional plain text fallback
 */
export async function sendEmail(
  to: EmailContact[],
  subject: string,
  htmlContent: string,
  textContent?: string,
): Promise<void> {
  const endpoint = 'https://api.brevo.com/v3/smtp/email';

  const payload = {
    sender: {
      name: 'Khushbuwaala Perfumes',
      email: 'khushbuwaala@gmail.com',
    },
    to,
    subject,
    htmlContent,
    textContent: textContent || htmlContent.replace(/<[^>]+>/g, ''),
  };

  try {
    const response = await axios.post(endpoint, payload, {
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
    } else {
    }
  }
}

//documentation

//? first -1 email with object name and email  in a array
//? second  - subject
//? third - htmlContent
