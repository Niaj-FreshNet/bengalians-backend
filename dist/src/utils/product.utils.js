"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecommendationScore = exports.calculateAverageRating = exports.generateProductSlug = exports.getAvailabilityStatus = exports.filterByStock = exports.sortProducts = exports.validateStockLevels = exports.generateSearchKeywords = exports.parseSearchTags = exports.calculateDiscountPercentage = exports.formatSize = exports.getBestSellingVariants = exports.isProductInStock = exports.calculateTotalStock = exports.calculatePriceRange = exports.validatePerfumeNotes = exports.generateSKU = void 0;
/**
 * Generate SKU based on product details and variant
 */
const generateSKU = (productName, brand, size, unit) => {
    const brandCode = brand ? brand.substring(0, 3).toUpperCase() : 'GEN';
    const nameCode = productName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
    const sizeCode = size ? `${size}${unit || 'ML'}` : '';
    const timestamp = Date.now().toString().slice(-4);
    return `${brandCode}-${nameCode}-${sizeCode}-${timestamp}`;
};
exports.generateSKU = generateSKU;
/**
 * Validate perfume notes structure
 */
const validatePerfumeNotes = (notes) => {
    if (!notes || typeof notes !== 'object')
        return true; // Optional field
    const validCategories = ['top', 'middle', 'base'];
    for (const category of validCategories) {
        if (notes[category] && !Array.isArray(notes[category])) {
            return false;
        }
    }
    return true;
};
exports.validatePerfumeNotes = validatePerfumeNotes;
/**
 * Calculate product price range from variants
 */
const calculatePriceRange = (variants) => {
    if (!variants.length)
        return { min: 0, max: 0 };
    const prices = variants.map(v => v.price);
    return {
        min: Math.min(...prices),
        max: Math.max(...prices),
    };
};
exports.calculatePriceRange = calculatePriceRange;
/**
 * Calculate total stock from variants
 */
const calculateTotalStock = (variants) => {
    return variants.reduce((total, variant) => total + variant.stock, 0);
};
exports.calculateTotalStock = calculateTotalStock;
/**
 * Check if product is in stock
 */
const isProductInStock = (variants) => {
    return variants.some(variant => variant.stock > 0);
};
exports.isProductInStock = isProductInStock;
/**
 * Get best selling variants (top 3)
 */
const getBestSellingVariants = (variants) => {
    return variants
        .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
        .slice(0, 3);
};
exports.getBestSellingVariants = getBestSellingVariants;
/**
 * Format perfume size for display
 */
const formatSize = (size, unit) => {
    switch (unit) {
        case 'ML':
            return `${size} ml`;
        case 'GM':
            return `${size} gm`;
        case 'PIECE':
            return `${size} piece${size > 1 ? 's' : ''}`;
        default:
            return `${size}`;
    }
};
exports.formatSize = formatSize;
/**
 * Calculate discount percentage
 */
const calculateDiscountPercentage = (originalPrice, discountedPrice) => {
    if (originalPrice <= 0)
        return 0;
    return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
};
exports.calculateDiscountPercentage = calculateDiscountPercentage;
/**
 * Parse search tags from string
 */
const parseSearchTags = (tagsString) => {
    if (!tagsString)
        return [];
    return tagsString
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
};
exports.parseSearchTags = parseSearchTags;
/**
 * Generate search keywords for better search functionality
 */
const generateSearchKeywords = (product) => {
    const keywords = new Set();
    // Add name words
    product.name.toLowerCase().split(' ').forEach(word => keywords.add(word));
    // Add brand
    if (product.brand) {
        keywords.add(product.brand.toLowerCase());
    }
    // Add tags, accords, bestFor
    [...product.tags, ...product.accords, ...product.bestFor].forEach(item => {
        keywords.add(item.toLowerCase().replace(/_/g, ' '));
    });
    return Array.from(keywords).filter(keyword => keyword.length > 2);
};
exports.generateSearchKeywords = generateSearchKeywords;
/**
 * Validate variant stock levels
 */
const validateStockLevels = (variants) => {
    const errors = [];
    variants.forEach((variant, index) => {
        if (variant.stock < 0) {
            errors.push(`Variant ${index + 1}: Stock cannot be negative`);
        }
        if (variant.price <= 0) {
            errors.push(`Variant ${index + 1}: Price must be greater than zero`);
        }
    });
    return {
        isValid: errors.length === 0,
        errors,
    };
};
exports.validateStockLevels = validateStockLevels;
/**
 * Sort products by custom criteria
 */
