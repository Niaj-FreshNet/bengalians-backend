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
exports.deleteFile = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Deletes a file from the uploads folder if an error occurs.
 * @param filePath The path of the file to delete.
 */
const deleteFile = (fileUrl) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Extract the filename from the URL
        const filename = path_1.default.basename(new URL(fileUrl).pathname);
        const fullPath = path_1.default.join(process.cwd(), "uploads", filename);
        // console.log(filename, fullPath);
        yield fs_1.default.promises.access(fullPath);
        yield fs_1.default.promises.unlink(fullPath);
        // console.log(`Deleted file: ${filename}`);
    }
    catch (error) {
        console.error(`Failed to delete file: ${fileUrl}`, error);
    }
});
exports.deleteFile = deleteFile;
