"use client";

import { EnhancedDataLocation } from "@/lib/blockchain-data-service";
import {
  Shield,
  ExternalLink,
  Calendar,
  Tag,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { IndividualDeleteButton } from "./IndividualDeleteButton";

interface DataLocationCardProps {
  location: EnhancedDataLocation;
  onDelete?: (commitmentHash: string) => Promise<void>;
}

export function DataLocationCard({
  location,
  onDelete,
}: DataLocationCardProps) {
  const createdDate = new Date(location.createdAt);
  const timeAgo = formatDistanceToNow(createdDate, { addSuffix: true });

  return (
    <div
      className={`p-6 rounded-lg border transition-all ${
        location.deleted
          ? "bg-secondary/30 border-border opacity-60"
          : "bg-secondary/50 border-border hover:border-primary hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground text-lg mb-1">
            {location.serviceProvider}
          </h3>
          <div className="flex flex-wrap gap-2 mb-2">
            {(location.dataCategories ?? []).map((category, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-full"
              >
                <Tag size={12} />
                {category}
              </span>
            ))}
          </div>
        </div>
        {location.deleted ? (
          <span className="text-xs font-semibold text-accent bg-accent/20 px-3 py-1 rounded-full flex-shrink-0">
            DELETED
          </span>
        ) : (
          <span className="text-xs font-semibold text-primary bg-primary/20 px-3 py-1 rounded-full flex-shrink-0">
            ACTIVE
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
        <Calendar size={14} />
        <span>Created {timeAgo}</span>
      </div>

      {/* Blockchain Status */}
      <div className="flex items-center gap-2 text-xs mb-3">
        {location.blockchainStatus === "confirmed" && (
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle size={14} />
            Confirmed on blockchain
          </span>
        )}
        {location.blockchainStatus === "pending" && (
          <span className="flex items-center gap-1 text-yellow-600">
            <Clock size={14} />
            Pending confirmation
          </span>
        )}
        {location.blockchainStatus === "deleted" && (
          <span className="flex items-center gap-1 text-accent">
            <Shield size={14} />
            Deletion verified
          </span>
        )}
        {location.blockchainStatus === "unknown" && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <XCircle size={14} />
            Status unknown
          </span>
        )}
      </div>

      {location.deleted ? (
        <div className="space-y-2">
          {location.explorerUrl && (
            <a
              href={location.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <Shield size={14} />
              View on Midnight Explorer
              <ExternalLink size={12} />
            </a>
          )}
          {location.blockNumber && (
            <div className="text-xs text-muted-foreground">
              Block: {location.blockNumber}
            </div>
          )}
        </div>
      ) : (
        <div className="flex justify-between items-center pt-2 border-t border-border">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">
              Hash: {location.commitmentHash.slice(0, 16)}...
            </span>
            {location.transactionHash && (
              <a
                href={location.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                View on Explorer
                <ExternalLink size={10} />
              </a>
            )}
          </div>
          {onDelete && (
            <IndividualDeleteButton
              commitmentHash={location.commitmentHash}
              serviceProvider={location.serviceProvider}
              onDelete={onDelete}
            />
          )}
        </div>
      )}
    </div>
  );
}
