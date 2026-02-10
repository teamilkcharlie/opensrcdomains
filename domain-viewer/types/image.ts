// Core image data from API
export interface ImageData {
  id: string;
  imageUrl: string;
  linkUrl: string;
  metadata?: ImageMetadata;
}

export interface ImageMetadata {
  title?: string;
  description?: string;
  author?: string;
  category?: string;
  createdAt?: string;
}

// API response wrapper
export interface ImageApiResponse {
  success: boolean;
  data: ImageData[];
  error?: string;
}

// Extended mesh userData for click handling
export interface ImageMeshUserData {
  imageId: string;
  linkUrl: string;
  metadata?: ImageMetadata;
}
