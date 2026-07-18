export type MarketplaceCategory =
  | "books"
  | "stories"
  | "games"
  | "activities"
  | "printables"
  | "therapy_plans"
  | "courses"
  | "videos"
  | "webinars"
  | "templates"
  | "tools"
  | "guides"
  | "routines"
  | "aac"; // comunicação alternativa

export interface Author {
  id: string;
  displayName: string;
  bio: string;
  specialties: string[];
  avatarUrl?: string;
  rating: number;
  followers: number;
}

export interface Product {
  id: string;
  category: MarketplaceCategory;
  authorId: string;
  title: string;
  description: string;
  price: number; // 0 = grátis
  currency: "BRL" | "USD";
  rating: number;
  reviewCount: number;
  coverUrl?: string;
  tags: string[];
}

export interface Order {
  id: string;
  buyerId: string;
  items: Array<{ productId: string; quantity: number; unitPrice: number }>;
  total: number;
  status: "pending" | "paid" | "refunded" | "cancelled";
  createdAt: string;
}
