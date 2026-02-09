import { ImageApiResponse } from '@/types/image';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export async function fetchImages(): Promise<ImageApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/images`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Handle both { images: [...] } and direct array responses
    const images = Array.isArray(data) ? data : (data.images || []);

    return {
      success: true,
      data: images,
    };
  } catch (error) {
    console.error('Failed to fetch images:', error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
