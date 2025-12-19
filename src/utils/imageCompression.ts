/**
 * Image compression utility for reducing file size before upload
 * Used across the application to compress images from camera capture and file selection
 */

/**
 * Compress image file to reduce size while maintaining quality
 * @param file - Original image file
 * @param maxWidth - Maximum width (default 1920px)
 * @param maxHeight - Maximum height (default 1920px)
 * @param quality - JPEG quality 0-1 (default 0.8)
 * @returns Compressed image file
 */
export const compressImage = async (
    file: File,
    maxWidth: number = 1920,
    maxHeight: number = 1920,
    quality: number = 0.8
): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions while maintaining aspect ratio
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            resolve(compressedFile);
                        } else {
                            reject(new Error('Canvas to Blob conversion failed'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };

            img.onerror = () => reject(new Error('Image load failed'));
        };

        reader.onerror = () => reject(new Error('FileReader failed'));
    });
};

/**
 * Process files and compress images
 * @param files - Array of files to process
 * @param maxWidth - Maximum width for compression
 * @param maxHeight - Maximum height for compression
 * @param quality - JPEG quality 0-1
 * @returns Array of processed files (images compressed, others unchanged)
 */
export const processFilesWithCompression = async (
    files: File[],
    maxWidth: number = 1920,
    maxHeight: number = 1920,
    quality: number = 0.8
): Promise<File[]> => {
    return Promise.all(
        files.map(async (file) => {
            if (file.type.startsWith('image/')) {
                try {
                    const originalSize = (file.size / 1024 / 1024).toFixed(2);
                    const compressed = await compressImage(file, maxWidth, maxHeight, quality);
                    const compressedSize = (compressed.size / 1024 / 1024).toFixed(2);
                    console.log(`Compressed ${file.name}: ${originalSize}MB → ${compressedSize}MB`);
                    return compressed;
                } catch (error) {
                    console.error('Image compression failed, using original:', error);
                    return file;
                }
            }
            return file;
        })
    );
};
