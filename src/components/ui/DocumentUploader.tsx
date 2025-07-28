import { useState, useRef } from "react";
import { Upload, X, FileText, File, FileImage } from "lucide-react";

interface DocumentUploaderProps {
  title?: string;
  onFileSelect?: (file: File) => void;
  selectedFile?: File | null;
  error?: string;
  uploading?: boolean;
}

export default function DocumentUploader({ 
  title = "Upload Training Guide", 
  onFileSelect,
  selectedFile,
  error,
  uploading = false
}: DocumentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const validateFile = (file: File) => {
    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    if (!allowedTypes.includes(file.type)) {
      return "Only PDF, DOC, DOCX, TXT, PPT, and PPTX files are accepted";
    }

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return "File size should be less than 50MB";
    }

    return null;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      // You can handle error display here
      console.error(validationError);
      return;
    }

    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const removeFile = () => {
    if (onFileSelect) {
      onFileSelect(null as any);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="text-red-500" size={48} />;
    if (fileType.includes('word') || fileType.includes('document')) return <FileText className="text-blue-500" size={48} />;
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return <FileImage className="text-orange-500" size={48} />;
    if (fileType.includes('text')) return <File className="text-gray-500" size={48} />;
    return <File className="text-gray-500" size={48} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      <label className="block text-lg font-medium text-gray-700 mb-2">
        {title}
      </label>
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center h-64 transition-colors w-full
        ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50"
        }
        ${error ? "border-red-500 bg-red-50" : ""}
        ${uploading ? "opacity-70" : ""}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={!selectedFile ? openFileDialog : undefined}
        aria-label="Upload training guide"
        role="button"
        tabIndex={0}
      >
        {selectedFile ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <div className="text-center">
              {getFileIcon(selectedFile.type)}
              <p className="mt-2 text-sm font-medium text-gray-700">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            <button
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
              onClick={(e) => {
                e.stopPropagation();
                removeFile();
              }}
              aria-label="Remove file"
            >
              <X size={16} />
            </button>
          </div>
        ) : uploading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-blue-500 border-blue-200 mb-3"></div>
            <p className="text-sm text-gray-600">Uploading...</p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-blue-500">
              {isDragging ? (
                <Upload size={48} className="animate-pulse" />
              ) : (
                <Upload size={48} />
              )}
            </div>
            <p className="mb-2 text-lg font-medium text-gray-700">
              {isDragging ? "Drop your file here" : "Drag your file here"}
            </p>
            <p className="mb-4 text-sm text-gray-500">
              (PDF, DOC, DOCX, TXT, PPT, PPTX files up to 50MB)
            </p>
            <p className="text-sm text-gray-400">
              Or click to browse files
            </p>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
          onChange={handleFileChange}
          aria-label="Upload training guide"
        />
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <p className="mt-2 text-xs text-gray-500">
        Maximum file size: 50MB. Supported formats: PDF, DOC, DOCX, TXT, PPT, PPTX
      </p>
    </div>
  );
} 