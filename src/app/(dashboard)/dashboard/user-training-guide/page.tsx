"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Search, 
  Download, 
  Eye, 
  FileText, 
  FileImage, 
  File, 
  Star
} from "lucide-react";
import { useTrainingGuidesData, useTrainingGuideCategories } from "@/hooks/swr";
import { toast } from "react-toastify";

export default function UserTrainingGuidePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const statusFilter = "active";

  const { data: guidesData, isLoading } = useTrainingGuidesData({
    status: statusFilter,
    category: categoryFilter || undefined,
  });

  const { data: categories } = useTrainingGuideCategories();

  const guides = guidesData?.guides || [];

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

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="text-red-500" size={24} />;
    if (fileType.includes('word') || fileType.includes('document')) return <FileText className="text-blue-500" size={24} />;
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return <FileImage className="text-orange-500" size={24} />;
    if (fileType.includes('text')) return <File className="text-gray-500" size={24} />;
    return <File className="text-gray-500" size={24} />;
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
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredGuides = guides.filter(guide =>
    guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guide.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guide.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="px-12 pb-20 flex flex-col gap-[30px] w-full">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-blue-500 border-blue-200"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-12 pb-20 flex flex-col gap-[30px] w-full">
      <div className="space-y-6">
        <div>
          <h1 className="font-bold text-3xl text-black mb-2">Training Guides</h1>
          <p className="text-gray-600">Access training materials and documentation to help you use the system effectively.</p>
        </div>

        {/* Filters and Search */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search training guides..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories?.map((category: string) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Featured Guides */}
        {filteredGuides.filter(guide => guide.is_featured).length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Star className="text-yellow-500" size={20} />
              Featured Guides
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGuides
                .filter(guide => guide.is_featured)
                .map((guide) => (
                  <Card key={guide.id} className="border-2 border-yellow-200 bg-yellow-50">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getFileIcon(guide.file_type)}
                          <div>
                            <CardTitle className="text-lg">{guide.title}</CardTitle>
                            <CardDescription>{guide.category}</CardDescription>
                          </div>
                        </div>
                        <Star className="text-yellow-500" size={16} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      {guide.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {guide.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span>{formatFileSize(guide.file_size)}</span>
                        <span>{formatDate(guide.created_at)}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(guide.file_url, '_blank')}
                          className="flex-1"
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDownload(guide)}
                          className="flex-1"
                        >
                          <Download className="mr-1 h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}

        {/* All Guides */}
        <div>
          <h2 className="text-xl font-semibold mb-4">All Training Guides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGuides
              .filter(guide => !guide.is_featured)
              .map((guide) => (
                <Card key={guide.id}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      {getFileIcon(guide.file_type)}
                      <div>
                        <CardTitle className="text-lg">{guide.title}</CardTitle>
                        <CardDescription>{guide.category}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {guide.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {guide.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>{formatFileSize(guide.file_size)}</span>
                      <span>{formatDate(guide.created_at)}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(guide.file_url, '_blank')}
                        className="flex-1"
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDownload(guide)}
                        className="flex-1"
                      >
                        <Download className="mr-1 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>

        {filteredGuides.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No training guides found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
} 