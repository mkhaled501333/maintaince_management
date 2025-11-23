'use client';

import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '@/lib/api-config';
import { apiClient } from '@/lib/api-client';

interface AuthenticatedImageProps {
  attachmentId: number;
  alt?: string;
  className?: string;
  onClick?: () => void;
}

/**
 * Component that fetches images with authentication and displays them
 * This is needed because <img src> doesn't send Authorization headers
 */
export const AuthenticatedImage: React.FC<AuthenticatedImageProps> = ({
  attachmentId,
  alt = 'Image',
  className = '',
  onClick,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;

    const fetchImage = async () => {
      try {
        const response = await apiClient.get(`/attachments/${attachmentId}/view`, {
          responseType: 'blob',
        });
        
        // Create object URL from blob
        objectUrl = URL.createObjectURL(response.data);
        setImageUrl(objectUrl);
        setError(false);
      } catch (err) {
        console.error('Error fetching image:', err);
        setError(true);
      }
    };

    fetchImage();

    // Cleanup: revoke object URL when component unmounts or attachmentId changes
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [attachmentId]);

  if (error) {
    return (
      <div className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center ${className}`}>
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center ${className}`}>
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      onClick={onClick}
    />
  );
};

