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
exports.isExist = isExist;
exports.isExistUserById = isExistUserById;
const client_1 = require("../../prisma/client");
function isExist(model, where) {
    return __awaiter(this, void 0, void 0, function* () {
        const modelDelegate = client_1.prisma[String(model)];
        if (typeof modelDelegate.findFirst !== 'function') {
            throw new Error(`${String(model)} does not support findFirst`);
        }
        const result = yield modelDelegate.findFirst({ where });
        return !!result;
    });
}
function isExistUserById(name, id) {
    return __awaiter(this, void 0, void 0, function* () {
        const exists = yield isExist(name, {
            id,
        });
        if (exists) {
            console.log(`${String(name)} already exists`);
        }
        else {
            console.log(`${String(name)} doesn't exists`);
        }
    });
}
