"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Edit, 
  Eye,
  Shield
} from "lucide-react";
import { Role } from "@/lib/types";

interface RoleCardProps {
  role: Role;
  onViewPermissions?: (role: Role) => void;
  onEdit?: (role: Role) => void;
  onClick?: (role: Role) => void;
  showActions?: boolean;
  variant?: 'default' | 'compact' | 'selection';
  isSelected?: boolean;
  isSeeded?: boolean;
}

const getPermissionIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'user':
      return '👤';
    case 'tenant':
      return '🏢';
    case 'department':
      return '🏥';
    case 'patient':
      return '👨‍⚕️';
    case 'appointment':
      return '📅';
    case 'employee':
      return '👷';
    case 'record':
      return '📋';
    case 'training_guide':
      return '📚';
    case 'notification':
      return '🔔';
    case 'system_settings':
      return '⚙️';
    case 'backup':
      return '💾';
    case 'audit_log':
      return '📊';
    case 'support':
      return '🆘';
    case 'profile':
      return '👤';
    case 'dashboard':
      return '📈';
    default:
      return '🔑';
  }
};

export default function RoleCard({
  role,
  onViewPermissions,
  onEdit,
  onClick,
  showActions = true,
  variant = 'default',
  isSelected = false,
  isSeeded = false
}: RoleCardProps) {
  const getPermissionCount = () => {
    return role.permissions?.length || 0;
  };

  const getPermissionCategories = () => {
    const categories = role.permissions?.map(p => p.category) || [];
    return [...new Set(categories)];
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(role);
    } else if (onViewPermissions) {
      onViewPermissions(role);
    }
  };

  const cardClasses = `
    hover:shadow-lg transition-all cursor-pointer
    ${variant === 'compact' ? 'p-3' : ''}
    ${isSelected ? 'ring-2 ring-[#003465] border-[#003465]' : ''}
    ${variant === 'selection' ? 'hover:border-[#003465]' : ''}
  `;

  return (
    <Card 
      className={cardClasses}
      onClick={handleCardClick}
    >
      <CardHeader className={variant === 'compact' ? 'pb-2' : ''}>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#003465]" />
            <CardTitle className={variant === 'compact' ? 'text-base' : 'text-lg'}>
              {role.name}
            </CardTitle>
          </div>
          <div className="flex gap-2">
            <Badge variant={role.is_active ? "default" : "secondary"}>
              {role.is_active ? "Active" : "Inactive"}
            </Badge>
            {isSeeded && (
              <Badge variant="outline" className="text-xs">
                System
              </Badge>
            )}
            {isSelected && (
              <Badge className="bg-[#003465] text-white text-xs">
                Selected
              </Badge>
            )}
          </div>
        </div>
        {variant !== 'compact' && (
          <CardDescription className="text-sm text-gray-600">
            {role.description}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className={variant === 'compact' ? 'pt-0' : ''}>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Permissions:</span>
            <span className="font-medium">{getPermissionCount()}</span>
          </div>
          
          {getPermissionCategories().length > 0 && (
            <div className="flex flex-wrap gap-1">
              {getPermissionCategories().slice(0, variant === 'compact' ? 2 : 3).map((category) => (
                <Badge key={category} variant="outline" className="text-xs">
                  {category}
                </Badge>
              ))}
              {getPermissionCategories().length > (variant === 'compact' ? 2 : 3) && (
                <Badge variant="outline" className="text-xs">
                  +{getPermissionCategories().length - (variant === 'compact' ? 2 : 3)} more
                </Badge>
              )}
            </div>
          )}

          {showActions && (
            <div className="flex gap-2 pt-2">
              {!isSeeded && onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(role);
                  }}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              )}
              {onViewPermissions && (
                <Button
                  variant="outline"
                  size="sm"
                  className={!isSeeded && onEdit ? "flex-1" : "flex-1"}
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewPermissions(role);
                  }}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View Permissions
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
