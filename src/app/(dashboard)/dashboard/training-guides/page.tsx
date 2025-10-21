"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Upload, 
  FileText, 
  Download, 
  Eye, 
  Trash2,
  Plus
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTrainingGuidesData } from "@/hooks/swr";
import { toast } from "react-toastify";
import { processRequestAuth } from "@/framework/https";
import { API_ENDPOINTS } from "@/framework/api-endpoints";

export default function TrainingGuidesPage() {
  const router = useRouter();
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const { data: guidesData, isLoading, mutate } = useTrainingGuidesData({
    status: "active"
  });
  
  const guides = guidesData?.guides || [];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.replace(/\.[^/.]+$/, "")); // Remove extension for title
      formData.append('category', 'General');
      formData.append('description', 'Uploaded via drag and drop');

      const response = await processRequestAuth("post", API_ENDPOINTS.CREATE_TRAINING_GUIDE, formData);
      
      if (response.status) {
        toast.success("Training guide uploaded successfully");
        mutate(); // Refresh the data
      } else {
        toast.error(response.message || "Failed to upload training guide");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleDownload = async (guide: any) => {
    try {
      const response = await fetch(guide.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = guide.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Download started");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    }
  };

  const handleView = (guide: any) => {
    window.open(guide.file_url, '_blank');
  };

  const handleDelete = async (guide: any) => {
    if (confirm(`Are you sure you want to delete "${guide.title}"?`)) {
      try {
        const response = await processRequestAuth("delete", API_ENDPOINTS.DELETE_TRAINING_GUIDE(guide.id));
        if (response.status) {
          toast.success("Training guide deleted successfully");
          mutate(); // Refresh the data
        } else {
          toast.error(response.message || "Failed to delete training guide");
        }
      } catch (error) {
        console.error("Error deleting file:", error);
        toast.error("Failed to delete file");
      }
    }
  };

  return (
    <div className="px-12 pb-20 flex flex-col gap-8 w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#003465] mb-4">
          User Training Guide for JOEE Solutions HIMS
        </h1>
        <p className="text-gray-600 text-lg leading-relaxed">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
          incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
          exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
      </div>

      {/* Upload Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Upload here</h2>
        <Card 
          className={`border-2 border-dashed transition-colors cursor-pointer ${
            dragOver 
              ? 'border-[#003465] bg-blue-50' 
              : uploading
              ? 'border-orange-400 bg-orange-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleUploadClick}
        >
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                {uploading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-t-[#003465] border-blue-200"></div>
                ) : (
                  <FileText className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div className="text-center">
                {uploading ? (
                  <p className="text-orange-600 font-medium">Uploading...</p>
                ) : (
                  <>
                    <p className="text-gray-600 mb-2">
                      Drag and drop your documents here or
                    </p>
                    <Button 
                      variant="link" 
                      className="text-[#003465] p-0 h-auto font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUploadClick();
                      }}
                    >
                      click here to browse
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      {/* Uploaded Documents */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Uploaded Documents</h2>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-[#003465] border-blue-200"></div>
          </div>
        ) : guides.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No training guides uploaded yet</p>
              <p className="text-gray-400">Upload your first training guide to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {guides.map((guide: any) => (
              <Card key={guide.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-6 p-6">
                  {/* Document Icon */}
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  
                  {/* Document Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-lg mb-2 truncate">
                      {guide.title}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Uploaded {formatDate(guide.createdAt)}</p>
                      <p>Time: {formatTime(guide.createdAt)}</p>
                      <p>File size: {formatFileSize(guide.file_size)}</p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(guide)}
                      className="w-10 h-10 p-0"
                    >
                      <Download className="w-4 h-4 text-green-600" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleView(guide)}
                      className="w-10 h-10 p-0"
                    >
                      <Eye className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(guide)}
                      className="w-10 h-10 p-0"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 