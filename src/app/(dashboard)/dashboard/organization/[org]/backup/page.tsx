"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/shared/table/DataTable";
import { TableCell, TableRow } from "@/components/ui/table";
import Pagination from "@/components/shared/table/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Cloud,
  Trash2,
  ArrowLeft,
  MoreVertical,
  ArrowUpDown,
  RotateCcw,
  Pause,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { processRequestAuth } from "@/framework/https";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import useSWR from "swr";
import { authFectcher } from "@/hooks/swr";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { SkeletonBox } from "@/components/shared/loader/skeleton";
import DeleteWarningModal from "@/components/shared/modals/DeleteWarningModal";
import ConfirmationModal from "@/components/shared/modals/ConfirmationModal";

type BackupTab = "departments" | "employees" | "patients" | "appointments" | "schedule" | "medical_records";
type ViewMode = "backup" | "trash";

interface BackupEntry {
  id: number;
  date: string;
  fileName: string;
  backupCompletionTime: string;
  fileSize: number; // in MB
  status: "successful" | "failed";
  entityType?: BackupTab;
  originalLocation?: string;
  itemType?: string;
}

export default function BackupPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.org as string;
  const orgIdNumber = parseInt(orgId, 10);

  const [viewMode, setViewMode] = useState<ViewMode>("backup");
  const [activeTab, setActiveTab] = useState<BackupTab>("departments");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedBackups, setSelectedBackups] = useState<number[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);

  // Fetch backups
  const { data: backupsData, isLoading, error, mutate } = useSWR(
    orgIdNumber ? API_ENDPOINTS.GET_TENANT_BACKUPS(orgIdNumber) : null,
    authFectcher
  );

  // Extract backups from response
  const backups: BackupEntry[] = React.useMemo(() => {
    if (!backupsData) return [];
    
    // Handle different response structures
    let data: any[] = [];
    if (Array.isArray(backupsData)) {
      data = backupsData;
    } else if (backupsData?.data) {
      data = Array.isArray(backupsData.data) ? backupsData.data : [];
    } else if (backupsData?.results) {
      data = Array.isArray(backupsData.results) ? backupsData.results : [];
    }

    // Filter by active tab and view mode
    return data
      .filter((backup: any) => {
        // Map backup entity type to our tab types
        const entityType = backup.entityType || backup.entity_type || backup.type;
        const matchesTab = !activeTab || entityType === activeTab;
        
        // For trash view, filter by deleted status
        if (viewMode === "trash") {
          return matchesTab && (backup.deleted || backup.isDeleted);
        }
        
        // For backup view, show non-deleted items
        return matchesTab && !backup.deleted && !backup.isDeleted;
      })
      .map((backup: any) => ({
        id: backup.id || backup.backupId,
        date: backup.date || backup.createdAt || backup.created_at,
        fileName: backup.fileName || backup.file_name || backup.name || backup.entityName,
        backupCompletionTime: backup.backupCompletionTime || backup.completedAt || backup.completed_at || backup.date,
        fileSize: backup.fileSize || backup.file_size || backup.size || 0,
        status: backup.status || (backup.success ? "successful" : "failed"),
        entityType: backup.entityType || backup.entity_type || backup.type,
        originalLocation: backup.originalLocation || backup.original_location || backup.location,
        itemType: backup.itemType || backup.item_type || "Backup",
      }));
  }, [backupsData, activeTab, viewMode]);

  // Pagination
  const totalEntries = backups.length;
  const totalPages = Math.ceil(totalEntries / pageSize);
  const paginatedBackups = backups.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Handle backup creation
  const handleCreateBackup = async () => {
    if (!orgIdNumber) return;
    
    setCreatingBackup(true);
    try {
      await processRequestAuth(
        "post",
        API_ENDPOINTS.CREATE_TENANT_BACKUP(orgIdNumber),
        { tenantId: orgIdNumber, entityType: activeTab }
      );
      toast.success("Backup created successfully");
      mutate(); // Refresh backups list
    } catch (error: any) {
      console.error("Backup creation error:", error);
      toast.error(error?.response?.data?.message || "Failed to create backup");
    } finally {
      setCreatingBackup(false);
    }
  };

  // Handle restore
  const handleRestore = async (backupId: number) => {
    if (!orgIdNumber) return;
    
    setLoading(true);
    try {
      await processRequestAuth(
        "post",
        API_ENDPOINTS.RESTORE_TENANT_BACKUP(orgIdNumber, backupId)
      );
      toast.success("Backup restored successfully");
      mutate();
      setRestoreModalOpen(false);
      setSelectedBackup(null);
    } catch (error: any) {
      console.error("Restore error:", error);
      toast.error(error?.response?.data?.message || "Failed to restore backup");
    } finally {
      setLoading(false);
    }
  };

  // Handle restore all
  const handleRestoreAll = async () => {
    if (selectedBackups.length === 0) {
      toast.warning("Please select backups to restore");
      return;
    }
    
    setLoading(true);
    try {
      await Promise.all(
        selectedBackups.map((backupId) =>
          processRequestAuth(
            "post",
            API_ENDPOINTS.RESTORE_TENANT_BACKUP(orgIdNumber, backupId)
          )
        )
      );
      toast.success(`Restored ${selectedBackups.length} backup(s) successfully`);
      mutate();
      setSelectedBackups([]);
    } catch (error: any) {
      console.error("Restore all error:", error);
      toast.error("Failed to restore some backups");
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (backupId: number) => {
    if (!orgIdNumber) return;
    
    setLoading(true);
    try {
      await processRequestAuth(
        "delete",
        API_ENDPOINTS.DELETE_TENANT_BACKUP(orgIdNumber, backupId)
      );
      toast.success("Backup deleted successfully");
      mutate();
      setDeleteModalOpen(false);
      setSelectedBackup(null);
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error?.response?.data?.message || "Failed to delete backup");
    } finally {
      setLoading(false);
    }
  };

  // Handle delete all
  const handleDeleteAll = async () => {
    if (selectedBackups.length === 0) {
      toast.warning("Please select backups to delete");
      return;
    }
    
    setLoading(true);
    try {
      await Promise.all(
        selectedBackups.map((backupId) =>
          processRequestAuth(
            "delete",
            API_ENDPOINTS.DELETE_TENANT_BACKUP(orgIdNumber, backupId)
          )
        )
      );
      toast.success(`Deleted ${selectedBackups.length} backup(s) successfully`);
      mutate();
      setSelectedBackups([]);
    } catch (error: any) {
      console.error("Delete all error:", error);
      toast.error("Failed to delete some backups");
    } finally {
      setLoading(false);
    }
  };

  const tabs: { key: BackupTab; label: string }[] = [
    { key: "departments", label: "Departments" },
    { key: "employees", label: "Employees" },
    { key: "patients", label: "Patients" },
    { key: "appointments", label: "Appointments" },
    { key: "schedule", label: "Schedule" },
    { key: "medical_records", label: "Medical records" },
  ];

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy");
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy - hh:mm a");
    } catch {
      return dateString;
    }
  };

  const formatFileSize = (sizeInMB: number) => {
    return `${sizeInMB.toFixed(2)} MB`;
  };

  if (isLoading && !backupsData) {
    return <SkeletonBox className="h-[600px]" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="p-2"
        >
          <ArrowLeft className="w-5 h-5 text-[#003465]" />
        </Button>
        <h1 className="text-2xl font-bold text-[#003465]">JON-KEN Medical Hospital</h1>
      </div>

      {/* Title */}
      <h2 className="text-3xl font-bold text-black">
        {viewMode === "backup" ? "Backup Restore" : "Trash"}
      </h2>

      {/* View Mode Toggle */}
      <div className="flex gap-4">
        <Button
          onClick={() => {
            setViewMode("backup");
            setSelectedBackups([]);
            setCurrentPage(1);
          }}
          className={`h-14 px-6 ${
            viewMode === "backup"
              ? "bg-[#003465] text-white"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          <Cloud className="w-5 h-5 mr-2" />
          Backup
        </Button>
        <Button
          onClick={() => {
            setViewMode("trash");
            setSelectedBackups([]);
            setCurrentPage(1);
          }}
          className={`h-14 px-6 ${
            viewMode === "trash"
              ? "bg-[#003465] text-white"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          <Trash2 className="w-5 h-5 mr-2" />
          Trash
        </Button>
      </div>

      {/* Section Title */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-black">
          {viewMode === "backup" ? "Recent Backup" : "All Trash"}
        </h3>
        
        {viewMode === "backup" && (
          <Button
            onClick={handleCreateBackup}
            disabled={creatingBackup}
            className="bg-[#003465] text-white hover:bg-[#0d2337]"
          >
            {creatingBackup ? "Creating..." : "Create Backup"}
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setCurrentPage(1);
              setSelectedBackups([]);
            }}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-[#003465] text-[#003465]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table Actions */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-black capitalize">
          {activeTab.replace("_", " ")}
        </h4>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-10">
            <ArrowUpDown className="w-4 h-4 mr-2" />
            Sort by
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-10"
            onClick={handleRestoreAll}
            disabled={selectedBackups.length === 0 || loading}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Restore all
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-10"
            onClick={handleDeleteAll}
            disabled={selectedBackups.length === 0 || loading}
          >
            <Pause className="w-4 h-4 mr-2" />
            Delete all
          </Button>
        </div>
      </div>

      {/* Table */}
      <DataTable
        tableDataObj={
          viewMode === "backup"
            ? {
                checkbox: "",
                date: "Date",
                fileName: "File name",
                backupCompletionTime: "Backup Completion Time",
                fileSize: "File size",
                status: "Status",
                actions: "Actions",
              }
            : {
                checkbox: "",
                dateDeleted: "Date Deleted",
                fileName: "File name",
                originalLocation: "Original Location",
                fileSize: "File size",
                itemType: "Item Type",
                actions: "Actions",
              }
        }
      >
        {paginatedBackups.length === 0 ? (
          <TableRow>
            <TableCell colSpan={viewMode === "backup" ? 7 : 7} className="text-center py-8">
              <p className="text-gray-500">No {viewMode === "backup" ? "backups" : "deleted items"} found</p>
            </TableCell>
          </TableRow>
        ) : (
          paginatedBackups.map((backup) => (
            <TableRow key={backup.id} className="hover:bg-gray-50">
              <TableCell>
                <input
                  type="checkbox"
                  checked={selectedBackups.includes(backup.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedBackups([...selectedBackups, backup.id]);
                    } else {
                      setSelectedBackups(selectedBackups.filter((id) => id !== backup.id));
                    }
                  }}
                  className="w-4 h-4"
                />
              </TableCell>
              {viewMode === "backup" ? (
                <>
                  <TableCell className="font-medium">
                    {formatDate(backup.date)}
                  </TableCell>
                  <TableCell className="font-medium">{backup.fileName}</TableCell>
                  <TableCell>{formatDateTime(backup.backupCompletionTime)}</TableCell>
                  <TableCell>{formatFileSize(backup.fileSize)}</TableCell>
                  <TableCell>
                    <span
                      className={`flex items-center gap-1 ${
                        backup.status === "successful"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {backup.status === "successful" ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      {backup.status === "successful" ? "Successful" : "Failed"}
                    </span>
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell>{formatDateTime(backup.date)}</TableCell>
                  <TableCell className="font-medium">{backup.fileName}</TableCell>
                  <TableCell>{backup.originalLocation || "N/A"}</TableCell>
                  <TableCell>{formatFileSize(backup.fileSize)}</TableCell>
                  <TableCell>{backup.itemType || "Backup"}</TableCell>
                </>
              )}
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {viewMode === "backup" && (
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedBackup(backup);
                          setRestoreModalOpen(true);
                        }}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Restore
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedBackup(backup);
                        setDeleteModalOpen(true);
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        )}
      </DataTable>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          dataLength={totalEntries}
          pageSize={pageSize}
          numOfPages={totalPages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      )}

      {/* Delete Modal */}
      {deleteModalOpen && selectedBackup && (
        <DeleteWarningModal
          title="Delete Backup"
          message="Are you sure you want to delete"
          itemName={selectedBackup.fileName}
          onConfirm={() => handleDelete(selectedBackup.id)}
          onCancel={() => {
            setDeleteModalOpen(false);
            setSelectedBackup(null);
          }}
          isDeleting={loading}
        />
      )}

      {/* Restore Confirmation Modal */}
      {restoreModalOpen && selectedBackup && (
        <ConfirmationModal
          title="Restore Backup"
          message="Are you sure you want to restore"
          itemName={selectedBackup.fileName}
          onConfirm={() => handleRestore(selectedBackup.id)}
          onCancel={() => {
            setRestoreModalOpen(false);
            setSelectedBackup(null);
          }}
          isProcessing={loading}
          confirmText="Restore"
          confirmVariant="default"
        />
      )}
    </div>
  );
}
