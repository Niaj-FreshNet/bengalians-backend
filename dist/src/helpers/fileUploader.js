"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = exports.createStorage = void 0;
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const slugify_1 = require("../utils/slugify");
const fileFilter_1 = require("./fileFilter");
const uploadDir = path_1.default.join(process.cwd(), "uploads");
// Ensure the directory exists
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
// local file storage
const createStorage = (folder) => {
    const uploadFolder = folder
        ? path_1.default.join(process.cwd(), "uploads", folder)
        : path_1.default.join(process.cwd(), "uploads");
    return multer_1.default.diskStorage({
        destination: function (req, file, cb) {
            cb(null, uploadFolder);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = `${(0, uuid_1.v4)()}-${Date.now()}`;
            const fileExtension = path_1.default.extname(file.originalname);
            const slugifiedName = (0, slugify_1.slugify)(path_1.default.basename(file.originalname, fileExtension));
            const fileName = `${slugifiedName}-${uniqueSuffix}${fileExtension}`;
            cb(null, fileName);
        },
    });
};
exports.createStorage = createStorage;
exports.upload = (0, multer_1.default)({
    storage: (0, exports.createStorage)(),
    fileFilter: fileFilter_1.fileFilter,
});
