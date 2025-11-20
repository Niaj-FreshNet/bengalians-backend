import { IProductVariant } from '../modules/Product/product.interface';

/**
 * Generate SKU based on product details and variant
 */
export const generateSKU = (
  productName: string,
  brand?: string,
  size?: number,
  unit?: string
): string => {
  const brandCode = brand ? brand.substring(0, 3).toUpperCase() : 'GEN';
  const nameCode = productName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
  const sizeCode = size ? `${size}${unit || 'ML'}` : '';
  const timestamp = Date.now().toString().slice(-4);
  
  return `${brandCode}-${nameCode}-${sizeCode}-${timestamp}`;
};

/**
 * Validate perfume notes structure
 */
export const validatePerfumeNotes = (notes: any): boolean => {
  if (!notes || typeof notes !== 'object') return true; // Optional field

  const validCategories = ['top', 'middle', 'base'];
  
  for (const category of validCategories) {
    if (notes[category] && !Array.isArray(notes[category])) {
      return false;
    }
  }
  
  return true;
};

/**
 * Calculate product price range from variants
 */
export const calculatePriceRange = (variants: IProductVariant[]) => {
  if (!variants.length) return { min: 0, max: 0 };
  
  const prices = variants.map(v => v.price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
};

/**
 * Calculate total stock from variants
 */
export const calculateTotalStock = (variants: IProductVariant[]): number => {
  return variants.reduce((total, variant) => total + variant.stock, 0);
};

/**
 * Check if product is in stock
 */
export const isProductInStock = (variants: IProductVariant[]): boolean => {
  return variants.some(variant => variant.stock > 0);
};

/**
 * Get best selling variants (top 3)
 */
export const getBestSellingVariants = (variants: any[]): any[] => {
  return variants
    .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
    .slice(0, 3);
};

/**
 * Format perfume size for display
 */
export const formatSize = (size: number, unit: string): string => {
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

/**
 * Calculate discount percentage
 */
export const calculateDiscountPercentage = (originalPrice: number, discountedPrice: number): number => {
  if (originalPrice <= 0) return 0;
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
};

/**
 * Parse search tags from string
 */
export const parseSearchTags = (tagsString: string): string[] => {
  if (!tagsString) return [];
  return tagsString
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
};

/**
 * Generate search keywords for better search functionality
 */
export const generateSearchKeywords = (product: {
  name: string;
  brand?: string;
  tags: string[];
  accords: string[];
  bestFor: string[];
}): string[] => {
  const keywords = new Set<string>();
  
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

/**
 * Validate variant stock levels
 */
export const validateStockLevels = (variants: IProductVariant[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
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

/**
 * Sort products by custom criteria
 */
export const sortProducts = (products: any[], sortBy: string): any[] => {
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

/**
 * Filter products by stock status
 */
export const filterByStock = (products: any[], stockFilter: 'in' | 'out'): any[] => {
  if (!stockFilter) return products;
  
  return products.filter(product => {
    const hasStock = product.variants.some((v: any) => v.stock > 0);
    return stockFilter === 'in' ? hasStock : !hasStock;
  });
};

/**
 * Get product availability status
 */
export const getAvailabilityStatus = (variants: IProductVariant[]): {
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  message: string;
  count: number;
} => {
  const totalStock = calculateTotalStock(variants);
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

/**
 * Generate product URL slug
 */
export const generateProductSlug = (name: string, id: string): string => {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  return `${slug}-${id.slice(-6)}`;
};

/**
 * Calculate product rating from reviews
 */
export const calculateAverageRating = (reviews: { rating: number }[]): {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
} => {
  if (!reviews.length) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }
  
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;
  
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(review => {
    distribution[review.rating] = (distribution[review.rating] || 0) + 1;
  });
  
  return {
    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
    totalReviews: reviews.length,
    ratingDistribution: distribution,
  };
};

/**
 * Get recommended products based on user preferences
 */
export const getRecommendationScore = (
  product: any,
  userPreferences: {
    favoriteAccords?: string[];
    favoriteBrands?: string[];
    priceRange?: { min: number; max: number };
    gender?: string;
  }
): number => {
  let score = 0;
  
  // Brand preference
  if (userPreferences.favoriteBrands?.includes(product.brand)) {
    score += 3;
  }
  
  // Accord preference
  const commonAccords = product.accords.filter((accord: string) =>
    userPreferences.favoriteAccords?.includes(accord)
  );
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

export default {
  generateSKU,
  validatePerfumeNotes,
  calculatePriceRange,
  calculateTotalStock,
  isProductInStock,
  getBestSellingVariants,
  formatSize,
  calculateDiscountPercentage,
  parseSearchTags,
  generateSearchKeywords,
  validateStockLevels,
  sortProducts,
  filterByStock,
  getAvailabilityStatus,
  generateProductSlug,
  calculateAverageRating,
  getRecommendationScore,
};