import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';

// Upload image to Firebase Storage
export const uploadImage = async (
  file: File,
  folder: 'products' | 'avatars' | 'lotto'
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'File must be an image' };
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'File size must be less than 5MB' };
    }

    // Create unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const storageRef = ref(storage, `${folder}/${filename}`);

    // Upload file
    await uploadBytes(storageRef, file);

    // Get download URL
    const url = await getDownloadURL(storageRef);

    return { success: true, url };
  } catch (error: any) {
    console.error('Firebase Storage upload error:', error);
    // Provide more specific error messages
    let errorMessage = error.message || 'Failed to upload image';
    if (error.code === 'storage/unauthorized') {
      errorMessage = 'Permission denied. Please check Firebase Storage rules.';
    } else if (error.code === 'storage/quota-exceeded') {
      errorMessage = 'Storage quota exceeded. Please contact administrator.';
    } else if (error.code === 'storage/unauthenticated') {
      errorMessage = 'Please login to upload images.';
    }
    return { success: false, error: errorMessage };
  }
};

// Upload multiple images
export const uploadMultipleImages = async (
  files: File[],
  folder: 'products' | 'avatars' | 'lotto'
): Promise<{ success: boolean; urls?: string[]; error?: string }> => {
  try {
    const uploadPromises = files.map(file => uploadImage(file, folder));
    const results = await Promise.all(uploadPromises);

    // Check if all uploads succeeded
    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
      return { 
        success: false, 
        error: `${failed.length} file(s) failed to upload` 
      };
    }

    const urls = results.map(r => r.url!);
    return { success: true, urls };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Delete image from Firebase Storage
export const deleteImage = async (
  imageUrl: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Extract path from URL
    const path = imageUrl.split('/o/')[1]?.split('?')[0];
    if (!path) {
      return { success: false, error: 'Invalid image URL' };
    }

    const decodedPath = decodeURIComponent(path);
    const imageRef = ref(storage, decodedPath);

    await deleteObject(imageRef);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get image URL from path
export const getImageUrl = async (
  path: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const storageRef = ref(storage, path);
    const url = await getDownloadURL(storageRef);
    return { success: true, url };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
