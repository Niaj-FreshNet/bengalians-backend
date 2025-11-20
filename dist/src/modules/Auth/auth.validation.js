"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authValidation = void 0;
const zod_1 = require("zod");
const UserRegisterValidationSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    email: zod_1.z
        .string()
        .email('Invalid email address')
        .nonempty('Email is required'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
});
const UserLoginValidationSchema = zod_1.z.object({
    email: zod_1.z.string().email().nonempty('Email is required'),
    password: zod_1.z.string().nonempty('Password is required'),
});
const changePasswordValidationSchema = zod_1.z.object({
    oldPassword: zod_1.z.string().min(6),
    newPassword: zod_1.z.string().min(6),
});
exports.authValidation = {
    UserLoginValidationSchema,
    changePasswordValidationSchema,
    UserRegisterValidationSchema,
};
