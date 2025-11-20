"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handleCastError = (err) => {
    var _a;
    let errorSources = [];
    let message = 'Database error';
    const statusCode = 400;
    // Handle invalid ObjectID (like Mongoose CastError)
    if (err.code === 'P2023') {
        // Prisma error code for malformed ID
        message = 'Invalid ID format';
        errorSources = [
            {
                path: '', // Prisma doesn't provide path directly, adjust if needed
                message: 'The provided ID is not valid',
            },
        ];
    }
    // Handle other known Prisma errors (optional)
    else if (err.code === 'P2025') {
        // Record not found
        message = 'Record not found';
        errorSources = [
            {
                path: '',
                message: typeof ((_a = err.meta) === null || _a === void 0 ? void 0 : _a.cause) === 'string'
                    ? err.meta.cause
                    : 'No record found for the given ID',
            },
        ];
    }
    return {
        statusCode,
        message,
        errorSources,
    };
};
exports.default = handleCastError;
