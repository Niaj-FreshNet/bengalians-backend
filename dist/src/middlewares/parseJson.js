"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseJsonFields = parseJsonFields;
function parseJsonFields(req, res, next) {
    const body = req.body || {};
    // List of fields that can be JSON
    const jsonFields = [
        'variants',
        'tags',
        'perfumeNotes',
        'accords',
        'bestFor',
    ];
    jsonFields.forEach((field) => {
        if (body[field] !== undefined) {
            // If it's a string, try parsing
            if (typeof body[field] === 'string') {
                try {
                    body[field] = JSON.parse(body[field]);
                }
                catch (err) {
                    return res.status(400).json({ message: `${field} must be valid JSON` });
                }
            }
            // If it's already an object/array, leave it as-is
        }
    });
    // Convert 'published' string to boolean
    if (body.published !== undefined) {
        if (typeof body.published === 'string') {
            body.published = body.published.toLowerCase() === 'true';
        }
        // if it's already boolean, leave it
    }
    // 🔥 Convert numeric fields
    const numberFields = ["stock", "price", "size"];
    numberFields.forEach((field) => {
        if (body[field] !== undefined && body[field] !== null) {
            const num = Number(body[field]);
            if (!isNaN(num)) {
                body[field] = num;
            }
        }
    });
    next();
}
