import React, { useState, useRef } from 'react';
import { fileUploadService } from '../../api/services';
import { useUploadFile, useAppointmentFiles, useDeleteFile } from '../../hooks/useFileUpload';

interface FileUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointmentId: string;
    patientName: string;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({
    isOpen,
    onClose,
    appointmentId,
    patientName
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [category, setCategory] = useState('report');
    const [description, setDescription] = useState('');

    const { mutate: uploadFile, isPending: isUploading } = useUploadFile();
    const { data: files, refetch: refetchFiles } = useAppointmentFiles(appointmentId, isOpen);
    const { mutate: deleteFile } = useDeleteFile();

    const categories = fileUploadService.getCommonFileCategories();
    const existingFiles = files || [];

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFiles(Array.from(e.target.files));
        }
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;

        for (const file of selectedFiles) {
            uploadFile({
                file,
                options: {
                    file_category: category,
                    description: description || file.name,
                    reference_doctype: 'Patient Appointment',
                    reference_name: appointmentId,
                    is_private: false,
                },
            }, {
                onSuccess: () => {
                    refetchFiles();
                    setSelectedFiles([]);
                    setDescription('');
                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }
                },
            });
        }
    };

    const handleDelete = (fileId: string) => {
        if (window.confirm('Are you sure you want to delete this file?')) {
            deleteFile(fileId, {
                onSuccess: () => {
                    refetchFiles();
                },
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Upload Files</h2>
                        <p className="text-sm text-gray-500 mt-1">{patientName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                    {/* Upload Section */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900">Upload New Files</h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category
                                </label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {categories.map((cat) => (
                                        <option key={cat.name} value={cat.name}>
                                            {cat.description}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Enter description"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Files
                            </label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                onChange={handleFileSelect}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                        </div>

                        {selectedFiles.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-700">Selected Files:</p>
                                {selectedFiles.map((file, index) => (
                                    <div key={index} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
                                        <span>{fileUploadService.getFileIcon(file.name)}</span>
                                        <span className="flex-1">{file.name}</span>
                                        <span className="text-gray-400">{fileUploadService.formatFileSize(file.size)}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={handleUpload}
                            disabled={selectedFiles.length === 0 || isUploading}
                            className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`}
                        </button>
                    </div>

                    {/* Existing Files */}
                    {existingFiles.length > 0 && (
                        <div className="space-y-4 border-t border-gray-200 pt-6">
                            <h3 className="font-semibold text-gray-900">Uploaded Files ({existingFiles.length})</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {existingFiles.map((file) => (
                                    <div
                                        key={file.file_id}
                                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                                    >
                                        <span className="text-2xl">{fileUploadService.getFileIcon(file.file_name)}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">{file.description || file.file_name}</p>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                <span>{fileUploadService.formatFileSize(file.file_size)}</span>
                                                <span>•</span>
                                                <span>{fileUploadService.formatFileDate(file)}</span>
                                                {file.file_category && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="capitalize">{file.file_category}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <a
                                            href={fileUploadService.getDownloadUrl(file)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Download"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                        </a>
                                        <button
                                            onClick={() => handleDelete(file.file_id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div >
    );
};

export default FileUploadModal;
