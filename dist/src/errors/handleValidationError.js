"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
// Handle Prisma validation errors (e.g., unique constraint violations, invalid data)
const handleValidationError = (err) => {
    var _a;
    let errorSources = [];
    // Handle PrismaClientKnownRequestError (e.g., unique constraint violations)
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
            // P2002 is the Prisma error code for unique constraint violations
            const target = ((_a = err.meta) === null || _a === void 0 ? void 0 : _a.target) || [];
            errorSources = target.map((field) => ({
                path: field,
                message: `Duplicate value for ${field}`,
            }));
        }
        else {
            // Handle other known request errors
            errorSources = [
                {
                    path: '',
                    message: err.message || 'Invalid database operation',
                },
            ];
        }
    }
    // Handle PrismaClientValidationError (e.g., invalid data types or missing fields)
    if (err instanceof client_1.Prisma.PrismaClientValidationError) {
        errorSources = [
            {
                path: '',
                message: err.message.split('\n').pop() || 'Validation error in query', // Extract the last line for clarity
            },
        ];
    }
    const statusCode = 400;
    return {
        statusCode,
        message: 'Validation Error',
        errorSources,
    };
};
exports.default = handleValidationError;
