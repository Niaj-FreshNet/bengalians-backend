"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileFilter = void 0;
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/bmp",
        "image/tiff",
        "image/webp",
        "audio/mpeg",
        "video/mp4",
        "application/pdf",
    ];
    if (allowedMimeTypes.includes(file.mimetype) ||
        file.mimetype.startsWith("image/")) {
        allowedMimeTypes.includes(file.mimetype);
        cb(null, true);
    }
    else {
        cb(new Error("Invalid file type"), false);
    }
};
exports.fileFilter = fileFilter;
