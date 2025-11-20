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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaQueryBuilder = void 0;
class PrismaQueryBuilder {
    constructor(query, searchableFields = []) {
        this.prismaQuery = {};
        this.getPaginationMeta = (model) => __awaiter(this, void 0, void 0, function* () {
            const total = yield model.count({ where: this.prismaQuery.where });
            const page = Number(this.queryParams.page) || 1;
            const limit = Number(this.queryParams.limit) || 10;
            const totalPage = Math.ceil(total / limit);
            return { total, totalPage, page, limit };
        });
        this.queryParams = query;
        this.searchableFields = searchableFields;
    }
    buildWhere() {
        const _a = this.queryParams, { searchTerm, sort, limit, page, fields } = _a, filters = __rest(_a, ["searchTerm", "sort", "limit", "page", "fields"]);
        let where = {};
        if (searchTerm && this.searchableFields.length > 0) {
            where.OR = this.searchableFields.map((field) => ({
                [field]: { contains: searchTerm, mode: 'insensitive' },
            }));
        }
        if (Object.keys(filters).length) {
            where = Object.assign(Object.assign({}, where), filters);
        }
        this.prismaQuery.where = where;
        return this;
    }
    buildSort() {
        const sortStr = this.queryParams.sort || '-createdAt';
        const sortFields = sortStr.split(',').map((field) => {
            const order = field.startsWith('-') ? 'desc' : 'asc';
            const key = field.replace(/^-/, '');
            return { [key]: order };
        });
        this.prismaQuery.orderBy = sortFields;
        return this;
    }
    buildPagination() {
        const page = Number(this.queryParams.page) || 1;
        const limit = Number(this.queryParams.limit) || 10;
        const skip = (page - 1) * limit;
        this.prismaQuery.skip = skip;
        this.prismaQuery.take = limit;
        return this;
    }
    buildSelect() {
        if (this.queryParams.fields) {
            const fields = this.queryParams.fields.split(',');
            this.prismaQuery.select = fields.reduce((acc, field) => {
                acc[field] = true;
                return acc;
            }, {});
        }
        return this;
    }
    getQuery() {
        return this.prismaQuery;
    }
}
exports.PrismaQueryBuilder = PrismaQueryBuilder;
