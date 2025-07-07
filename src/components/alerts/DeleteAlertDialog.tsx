'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export interface DeleteAlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  alertInfo?: {
    neighborhoods: string[];
    bedrooms?: number | null;
    priceRange?: string;
  };
  isDeleting?: boolean;
}

export default function DeleteAlertDialog({
  isOpen,
  onClose,
  onConfirm,
  alertInfo,
  isDeleting = false,
}: DeleteAlertDialogProps) {
  if (!isOpen) return null;

  // Format bedrooms display
  const formatBedrooms = (bedrooms?: number | null) => {
    if (bedrooms === null || bedrooms === undefined) {
      return 'Any size';
    }
    if (bedrooms === 0) {
      return 'Studio';
    }
    return bedrooms === 1 ? '1 bedroom' : `${bedrooms} bedrooms`;
  };

  // Format neighborhoods for display
  const formatNeighborhoods = (neighborhoods: string[]) => {
    if (neighborhoods.length <= 2) {
      return neighborhoods.join(', ');
    }
    return `${neighborhoods.slice(0, 2).join(', ')}, +${neighborhoods.length - 2} more`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <Card className="relative w-full max-w-md mx-4 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <CardTitle className="text-lg">Delete Alert</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 rounded-full"
              disabled={isDeleting}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-4">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this alert? This action cannot be undone.
            </p>
            
            {alertInfo && (
              <div className="rounded-lg border bg-muted/50 p-3">
                <div className="space-y-1 text-sm">
                  <div className="font-medium">
                    {formatBedrooms(alertInfo.bedrooms)}
                    {alertInfo.priceRange && ` • ${alertInfo.priceRange}`}
                  </div>
                  <div className="text-muted-foreground">
                    {formatNeighborhoods(alertInfo.neighborhoods)}
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <p className="text-sm text-destructive">
                You will no longer receive email notifications for apartments matching this alert.
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-0 gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1"
          >
            {isDeleting ? 'Deleting...' : 'Delete Alert'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}