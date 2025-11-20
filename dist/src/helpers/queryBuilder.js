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
exports.parseProductQuery = void 0;
class QueryBuilder {
    buildNestedCondition(path, value, index = 0, condition = {}) {
        const key = path[index];
        condition[key] =
            index === path.length - 1
                ? value
                : this.buildNestedCondition(path, value, index + 1, {});
        return condition;
    }
    pick(keys) {
        const finalObj = {};
        for (const key of keys) {
            if (this.query && Object.hasOwnProperty.call(this.query, key)) {
                finalObj[key] = this.query[key];
            }
        }
        return finalObj;
    }
    // Helper method to build and apply conditions
    applyCondition({ nestedField, condition }) {
        var _a, _b;
        const pathSegments = nestedField === null || nestedField === void 0 ? void 0 : nestedField.split('.');
        const existingOrCondition = ((_b = (_a = this.prismaQuery) === null || _a === void 0 ? void 0 : _a.where) === null || _b === void 0 ? void 0 : _b.OR) || [];
        const finalCondition = pathSegments
            ? this.buildNestedCondition(pathSegments, condition)
            : condition;
        this.prismaQuery.where = Object.assign(Object.assign({}, this.prismaQuery.where), { OR: [...existingOrCondition, finalCondition] });
    }
    constructor(query, model, staticFilter = {}) {
        this.prismaQuery = {}; // Define as any for flexibility
        this.model = model; // Prisma model instance
        this.query = query; // Query params
        this.prismaQuery.where = Object.assign(Object.assign({}, this.prismaQuery.where), staticFilter);
    }
    // Search
    search(searchableFields) {
        const searchTerm = this.query.searchTerm;
        if (searchTerm) {
            this.prismaQuery.where = Object.assign(Object.assign({}, this.prismaQuery.where), { OR: searchableFields.map((field) => ({
                    [field]: { contains: searchTerm, mode: 'insensitive' },
                })) });
        }
        return this;
    }
    /**
   * Filter for array fields in MongoDB (Prisma)
   * @param arrayFields - list of fields to search in arrays
   * Example usage:
   *   queryBuilder.arraySearch(['tags', 'bestFor'])
   */
    arraySearch(arrayFields) {
        arrayFields.forEach((field) => {
            const value = this.query[field];
            if (value) {
                // If value is a comma-separated string, convert to array
                const valuesArray = typeof value === 'string' ? value.split(',') : [value];
                // Add a "hasSome" filter for MongoDB arrays
                this.prismaQuery.where = Object.assign(Object.assign({}, this.prismaQuery.where), { [field]: { hasSome: valuesArray } });
            }
        });
        return this; // enable chaining
    }
    // Filter
    filter(includeFeilds = []) {
        const queryObj = this.pick(includeFeilds);
        // if (Object.keys(queryObj).length === 0) return this;
        const formattedFilters = {};
        for (const [key, value] of Object.entries(queryObj)) {
            if (typeof value === 'string' && value.includes('[')) {
                const [field, operator] = key.split('[');
                const op = operator.slice(0, -1); // Remove the closing ']'
                formattedFilters[field] = { [op]: parseFloat(value) };
            }
            else {
                formattedFilters[key] = value;
            }
        }
        this.prismaQuery.where = Object.assign(Object.assign({}, this.prismaQuery.where), formattedFilters);
        return this;
    }
    nestedFilter(nestedFilters) {
        nestedFilters.forEach(({ key, searchOption, queryFields }) => {
            var _a, _b, _c, _d, _e, _f;
            const pathSegments = key.split('.');
            const queryObj = this.pick(queryFields);
            if (Object.keys(queryObj).length === 0 && searchOption !== 'search')
                return;
            const orConditions = ((_b = (_a = this.prismaQuery) === null || _a === void 0 ? void 0 : _a.where) === null || _b === void 0 ? void 0 : _b.OR) || [];
            const AndConditions = ((_d = (_c = this.prismaQuery) === null || _c === void 0 ? void 0 : _c.where) === null || _d === void 0 ? void 0 : _d.AND) || [];
            if (searchOption == 'search') {
                if (this.query.searchTerm) {
                    const nestedCondition = queryFields.map((field) => {
                        const condition = {
                            [field]: {
                                contains: this.query.searchTerm,
                                mode: 'insensitive',
                            },
                        };
                        console.log(condition, ' check nested search query');
                        console.log(pathSegments, ' check nested search query');
                        console.log(this.buildNestedCondition(pathSegments, condition), ' check nested search query');
                        return this.buildNestedCondition(pathSegments, condition);
                    });
                    console.log(nestedCondition, ' check nested search query');
                    this.prismaQuery.where = Object.assign(Object.assign({}, (_e = this.prismaQuery) === null || _e === void 0 ? void 0 : _e.where), { OR: [...orConditions, ...nestedCondition] });
                }
            }
            else if (searchOption === 'partial') {
                const partialConditions = Object.entries(queryObj).map(([key, value]) => {
                    const condition = {
                        [key]: { equals: value, mode: 'insensitive' },
                    };
                    return this.buildNestedCondition(pathSegments, condition);
                });
                this.prismaQuery.where = Object.assign(Object.assign({}, this.prismaQuery.where), { OR: [...orConditions, ...partialConditions] });
            }
            else {
                // Handle object query fields
                const nestedConditions = Object.entries(queryObj).map(([field, value]) => {
                    console.log(field, value, ' check nested filter query');
                    let condition = {};
                    switch (searchOption) {
                        case 'enum':
                            condition = { [field]: { equals: value } };
                            break;
                        case 'exact':
                            condition = { [field]: { equals: value, mode: 'insensitive' } };
                            break;
                        default:
                            condition = {
                                [field]: { contains: value, mode: 'insensitive' },
                            };
                    }
                    return this.buildNestedCondition(pathSegments, condition);
                });
                this.prismaQuery.where = Object.assign(Object.assign({}, (_f = this.prismaQuery) === null || _f === void 0 ? void 0 : _f.where), { AND: [...AndConditions, ...nestedConditions] });
            }
        });
        return this;
    }
    //raw filter
    rawFilter(filters) {
        // Ensure that the filters are merged correctly with the existing where conditions
        this.prismaQuery.where = Object.assign(Object.assign({}, this.prismaQuery.where), filters);
        return this;
    }
    // Range (Between) Filter
    filterByRange(betweenFilters) {
        betweenFilters.forEach(({ field, maxQueryKey, minQueryKey, nestedField, dataType }) => {
            const queryObj = this.pick([maxQueryKey, minQueryKey]);
            let maxValue = queryObj[maxQueryKey];
            let minValue = queryObj[minQueryKey];
            if (!maxValue && !minValue)
                return;
            // Helper function to cast values based on data type
            const castValue = (value) => {
                if (dataType === 'date') {
                    const dateParts = value.split('-');
                    const utcDate = new Date(Date.UTC(dateParts[0], Number(dateParts[1]) - 1, dateParts[2]));
                    return utcDate;
                }
                if (dataType === 'number')
                    return Number(value);
                return value;
            };
            if (maxValue)
                maxValue = castValue(maxValue);
            if (minValue)
                minValue = castValue(minValue);
            let condition;
            // ✅ Special handling for nestedField (like `variants`)
            if (nestedField) {
                condition = {
                    [nestedField]: {
                        some: {
                            [field]: Object.assign(Object.assign({}, (minValue !== undefined ? { gte: minValue } : {})), (maxValue !== undefined ? { lte: maxValue } : {})),
                        },
                    },
                };
            }
            else {
                condition = {
                    [field]: Object.assign(Object.assign({}, (minValue !== undefined ? { gte: minValue } : {})), (maxValue !== undefined ? { lte: maxValue } : {})),
                };
            }
            this.prismaQuery.where = Object.assign(Object.assign({}, this.prismaQuery.where), condition);
        });
        return this;
    }
    // Sorting
    sort(samAvgFields = []) {
        var _a;
        const sort = ((_a = this.query.sort) === null || _a === void 0 ? void 0 : _a.split(',')) || ['-createdAt'];
        const orderBy = sort.map((field) => {
            if (field.startsWith('-')) {
                return { [field.slice(1)]: 'desc' };
            }
            return { [field]: 'asc' };
        });
        this.prismaQuery.orderBy = orderBy;
        return this;
    }
    // Pagination
    paginate() {
        const page = Number(this.query.page) || 1;
        const limit = Number(this.query.limit) || 10;
        const skip = (page - 1) * limit;
        this.prismaQuery.skip = skip;
        this.prismaQuery.take = limit;
        return this;
    }
    // Fields Selection
    fields() {
        var _a;
        const fields = ((_a = this.query.fields) === null || _a === void 0 ? void 0 : _a.split(',')) || [];
        if (fields.length > 0) {
            this.prismaQuery.select = fields.reduce((acc, field) => {
                acc[field] = true;
                return acc;
            }, {});
        }
        return this;
    }
    // *Include Related Models/
    include(includableFields) {
        var _a;
        this.prismaQuery.include = Object.assign(Object.assign({}, (_a = this.prismaQuery) === null || _a === void 0 ? void 0 : _a.include), includableFields);
        return this;
    }
    getAllQueries() {
        return this.prismaQuery;
    }
    // *Execute Query/
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.model.findMany(this.prismaQuery);
        });
    }
    // Count Total
    countTotal() {
        return __awaiter(this, void 0, void 0, function* () {
            const total = yield this.model.count({ where: this.prismaQuery.where });
            const page = Number(this.query.page) || 1;
            const limit = Number(this.query.limit) || 10;
            const totalPage = Math.ceil(total / limit);
            return {
                page,
                limit,
                total,
                totalPage,
            };
        });
    }
}
exports.default = QueryBuilder;
const parseProductQuery = (query) => {
    return {
        categories: query.categories
            ? Array.isArray(query.categories)
                ? query.categories.map(String)
                : [String(query.categories)]
            : [],
        brands: query.brands
            ? Array.isArray(query.brands)
                ? query.brands.map(String)
                : [String(query.brands)]
            : [],
        priceRange: {
            min: query.minPrice ? Number(query.minPrice) : 0,
            max: query.maxPrice ? Number(query.maxPrice) : 0,
        },
        origins: query.origins
            ? Array.isArray(query.origins)
                ? query.origins.map(String)
                : [String(query.origins)]
            : [],
        accords: query.accords
            ? Array.isArray(query.accords)
                ? query.accords.map(String)
                : [String(query.accords)]
            : [],
        page: query.page ? Number(query.page) : 1,
        limit: query.limit ? Number(query.limit) : 10,
        sort: query.sort ? String(query.sort) : '-createdAt',
        searchTerm: query.searchTerm ? String(query.searchTerm) : '',
    };
};
exports.parseProductQuery = parseProductQuery;
function parseSelect(input) {
    const select = {};
    // Handle root fields (fields directly on the model)
    for (const field of input.own || []) {
        select[field] = true;
    }
    // Handle nested models
    for (const nestedItem of input.nested || []) {
        const [modelKey, fields, nestedChildren] = nestedItem;
        // Initialize the model key in select object with an empty 'select' object
        if (!select[modelKey]) {
            select[modelKey] = { select: {} };
        }
        // Add fields to the nested model's 'select' object
        if (Array.isArray(fields) && fields.length > 0) {
            fields.forEach((field) => {
                select[modelKey].select[field] = true;
            });
        }
        // If there are nested children, recurse into them and assign to the 'select' key
        if (Array.isArray(nestedChildren) && nestedChildren.length > 0) {
            select[modelKey].select = Object.assign(Object.assign({}, select[modelKey].select), parseSelect({
                own: [], // No root fields for nested models
                nested: nestedChildren,
            }));
        }
    }
    return select;
}
const fields = {
    own: ['status', 'email'],
    nested: [
        [
            'user',
            ['status', 'subscriptionStatus'],
            [['profile', ['name', 'img'], [['member', ['id', 'status']]]]],
        ],
        ['admin', ['name', 'img'], [['notification', ['id', 'status']]]],
    ],
};
