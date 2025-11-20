import { ClothingSize, Gender, FitType } from '@prisma/client';

// Base Product Variant Interface (aligned with apparel schema)
export interface IProductVariant {
  sku: string;
  size: ClothingSize; // Changed to ClothingSize enum
  color: string; // Required for apparel
  price: number;
  costPrice?: number;
  stock: number; // Stock at variant level (required)
  images?: string[]; // Variant-specific images
}

// Color Interface
export interface IColor {
  id: string;
  colorName: string;
  hexCode?: string;
  imageUrl?: string;
}

// Fabric Interface
export interface IFabric {
  id: string;
  fabricName: string;
  imageUrl?: string;
  description?: string;
}

// Collection Interface
export interface ICollection {
  id: string;
  collectionName: string;
  imageUrl?: string;
  description?: string;
  season?: string;
}

// Product Creation Interface
export interface IProduct {
  name: string;
  description: string;
  slug: string;
  primaryImage: string;
  otherImages?: string[];
  videoUrl?: string;
  tags: string[];

  // Apparel specifications
  brand?: string;
  gender?: Gender; // Enum: MEN, WOMEN, UNISEX, BOYS, GIRLS
  fitType?: FitType; // Enum: SLIM, REGULAR, RELAXED, OVERSIZED, TAILORED
  pattern?: string; // e.g., "Solid", "Striped", "Floral"
  neckline?: string; // e.g., "Round", "V-neck", "Collar"
  sleeveType?: string; // e.g., "Full Sleeve", "Half Sleeve", "Sleeveless"
  occasion?: string[]; // e.g., ["Casual", "Formal", "Party"]
  careInstructions?: string; // Washing and care details
  sustainable?: boolean; // Eco-friendly product flag
  madeIn?: string; // Country of origin

  categoryId: string;
  collectionId?: string; // Optional collection reference
  published: boolean;

  fabricIds?: string[]; // Array of fabric IDs
  materialIds?: string[]; // Array of fabric IDs
  
  reviews?: IReview[];
  averageRating?: number;
  reviewCount?: number;

  supplier?: string;
  variants: IProductVariant[]; // Required - must have at least one variant
}

// Product Update Interface
export interface IUpdateProduct {
  name?: string;
  description?: string;
  primaryImage?: string;
  otherImages?: string[];
  videoUrl?: string;
  tags?: string[];

  // Apparel specifications
  brand?: string;
  gender?: Gender;
  fitType?: FitType;
  pattern?: string;
  neckline?: string;
  sleeveType?: string;
  occasion?: string[];
  careInstructions?: string;
  sustainable?: boolean;
  madeIn?: string;

  categoryId?: string;
  collectionId?: string;
  published?: boolean;

  fabricIds?: string[];

  // Image handling
  imagesToKeep?: string[];
  newImages?: string[];

  variants?: IProductVariant[];
  supplier?: string;
}

