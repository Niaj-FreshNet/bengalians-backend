"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const axios_1 = __importDefault(require("axios"));
// Brevo API key from config
const BREVO_API_KEY = process.env.BREVO_API_KEY;
if (!BREVO_API_KEY) {
    throw new Error('Missing Brevo API Key in .env');
}
/**
 * Send a dynamic email using Brevo SMTP API
 * @param to - Array of recipients (email + name)
 * @param subject - Email subject
 * @param htmlContent - HTML content of the email
 * @param textContent - Optional plain text fallback
 */
function sendEmail(to, subject, htmlContent, textContent) {
    return __awaiter(this, void 0, void 0, function* () {
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
            const response = yield axios_1.default.post(endpoint, payload, {
                headers: {
                    'api-key': BREVO_API_KEY,
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        }
        catch (error) {
            if (error.response) {
            }
            else {
            }
        }
    });
}
//documentation
//? first -1 email with object name and email  in a array
//? second  - subject
//? third - htmlContent