const sortProducts = (products, sortBy) => {
    const sorted = [...products];
    switch (sortBy) {
        case 'name':
            return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case 'name_desc':
            return sorted.sort((a, b) => b.name.localeCompare(a.name));
        case 'price_asc':
            return sorted.sort((a, b) => a.minPrice - b.minPrice);
        case 'price_desc':
            return sorted.sort((a, b) => b.minPrice - a.minPrice);
        case 'newest':
            return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        case 'oldest':
            return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        case 'popularity':
            return sorted.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
        default:
            return sorted;
    }
};
exports.sortProducts = sortProducts;
/**
 * Filter products by stock status
 */
const filterByStock = (products, stockFilter) => {
    if (!stockFilter)
        return products;
    return products.filter(product => {
        const hasStock = product.variants.some((v) => v.stock > 0);
        return stockFilter === 'in' ? hasStock : !hasStock;
    });
};
exports.filterByStock = filterByStock;
/**
 * Get product availability status
 */
const getAvailabilityStatus = (variants) => {
    const totalStock = (0, exports.calculateTotalStock)(variants);
    const inStockVariants = variants.filter(v => v.stock > 0).length;
    if (totalStock === 0) {
        return {
            status: 'out_of_stock',
            message: 'Out of stock',
            count: 0,
        };
    }
    if (totalStock <= 10) {
        return {
            status: 'low_stock',
            message: `Only ${totalStock} left in stock`,
            count: totalStock,
        };
    }
    return {
        status: 'in_stock',
        message: `In stock (${inStockVariants} variants available)`,
        count: totalStock,
    };
};
exports.getAvailabilityStatus = getAvailabilityStatus;
/**
 * Generate product URL slug
 */
const generateProductSlug = (name, id) => {
    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    return `${slug}-${id.slice(-6)}`;
};
exports.generateProductSlug = generateProductSlug;
/**
 * Calculate product rating from reviews
 */
const calculateAverageRating = (reviews) => {
    if (!reviews.length) {
        return {
            averageRating: 0,
            totalReviews: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
    }
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
        distribution[review.rating] = (distribution[review.rating] || 0) + 1;
    });
    return {
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        totalReviews: reviews.length,
        ratingDistribution: distribution,
    };
};
exports.calculateAverageRating = calculateAverageRating;
/**
 * Get recommended products based on user preferences
 */
const getRecommendationScore = (product, userPreferences) => {
    var _a;
    let score = 0;
    // Brand preference
    if ((_a = userPreferences.favoriteBrands) === null || _a === void 0 ? void 0 : _a.includes(product.brand)) {
        score += 3;
    }
    // Accord preference
    const commonAccords = product.accords.filter((accord) => { var _a; return (_a = userPreferences.favoriteAccords) === null || _a === void 0 ? void 0 : _a.includes(accord); });
    score += commonAccords.length * 2;
    // Price preference
    if (userPreferences.priceRange) {
        const { min, max } = userPreferences.priceRange;
        if (product.minPrice >= min && product.maxPrice <= max) {
            score += 2;
        }
    }
    // Gender preference
    if (userPreferences.gender &&
        (product.gender === userPreferences.gender || product.gender === 'UNISEX')) {
        score += 1;
    }
    return score;
};
exports.getRecommendationScore = getRecommendationScore;
exports.default = {
    generateSKU: exports.generateSKU,
    validatePerfumeNotes: exports.validatePerfumeNotes,
    calculatePriceRange: exports.calculatePriceRange,
    calculateTotalStock: exports.calculateTotalStock,
    isProductInStock: exports.isProductInStock,
    getBestSellingVariants: exports.getBestSellingVariants,
    formatSize: exports.formatSize,
    calculateDiscountPercentage: exports.calculateDiscountPercentage,
    parseSearchTags: exports.parseSearchTags,
    generateSearchKeywords: exports.generateSearchKeywords,
    validateStockLevels: exports.validateStockLevels,
    sortProducts: exports.sortProducts,
    filterByStock: exports.filterByStock,
    getAvailabilityStatus: exports.getAvailabilityStatus,
    generateProductSlug: exports.generateProductSlug,
    calculateAverageRating: exports.calculateAverageRating,
    getRecommendationScore: exports.getRecommendationScore,
};
