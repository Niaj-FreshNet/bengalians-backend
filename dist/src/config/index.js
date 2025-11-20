"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.default = {
    port: process.env.PORT,
    salt_round: process.env.SALT_ROUND,
    stripe_api_secret: process.env.STRIPE_SECRET_KEY,
    client_url: process.env.CLIENT_URL,
    brevo: {
        api_key: process.env.BREVO_API_KEY || '',
    },
    aws: {
        do_space_endpoint: process.env.DO_SPACE_ENDPOINT,
        do_space_bucket: process.env.DO_SPACE_BUCKET,
        do_space_access_key: process.env.DO_SPACE_ACCESS_KEY,
        do_space_secret_key: process.env.DO_SPACE_SECRET_KEY,
    },
    db_url: process.env.DB_URL,
    node_env: process.env.NODE_ENV || 'development',
    access_token_secret: process.env.JWT_ACCESS_TOKEN,
    access_token_expires: process.env.JWT_TOKEN_EXPIRES,
    refresh_token_secret: process.env.JWT_REFRESH_TOKEN,
    refresh_token_expires: process.env.JWT_REFRESH_TOKEN_EXPIRES,
    cloud_name: process.env.CLOUD_NAME,
    cloud_api_key: process.env.CLOUD_API_KEY,
    cloud_api_secret: process.env.CLOUD_API_SECRET,
    smtp_email: process.env.SMTP_EMAIL,
    smtp_app_pass: process.env.SMTP_PASS,
    email: {
        smtp_email: process.env.SMTP_EMAIL,
        smtp_app_pass: process.env.SMTP_PASS,
    },
    live_url: process.env.Frontend_Live_URL,
};
