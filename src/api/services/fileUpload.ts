import { apiClient, API_ENDPOINTS } from '../client';
import {
  UploadFileRequest,
  FileResponse,
  ListFilesParams,
  DeleteFileRequest,
  FileCategory,
  ApiResponse,
} from '../types';

export class FileUploadService {
  /**
   * Get available file categories
   */
  async getFileCategories(): Promise<FileCategory[]> {
    try {
      const response = await apiClient.get<FileCategory[]>(
        API_ENDPOINTS.FILES.CATEGORIES
      );

      if (response.data) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('Get file categories error:', error);
      throw error;
    }
  }

  /**
   * Upload file with base64 content
   */
  async uploadFileBase64(fileData: UploadFileRequest): Promise<{ file_id: string; file_url: string }> {
    try {
      const response = await apiClient.post<{ file_id: string; file_url: string }>(
        API_ENDPOINTS.FILES.UPLOAD,
        fileData
      );

      if (response.data && response.message === 'File uploaded successfully') {
        return response.data;
      }

      throw new Error(response.message || 'Failed to upload file');
    } catch (error) {
      console.error('Upload file base64 error:', error);
      throw error;
    }
  }

  /**
   * Upload file with URL
   */
  async uploadFileFromUrl(fileData: UploadFileRequest): Promise<{ file_id: string; file_url: string }> {
    try {
      const response = await apiClient.post<{ file_id: string; file_url: string }>(
        API_ENDPOINTS.FILES.UPLOAD,
        fileData
      );

      if (response.data && response.message === 'File uploaded successfully') {
        return response.data;
      }

      throw new Error(response.message || 'Failed to upload file');
    } catch (error) {
      console.error('Upload file from URL error:', error);
      throw error;
    }
  }

  /**
   * Upload file using File object (multipart/form-data)
   */
  async uploadFile(
    file: File,
    options: {
      file_category: string;
      description?: string;
      reference_doctype?: string;
      reference_name?: string;
      is_private?: boolean;
    },
    onProgress?: (progress: number) => void
  ): Promise<{ file_id: string; file_url: string }> {
    try {
      // Convert file to base64
      const base64Content = await this.fileToBase64(file);
      
      const fileData: UploadFileRequest = {
        file_name: file.name,
        content: base64Content,
        decode_base64: true,
        file_category: options.file_category,
        description: options.description,
        reference_doctype: options.reference_doctype,
        reference_name: options.reference_name,
        is_private: options.is_private ? 1 : 0,
      };

      return await this.uploadFileBase64(fileData);
    } catch (error) {
      console.error('Upload file error:', error);
      throw error;
    }
  }

  /**
   * Get file by ID
   */
  async getFile(fileId: string): Promise<FileResponse> {
    try {
      const response = await apiClient.get<FileResponse>(
        `${API_ENDPOINTS.FILES.GET}?file_id=${fileId}`
      );

      if (response.data) {
        return response.data;
      }

      throw new Error(response.message || 'File not found');
    } catch (error) {
      console.error('Get file error:', error);
      throw error;
    }
  }

  /**
   * List files with filters
   */
  async listFiles(params: ListFilesParams = {}): Promise<FileResponse[]> {
    try {
      const queryParams = new URLSearchParams({
        limit: (params.limit || 20).toString(),
        offset: (params.offset || 0).toString(),
      });

      if (params.file_category) {
        queryParams.append('file_category', params.file_category);
      }

      if (params.reference_doctype) {
        queryParams.append('reference_doctype', params.reference_doctype);
      }

      if (params.reference_name) {
        queryParams.append('reference_name', params.reference_name);
      }

      if (params.search_term) {
        queryParams.append('search_term', params.search_term);
      }

      const response = await apiClient.get<FileResponse[]>(
        `${API_ENDPOINTS.FILES.LIST}?${queryParams.toString()}`
      );

      // Handle nested response structure: {message: {data: {files: [...]}}}
      if (response.data) {
        // Check if data is an object with 'files' property
        if (typeof response.data === 'object' && 'files' in response.data) {
          return (response.data as any).files || [];
        }
        // Check if data is already an array
        if (Array.isArray(response.data)) {
          return response.data;
        }
      }

      return [];
    } catch (error) {
      console.error('List files error:', error);
      throw error;
    }
  }

  /**
   * Delete file
   */
  async deleteFile(fileId: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post<ApiResponse>(
        API_ENDPOINTS.FILES.DELETE,
        { file_id: fileId }
      );

      if (response.message === 'File deleted successfully') {
        return response;
      }

      throw new Error(response.message || 'Failed to delete file');
    } catch (error) {
      console.error('Delete file error:', error);
      throw error;
    }
  }

  /**
   * Get files for a specific patient
   */
  async getPatientFiles(patientId: string, category?: string): Promise<FileResponse[]> {
    try {
      const params: ListFilesParams = {
        reference_doctype: 'Patient',
        reference_name: patientId,
        limit: 100,
      };

      if (category) {
        params.file_category = category;
      }

      return await this.listFiles(params);
    } catch (error) {
      console.error('Get patient files error:', error);
      throw error;
    }
  }

  /**
   * Get files for a specific prescription
   */
  async getPrescriptionFiles(prescriptionId: string, category?: string): Promise<FileResponse[]> {
    try {
      const params: ListFilesParams = {
        reference_doctype: 'Patient Medical Record',
        reference_name: prescriptionId,
        limit: 100,
      };

      if (category) {
        params.file_category = category;
      }

      return await this.listFiles(params);
    } catch (error) {
      console.error('Get prescription files error:', error);
      throw error;
    }
  }

  /**
   * Convert File object to base64 string
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = () => reject(new Error('File reading failed'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File, options?: {
    maxSizeBytes?: number;
    allowedTypes?: string[];
  }): string[] {
    const errors: string[] = [];
    const { maxSizeBytes = 10 * 1024 * 1024, allowedTypes } = options || {}; // Default 10MB

    // Check file size
    if (file.size > maxSizeBytes) {
      errors.push(`File size must be less than ${this.formatFileSize(maxSizeBytes)}`);
    }

    // Check file type
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }

    return errors;
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file icon based on file type
   */
  getFileIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      case 'mp4':
      case 'avi':
      case 'mov':
        return '🎥';
      case 'mp3':
      case 'wav':
        return '🎵';
      default:
        return '📎';
    }
  }

  /**
   * Check if file is an image
   */
  isImageFile(fileName: string): boolean {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    const extension = fileName.split('.').pop()?.toLowerCase();
    return imageExtensions.includes(extension || '');
  }

  /**
   * Get file creation date formatted
   */
  formatFileDate(file: FileResponse): string {
    try {
      const date = new Date(file.creation);
      return date.toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  }

  /**
   * Generate file download URL
   */
  getDownloadUrl(file: FileResponse): string {
    // Assuming the file_url from the API is the download URL
    return file.file_url;
  }

  /**
   * Common file categories for dental clinic
   */
  getCommonFileCategories(): FileCategory[] {
    return [
      { name: 'xray', description: 'X-ray Images' },
      { name: 'photo', description: 'Clinical Photos' },
      { name: 'report', description: 'Medical Reports' },
      { name: 'prescription', description: 'Prescription Documents' },
      { name: 'consent', description: 'Consent Forms' },
      { name: 'profile', description: 'Profile Pictures' },
      { name: 'other', description: 'Other Documents' },
    ];
  }
}

// Create singleton instance
export const fileUploadService = new FileUploadService();