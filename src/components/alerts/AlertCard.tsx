'use client';

import React from 'react';
import {
  Edit2,
  Trash2,
  MapPin,
  DollarSign,
  Home,
  Heart,
  Clock,
  Calendar,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Alert data interface matching the database schema
export interface AlertData {
  id: number;
  neighborhoods: string[];
  min_price?: number | null;
  max_price?: number | null;
  bedrooms?: number | null;
  pet_friendly?: boolean | null;
  max_commute_minutes?: number | null;
  commute_destination?: string | null;
  created_at: string;
  updated_at?: string;
  is_active: boolean;
}

export interface AlertCardProps {
  alert: AlertData;
  onEdit?: (alertId: number) => void;
  onDelete?: (alertId: number) => void;
  showActions?: boolean;
  className?: string;
}

export default function AlertCard({
  alert,
  onEdit,
  onDelete,
  showActions = true,
  className,
}: AlertCardProps) {
  // Format price range display
  const formatPriceRange = () => {
    if (!alert.min_price && !alert.max_price) {
      return 'Any price';
    }
    if (alert.min_price && !alert.max_price) {
      return `$${alert.min_price.toLocaleString()}+`;
    }
    if (!alert.min_price && alert.max_price) {
      return `Up to $${alert.max_price.toLocaleString()}`;
    }
    if (alert.min_price && alert.max_price) {
      return `$${alert.min_price.toLocaleString()} - $${alert.max_price.toLocaleString()}`;
    }
    return 'Any price';
  };

  // Format bedrooms display
  const formatBedrooms = () => {
    if (alert.bedrooms === null) {
      return 'Any size';
    }
    if (alert.bedrooms === 0) {
      return 'Studio';
    }
    return alert.bedrooms === 1 ? '1 bedroom' : `${alert.bedrooms} bedrooms`;
  };

  // Format neighborhoods for display
  const formatNeighborhoods = () => {
    if (alert.neighborhoods.length <= 3) {
      return alert.neighborhoods.join(', ');
    }
    return `${alert.neighborhoods.slice(0, 3).join(', ')}, +${
      alert.neighborhoods.length - 3
    } more`;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Format commute info
  const formatCommute = () => {
    if (!alert.commute_destination || !alert.max_commute_minutes) {
      return null;
    }
    return `${alert.max_commute_minutes} min to ${alert.commute_destination}`;
  };

  return (
    <Card className={className} variant="elevated">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">
              {formatBedrooms()} • {formatPriceRange()}
            </CardTitle>
            <CardDescription className="mt-1 flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {formatNeighborhoods()}
            </CardDescription>
          </div>
          <Badge
            variant={alert.is_active ? 'default' : 'secondary'}
            className="ml-2"
          >
            {alert.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-4">
        <div className="space-y-3">
          {/* Price Range */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span>{formatPriceRange()}</span>
          </div>

          {/* Bedrooms */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Home className="h-4 w-4" />
            <span>{formatBedrooms()}</span>
          </div>

          {/* Pet Friendly */}
          {alert.pet_friendly !== null && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Heart className="h-4 w-4" />
              <span>{alert.pet_friendly ? 'Pet-friendly' : 'No pets'}</span>
            </div>
          )}

          {/* Commute */}
          {formatCommute() && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{formatCommute()}</span>
            </div>
          )}

          {/* Created Date */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Created {formatDate(alert.created_at)}</span>
          </div>
        </div>

        {/* Neighborhoods badges */}
        <div className="mt-4">
          <div className="flex flex-wrap gap-1">
            {alert.neighborhoods.slice(0, 6).map((neighborhood) => (
              <Badge key={neighborhood} variant="outline" className="text-xs">
                {neighborhood}
              </Badge>
            ))}
            {alert.neighborhoods.length > 6 && (
              <Badge variant="outline" className="text-xs">
                +{alert.neighborhoods.length - 6} more
              </Badge>
            )}
          </div>
        </div>
      </CardContent>

      {showActions && (
        <CardFooter className="pt-0 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit?.(alert.id)}
            className="flex-1"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete?.(alert.id)}
            className="flex-1"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
