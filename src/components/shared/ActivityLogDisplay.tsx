"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActivityLog } from "@/hooks/useActivityLogs";
import { formatDistanceToNow } from "date-fns";
import { Clock, User, Building2, Activity } from "lucide-react";

interface ActivityLogDisplayProps {
  activities: ActivityLog[];
  title?: string;
  description?: string;
  isLoading?: boolean;
  maxItems?: number;
}

export default function ActivityLogDisplay({ 
  activities, 
  title = "Recent Activity", 
  description = "Latest system activities",
  isLoading = false,
  maxItems = 5 
}: ActivityLogDisplayProps) {
  const getActivityColor = (activityType: string) => {
    switch (activityType?.toLowerCase()) {
      case 'super_admin':
        return 'bg-purple-500';
      case 'tenant':
        return 'bg-blue-500';
      case 'system':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType?.toLowerCase()) {
      case 'super_admin':
        return <Activity className="w-3 h-3" />;
      case 'tenant':
        return <Building2 className="w-3 h-3" />;
      case 'system':
        return <Activity className="w-3 h-3" />;
      default:
        return <Activity className="w-3 h-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const displayedActivities = activities.slice(0, maxItems);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: maxItems }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {displayedActivities.length > 0 ? (
          <div className="space-y-4">
            {displayedActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                <div className={`w-2 h-2 ${getActivityColor(activity.activityType)} rounded-full mt-2`}></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {activity.metadata?.description || activity.action}
                    </span>
                    <Badge variant="outline" className={`text-xs ${getStatusColor(activity.status)}`}>
                      {activity.status}
                    </Badge>
                  </div>
                  
                  {/* User Information */}
                  {activity.userContext?.name && (
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-blue-600 font-medium">
                        {activity.userContext.name}
                      </span>
                      {activity.userContext.email && (
                        <span className="text-xs text-gray-500">
                          ({activity.userContext.email})
                        </span>
                      )}
                    </div>
                  )}

                  {/* Additional Context */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {activity.tenantId && (
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        <span>Tenant: {activity.tenantId}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}</span>
                    </div>
                  </div>

                  {/* Resource Information */}
                  {activity.resource && (
                    <div className="mt-1">
                      <Badge variant="outline" className="text-xs">
                        {activity.resource}
                        {activity.resourceId && ` #${activity.resourceId}`}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No recent activity</p>
            <p className="text-xs text-gray-400 mt-1">Activity will appear here as users interact with the system</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 