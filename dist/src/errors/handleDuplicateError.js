"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handlePrismaDuplicateError = (err) => {
    var _a;
    const errorSources = [];
    let message = 'Duplicate entry';
    const statusCode = 409;
    if (err.code === 'P2002') {
        const target = (_a = err.meta) === null || _a === void 0 ? void 0 : _a.target;
        const field = Array.isArray(target) && target.length > 0 ? target[0] : 'unknown';
        message = `Duplicate field: ${field}`;
        errorSources.push({
            path: field,
            message: `A shop with this ${field} already exists`,
        });
    }
    return {
        statusCode,
        message,
        errorSources,
    };
};
exports.default = handlePrismaDuplicateError;