// Query Interfaces
export interface IProductQuery {
  search?: string;
  category?: string; // Single category ID
  categories?: { id: string; name: string }[]; // Multiple categories
  collection?: string; // Collection ID
  brand?: string;
  gender?: Gender | string;
  fitType?: FitType | string;
  color?: string; // Color name or ID
  size?: ClothingSize | string;
  pattern?: string;
  occasion?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string;
  stock?: 'in' | 'out';
  sustainable?: boolean;
  sortBy?: 'name' | 'price_asc' | 'price_desc' | 'newest' | 'oldest' | 'popularity' | 'rating_asc' | 'rating_desc';
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

export interface IReview {
  id: string;
  rating: number;
  title: string;
  comment: string;
  isPublished: boolean;
  productId: string;
  userId?: string;
  user?: {
    name: string;
    imageUrl: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Response Interfaces
export interface IProductResponse {
  id: string;
  name: string;
  slug: string;
  description: string;
  primaryImage: string;
  otherImages: string[];
  videoUrl?: string;
  tags: string[];
  salesCount: number;
  published: boolean;

  // Apparel specifications
  brand?: string;
  gender?: Gender;
  fitType?: FitType;
  pattern?: string;
  neckline?: string;
  sleeveType?: string;
  occasion?: string[];
  careInstructions?: string;
  sustainable?: boolean;
  madeIn?: string;

  categoryId: string;
  category?: {
    id: string;
    categoryName: string;
    imageUrl?: string;
    description?: string;
  };

  collectionId?: string;
  collection?: ICollection;

  fabricIds?: string[];
  fabrics?: IFabric[];

  reviews: IReview[];
  averageRating: number;
  reviewCount: number;

  supplier?: string;

  variants: IProductVariantResponse[];

  // Computed fields
  minPrice: number;
  maxPrice: number;
  totalStock: number; // Sum of all variant stocks
  inStock: boolean; // True if any variant has stock > 0
  availableSizes?: ClothingSize[]; // Unique sizes from variants
  availableColors?: string[]; // Unique colors from variants

  // Related products (optional, included in detail view)
  relatedProducts?: IProductResponse[];

  createdAt: Date;
  updatedAt: Date;
}

export interface IProductVariantResponse {
  id: string;
  sku: string;
  size: ClothingSize;
  color: string; // Populated color object
  price: number;
  costPrice?: number;
  stock: number;
  images?: string[];
  productId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Analytics Interfaces
export interface IProductAnalytics {
  totalProducts: number;
  publishedProducts: number;
  unpublishedProducts: number;
  totalVariants: number;
  lowStockVariants: number; // Variants with stock <= threshold
  outOfStockVariants: number; // Variants with stock = 0
  totalValue: number;
  averagePrice: number;
  topCategories: Array<{
    categoryName: string;
    productCount: number;
    percentage: number;
  }>;
  topBrands: Array<{
    brand: string;
    productCount: number;
    percentage: number;
  }>;
  topCollections?: Array<{
    collectionName: string;
    productCount: number;
    percentage: number;
  }>;
}

// Stock Update Interface
export interface IStockUpdate {
  variantId: string; // Now required - stock is at variant level
  addedStock: number; // Positive or negative number to add/subtract
  reason?: string; // e.g., "RESTOCK", "SALE", "RETURN", "DAMAGED", "ADJUSTMENT"
  notes?: string; // Additional context
}

// Bulk Stock Update Interface
export interface IBulkStockUpdate {
  updates: Array<{
    variantId: string;
    addedStock: number;
    reason?: string;
  }>;
}

// Search Result Interface
export interface IProductSearchResult {
  data: IProductResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  filters: {
    brands: string[];
    categories: { id: string; name: string }[];
    collections: { id: string; name: string }[];
    priceRange: {
      min: number;
      max: number;
    };
    genders: Gender[];
    fitTypes: FitType[];
    colors?: IColor[];
    sizes?: ClothingSize[];
  };
}

// Trending Product Interface
export interface ITrendingProduct extends IProductResponse {
  totalSold: number;
  trendingScore: number;
}

// Related Products Interface
export interface IRelatedProductsResponse {
  sameBrand: IProductResponse[];
  sameCategory: IProductResponse[];
  sameGender: IProductResponse[]; // New for apparel
  sameCollection: IProductResponse[]; // New for apparel
  recentlyViewed?: IProductResponse[];
}

// Low Stock Product Interface
export interface ILowStockProduct {
  id: string;
  name: string;
  category: string;
  lowStockVariants: Array<{
    id: string;
    sku: string;
    size: ClothingSize;
    color: string;
    stock: number;
  }>;
}

// Out of Stock Product Interface
export interface IOutOfStockProduct {
  id: string;
  name: string;
  category: string;
  variants: Array<{
    id: string;
    sku: string;
    size: ClothingSize;
    color: string;
    stock: number;
  }>;
}

// Stock Log Interface
export interface IStockLog {
  id: string;
  productId: string;
  variantId: string;
  change: number;
  reason: string;
  notes?: string;
  createdAt: string;
  product: {
    name: string;
  };
  variant?: {
    sku: string;
    size: ClothingSize;
    color: string;
  };
}

// Navbar Products Interface
export interface INavbarProducts {
  trendingByCategory: Record<string, Array<{ id: string; name: string }>>;
  overallTrending: Array<{ id: string; name: string }>;
}

// Product by Category/Collection Response
export interface IProductListResponse {
  data: IProductResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPage: number;
  };
}

// Variant Stock Update Result
export interface IVariantStockUpdateResult {
  id: string;
  sku: string;
  size: ClothingSize;
  color: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  stock: number;
  images?: string[];
  productId: string;
  createdAt: Date;
  updatedAt: Date;
}

// export default {
//   IProduct,
//   IUpdateProduct,
//   IProductQuery,
//   IProductResponse,
//   IProductVariantResponse,
//   IProductAnalytics,
//   IStockUpdate,
//   IBulkStockUpdate,
//   IProductSearchResult,
//   ITrendingProduct,
//   IRelatedProductsResponse,
//   IProductVariant,
//   IColor,
//   IFabric,
//   ICollection,
//   ILowStockProduct,
//   IOutOfStockProduct,
//   IStockLog,
//   INavbarProducts,
//   IProductListResponse,
//   IVariantStockUpdateResult,
// };