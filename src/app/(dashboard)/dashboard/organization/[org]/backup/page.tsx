"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Trash2,
  ArrowLeft,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  FileText,
} from "lucide-react";
import { processRequestAuth } from "@/framework/https";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import useSWR from "swr";
import { authFectcher, useTenant } from "@/hooks/swr";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { SkeletonBox } from "@/components/shared/loader/skeleton";
import DeleteWarningModal from "@/components/shared/modals/DeleteWarningModal";
import ConfirmationModal from "@/components/shared/modals/ConfirmationModal";

type BackupTab = "departments" | "employees" | "patients" | "appointments" | "schedule" | "medical_records";

interface BackupEntry {
  id: string | number;
  date: string;
  fileName: string;
  filePath: string;
  backupCompletionTime: string;
  fileSize: number;
  status: "successful" | "failed";
  backupType?: string;
  tablesIncluded?: string[];
  entityType?: BackupTab;
  originalLocation?: string;
  itemType?: string;
}

export default function BackupPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.org as string;
  const orgIdNumber = parseInt(orgId, 10);
  const { data: tenantData } = useTenant(orgId);
  const orgName = (tenantData as any)?.name ?? "Organization";

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedBackups, setSelectedBackups] = useState<(string | number)[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupEntry | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch backups
  const { data: backupsData, isLoading, error, mutate } = useSWR(
    orgIdNumber ? API_ENDPOINTS.GET_TENANT_BACKUPS(orgIdNumber) : null,
    authFectcher
  );

  // Extract backups from response: GET /super/tenants/{tenantId}/backups
  // Response shape: { success, message, data: { status, message, data: [...], meta } }
  const backups: BackupEntry[] = React.useMemo(() => {
    if (!backupsData) return [];

    let data: any[] = [];
    const inner = backupsData?.data;
    if (Array.isArray(backupsData)) {
      data = backupsData;
    } else if (inner && Array.isArray(inner.data)) {
      data = inner.data;
    } else if (Array.isArray(inner)) {
      data = inner;
    } else if (backupsData?.data && Array.isArray(backupsData.data)) {
      data = backupsData.data;
    } else if (backupsData?.results) {
      data = Array.isArray(backupsData.results) ? backupsData.results : [];
    }

    return data
      .filter((backup: any) => !backup.deleted && !backup.isDeleted)
      .map((backup: any) => {
        const status = backup.status?.toUpperCase?.() ?? backup.status ?? "";
        const filePath = backup.filePath ?? backup.originalLocation ?? backup.original_location ?? backup.location ?? "";
        const tablesIncluded = backup.metadata?.tablesIncluded ?? backup.tablesIncluded;
        return {
          id: backup.id ?? backup.backupId,
          date: backup.date ?? backup.createdAt ?? backup.created_at ?? "",
          fileName: backup.filename ?? backup.fileName ?? backup.file_name ?? backup.name ?? backup.entityName ?? "—",
          filePath: typeof filePath === "string" ? filePath : "",
          backupCompletionTime: backup.updatedAt ?? backup.createdAt ?? backup.completedAt ?? backup.date ?? "",
          fileSize: typeof backup.size === "number" ? backup.size : backup.fileSize ?? backup.file_size ?? 0,
          status: status === "COMPLETED" ? "successful" : status === "FAILED" ? "failed" : (backup.success ? "successful" : "failed"),
          backupType: backup.metadata?.backupType ?? backup.itemType ?? backup.item_type ?? "FULL",
          tablesIncluded: Array.isArray(tablesIncluded) ? tablesIncluded : [],
          entityType: backup.entityType ?? backup.entity_type ?? backup.type,
          originalLocation: filePath,
          itemType: backup.metadata?.backupType ?? backup.itemType ?? backup.item_type ?? "Backup",
        };
      });
  }, [backupsData]);

  // Pagination
  const totalEntries = backups.length;
  const totalPages = Math.ceil(totalEntries / pageSize);
  const paginatedBackups = backups.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Handle restore (backupId can be uuid string or number)
  const handleRestore = async (backupId: string | number) => {
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

  // Handle delete (backupId can be uuid string or number)
  const handleDelete = async (backupId: string | number) => {
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

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy");
    } catch {
      return dateString;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (isLoading && !backupsData) {
    return <SkeletonBox className="h-[600px]" />;
  }

  return (
    <div className="space-y-6">
      {/* Header: back + organization name BACKUP */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="p-2"
        >
          <ArrowLeft className="w-5 h-5 text-[#003465]" />
        </Button>
        <h1 className="text-2xl font-bold text-[#003465]">{orgName} BACKUP</h1>
      </div>

      {/* Table: dark blue header, 6 columns, Restore + Delete buttons */}
      <Table>
        <TableHeader>
          <TableRow className="border-0 bg-[#003465] hover:bg-[#003465]">
            <TableHead className="h-10 px-4 text-left font-semibold text-white text-xs">
              <span className="flex items-center gap-1">Date <ArrowUpDown className="w-3.5 h-3.5 opacity-80" /></span>
            </TableHead>
            <TableHead className="h-10 px-4 text-left font-semibold text-white text-xs">
              <span className="flex items-center gap-1">File name <ArrowUpDown className="w-3.5 h-3.5 opacity-80" /></span>
            </TableHead>
            <TableHead className="h-10 px-4 text-left font-semibold text-white text-xs">
              <span className="flex items-center gap-1">Backup Completion Time <ArrowUpDown className="w-3.5 h-3.5 opacity-80" /></span>
            </TableHead>
            <TableHead className="h-10 px-4 text-left font-semibold text-white text-xs">
              <span className="flex items-center gap-1">File size <ArrowUpDown className="w-3.5 h-3.5 opacity-80" /></span>
            </TableHead>
            <TableHead className="h-10 px-4 text-left font-semibold text-white text-xs">
              <span className="flex items-center gap-1">Status <ArrowUpDown className="w-3.5 h-3.5 opacity-80" /></span>
            </TableHead>
            <TableHead className="h-10 px-4 text-left font-semibold text-white text-xs">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedBackups.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                No backups found
              </TableCell>
            </TableRow>
          ) : (
            paginatedBackups.map((backup) => (
              <TableRow key={String(backup.id)} className="hover:bg-gray-50 border-b">
                <TableCell className="font-medium py-3 px-4">{formatDate(backup.date)}</TableCell>
                <TableCell className="font-medium py-3 px-4">{backup.fileName}</TableCell>
                <TableCell className="py-3 px-4">{formatDate(backup.backupCompletionTime)}</TableCell>
                <TableCell className="py-3 px-4">{formatFileSize(backup.fileSize)}</TableCell>
                <TableCell className="py-3 px-4">
                  <span className={`inline-flex items-center gap-1 ${backup.status === "successful" ? "text-green-600" : "text-red-600"}`}>
                    {backup.status === "successful" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {backup.status === "successful" ? "COMPLETED" : "FAILED"}
                  </span>
                </TableCell>
                <TableCell className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 bg-[#003465] text-white hover:bg-[#0d2337] gap-1.5 text-xs"
                      onClick={() => {
                        setSelectedBackup(backup);
                        setRestoreModalOpen(true);
                      }}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Restore
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 border-red-500 text-red-600 hover:bg-red-50 gap-1.5 text-xs"
                      onClick={() => {
                        setSelectedBackup(backup);
                        setDeleteModalOpen(true);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination: Showing X to Y of Z entries */}
      <div className="pt-4 border-t border-[#D8E7F2] flex items-center justify-between flex-wrap gap-3 py-3 px-4">
        <p className="font-medium text-sm text-[#737373]">
          Showing {totalEntries === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalEntries)} of {totalEntries} entries
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="h-[30px] px-2 text-xs text-[#595959] border-[#BFBFBF] rounded"
          >
            Previous
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p)}
              className={`h-[30px] min-w-[30px] px-2 text-xs rounded ${
                currentPage === p ? "bg-[#003465] text-white border-[#003465]" : "text-[#595959] border-[#BFBFBF]"
              }`}
            >
              {p}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="h-[30px] px-2 text-xs text-[#595959] border-[#BFBFBF] rounded"
          >
            Next
          </Button>
        </div>
      </div>

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
