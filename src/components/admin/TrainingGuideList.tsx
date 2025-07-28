"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Download,
  Eye,
  FileText,
  FileImage,
  File,
  Star,
  Filter
} from "lucide-react";
import { useRouter } from "next/navigation";
import { processRequestAuth } from "@/framework/https";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { toast } from "react-toastify";

interface TrainingGuide {
  id: number;
  title: string;
  description?: string;
  category: string;
  version?: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  status: string;
  is_featured: boolean;
  created_at: string;
  metadata?: {
    author?: string;
    tags?: string[];
    targetAudience?: string[];
  };
}

export default function TrainingGuideList() {
  const [guides, setGuides] = useState<TrainingGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const router = useRouter();

  const fetchGuides = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter) params.append('category', categoryFilter);
      if (statusFilter) params.append('status', statusFilter);
      
      const endpoint = `${API_ENDPOINTS.GET_TRAINING_GUIDES}?${params.toString()}`;
      const response = await processRequestAuth("get", endpoint);
      
      if (response && typeof response === 'object' && 'success' in response) {
        if (response.success && response.data) {
          setGuides(Array.isArray(response.data) ? response.data : []);
        } else {
          console.error("Failed to fetch guides:", response.message);
          toast.error(response.message || "Failed to load training guides");
        }
      } else {
        setGuides(response?.data?.guides || response || []);
      }
    } catch (error) {
      console.error("Error fetching training guides:", error);
      toast.error("Failed to load training guides");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await processRequestAuth("get", API_ENDPOINTS.GET_TRAINING_GUIDE_CATEGORIES);
      
      if (response && typeof response === 'object' && 'success' in response) {
        if (response.success && response.data) {
          setCategories(Array.isArray(response.data) ? response.data : []);
        }
      } else {
        setCategories(response?.data || response || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    fetchGuides();
    fetchCategories();
  }, [categoryFilter, statusFilter]);

  const handleDelete = async (id: number) => {
    try {
      const response = await processRequestAuth("delete", API_ENDPOINTS.DELETE_TRAINING_GUIDE(id));
      if (response.status) {
        toast.success("Training guide deleted successfully");
        fetchGuides();
      } else {
        toast.error(response.message || "Failed to delete training guide");
      }
    } catch (error) {
      console.error("Error deleting training guide:", error);
      toast.error("Failed to delete training guide");
    }
  };

  const handleDownload = async (guide: TrainingGuide) => {
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
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="text-red-500" size={20} />;
    if (fileType.includes('word') || fileType.includes('document')) return <FileText className="text-blue-500" size={20} />;
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return <FileImage className="text-orange-500" size={20} />;
    if (fileType.includes('text')) return <File className="text-gray-500" size={20} />;
    return <File className="text-gray-500" size={20} />;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-blue-500 border-blue-200"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
        >
          <option value="">All Categories</option>
          {categories?.map((category: string) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>File</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGuides.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No training guides found
                </TableCell>
              </TableRow>
            ) : (
              filteredGuides.map((guide) => (
                <TableRow key={guide.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{guide.title}</div>
                      {guide.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {guide.description}
                        </div>
                      )}
                      {guide.is_featured && (
                        <Star className="inline h-4 w-4 text-yellow-500 ml-1" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{guide.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getFileIcon(guide.file_type)}
                      <div>
                        <div className="text-sm font-medium">{guide.file_name}</div>
                        <div className="text-xs text-gray-500">{formatFileSize(guide.file_size)}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={guide.status === 'active' ? 'default' : 'secondary'}
                      className={guide.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {guide.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(guide.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDownload(guide)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(guide.file_url, '_blank')}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/training-guides/edit/${guide.id}`)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Training Guide</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{guide.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(guide.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 