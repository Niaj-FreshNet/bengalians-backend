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
const client_1 = require("@prisma/client");
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./config"));
const prisma = new client_1.PrismaClient();
let server;
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield prisma.$connect();
            console.log('✅ Database connected successfully');
            const port = config_1.default.port || 5000;
            const host = '10.0.30.110';
            server = app_1.default.listen(port, () => {
                console.log(`🚀 Server is running on ${port}`);
            });
        }
        catch (error) {
            console.error('❌ Failed to connect to the database', error);
            process.exit(1);
        }
    });
}
main();
// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    console.error('☠️  Unhandled Rejection detected:', error);
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
    else {
        process.exit(1);
    }
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('☠️  Uncaught Exception detected:', error);
    process.exit(1);
});
// (Optional) Handle SIGTERM for graceful shutdown (production best practice)
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received. Shutting down gracefully');
    if (server) {
        server.close(() => {
            prisma.$disconnect();
            console.log('💾 Prisma client disconnected');
        });
    }
});
