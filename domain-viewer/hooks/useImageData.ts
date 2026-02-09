'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ImageData } from '@/types/image';
import { fetchImages } from '@/lib/imageService';
import { FALLBACK_IMAGES } from '@/utils/fallbackImages';

interface UseImageDataReturn {
  images: ImageData[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getRandomImage: () => ImageData;
  imagesRef: React.RefObject<ImageData[]>;
}

export function useImageData(): UseImageDataReturn {
  const [images, setImages] = useState<ImageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use ref for stable reference in Three.js callbacks
  const imagesRef = useRef<ImageData[]>(FALLBACK_IMAGES);

  const loadImages = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const response = await fetchImages();

    if (response.success && response.data.length > 0) {
      setImages(response.data);
      imagesRef.current = response.data;
    } else {
      // Use fallback images on error
      setImages(FALLBACK_IMAGES);
      imagesRef.current = FALLBACK_IMAGES;
      if (response.error) {
        setError(response.error);
        console.warn('Using fallback images:', response.error);
      }
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const getRandomImage = useCallback((): ImageData => {
    const imageList = imagesRef.current.length > 0 ? imagesRef.current : FALLBACK_IMAGES;
    return imageList[Math.floor(Math.random() * imageList.length)];
  }, []);

  return {
    images,
    isLoading,
    error,
    refetch: loadImages,
    getRandomImage,
    imagesRef,
  };
}
