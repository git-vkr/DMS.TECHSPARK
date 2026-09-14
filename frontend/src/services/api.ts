/**
 * DMS API Client
 * Provides typed methods for interacting with the FastAPI + MongoDB backend.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export interface User {
  id: string;
  name: string;
  phone: string;
  role: 'farmer' | 'buyer' | 'fpo' | 'driver' | 'admin';
  email?: string;
  language: string;
  verified: boolean;
  location?: { lat: number; lng: number };
}

export interface QualityGradeInfo {
  grade: 'A' | 'B' | 'C';
  confidence: number;
  ripeness: number;
  disease_probability: number;
  size_uniformity: number;
  image_url?: string;
}

export interface ListingItem {
  id: string;
  farmer_id: string;
  farmer_name?: string;
  crop_name: string;
  variety?: string;
  quantity: number;
  available_quantity: number;
  unit: string;
  expected_date: string;
  location?: { lat: number; lng: number };
  quality?: QualityGradeInfo;
  pricing: { minimum_price: number; currency: string };
  status: 'DRAFT' | 'ACTIVE' | 'BIDDING' | 'SOLD' | 'EXPIRED' | 'CANCELLED';
  description?: string;
  image_urls: string[];
  created_at?: string;
}

export interface BidItem {
  id: string;
  listing_id: string;
  buyer_id: string;
  buyer_name?: string;
  price_per_unit: number;
  quantity: number;
  logistics_cost?: number;
  estimated_total?: number;
  status: string;
  message?: string;
  distance_km?: number;
  buyer_rating?: number;
  score?: number;
  created_at?: string;
}

class ApiService {
  private baseUrl = API_BASE;

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      // Ensure cookies are sent with requests
      credentials: 'include',
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      let errorDetail = 'API Error';
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || JSON.stringify(errorData);
      } catch {
        errorDetail = response.statusText;
      }
      throw new Error(errorDetail);
    }

    return response.json();
  }

  // --- Auth ---
  async getMe(): Promise<any> {
    return this.request('/auth/me');
  }

  async login(phone: string, password?: string): Promise<{ user: any }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password: password || 'password123' }),
    });
  }

  async register(data: { name: string; phone: string; password?: string; role: string; language: string; email?: string }): Promise<any> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...data, password: data.password || 'password123' }),
    });
  }

  async logout(): Promise<any> {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async sendOtp(phone: string): Promise<{ success: boolean; message: string }> {
    return this.request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone })
    });
  }

  async verifyOtp(phone: string, otp: string): Promise<{ user: any }> {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp })
    });
  }

  // --- Listings ---
  async getMyListings(): Promise<{ listings: ListingItem[]; total: number }> {
    return this.request('/listings/my');
  }

  async createListing(data: any): Promise<{ message: string; id: string }> {
    return this.request('/listings/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getListing(id: string): Promise<ListingItem> {
    return this.request<ListingItem>(`/listings/${id}`);
  }

  async uploadListingImage(listingId: string, file: File): Promise<{ image_url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${this.baseUrl}/listings/${listingId}/upload-image`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!res.ok) {
      throw new Error('Image upload failed');
    }
    return res.json();
  }

  async gradeListing(listingId: string): Promise<QualityGradeInfo & { message: string }> {
    return this.request<QualityGradeInfo & { message: string }>(`/listings/${listingId}/grade`, {
      method: 'POST',
    });
  }

  // --- Marketplace ---
  async getMarketplaceListings(params: Record<string, string | number> = {}): Promise<{
    listings: (ListingItem & { distance_km?: number })[];
    total: number;
  }> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        searchParams.append(k, String(v));
      }
    });
    const query = searchParams.toString();
    return this.request<{
      listings: (ListingItem & { distance_km?: number })[];
      total: number;
    }>(`/marketplace/search${query ? `?${query}` : ''}`);
  }

  // --- Bids ---
  async placeBid(data: { listing_id: string; price_per_unit: number; quantity: number; message?: string }): Promise<any> {
    return this.request('/bids/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getListingBids(listingId: string): Promise<{ bids: BidItem[]; total: number }> {
    return this.request<{ bids: BidItem[]; total: number }>(`/bids/listing/${listingId}`);
  }

  async acceptBid(bidId: string): Promise<{ message: string; order_id: string; total_amount: number }> {
    return this.request(`/bids/${bidId}/accept`, {
      method: 'POST',
    });
  }

  // --- Orders ---
  async getOrders(): Promise<{ orders: any[]; total: number }> {
    return this.request('/orders/');
  }

  async payOrder(orderId: string): Promise<{ message: string; status: string; pickup_otp: string; delivery_otp: string }> {
    return this.request(`/orders/${orderId}/pay`, {
      method: 'POST',
    });
  }

  async deliverOrder(orderId: string, pickupOtp: string, deliveryOtp: string): Promise<{ message: string; status: string }> {
    return this.request(`/orders/${orderId}/deliver?pickup_otp=${pickupOtp}&delivery_otp=${deliveryOtp}`, {
      method: 'POST',
    });
  }

  async getTracking(orderId: string): Promise<any> {
    return this.request(`/orders/${orderId}/tracking`);
  }

  // --- Farmer Dashboard ---
  async getFarmerDashboard(): Promise<any> {
    return this.request('/farmers/dashboard');
  }
}

export const api = new ApiService();
