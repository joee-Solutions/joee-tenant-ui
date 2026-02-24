"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { AdminUser } from "@/lib/types";

interface ViewAdminModalProps {
  admin: AdminUser;
  onClose: () => void;
}

export default function ViewAdminModal({
  admin,
  onClose,
}: ViewAdminModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-black">View Admin Details</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <div className="bg-[#D9EDFF] border border-[#D9EDFF] rounded-md px-3 py-2 text-gray-900">
                {admin.first_name || "N/A"}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <div className="bg-[#D9EDFF] border border-[#D9EDFF] rounded-md px-3 py-2 text-gray-900">
                {admin.last_name || "N/A"}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="bg-[#D9EDFF] border border-[#D9EDFF] rounded-md px-3 py-2 text-gray-900">
              {admin.email || "N/A"}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <div className="bg-[#D9EDFF] border border-[#D9EDFF] rounded-md px-3 py-2 text-gray-900">
              {admin.address || "N/A"}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="bg-[#D9EDFF] border border-[#D9EDFF] rounded-md px-3 py-2 text-gray-900">
              {admin.phone_number || "N/A"}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <div className="bg-[#D9EDFF] border border-[#D9EDFF] rounded-md px-3 py-2 text-gray-900">
              {admin.roles?.[0] || "N/A"}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company
            </label>
            <div className="bg-[#D9EDFF] border border-[#D9EDFF] rounded-md px-3 py-2 text-gray-900">
              Joee Solution
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-4">
            <Button
              type="button"
              onClick={onClose}
              className="px-6 bg-[#003465] text-white hover:bg-[#003465]/90"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

