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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInvoice = void 0;
const client_1 = require("../../prisma/client");
const generateInvoice = () => __awaiter(void 0, void 0, void 0, function* () {
    let unique = false;
    let invoice = "";
    while (!unique) {
        // Generate a random 5–7 digit number
        const randomNum = Math.floor(10000 + Math.random() * 900000).toString();
        // Check if it already exists
        const existing = yield client_1.prisma.order.findUnique({
            where: { invoice: randomNum },
            select: { id: true },
        });
        if (!existing) {
            invoice = randomNum;
            unique = true;
        }
    }
    return invoice;
});
exports.generateInvoice = generateInvoice;
