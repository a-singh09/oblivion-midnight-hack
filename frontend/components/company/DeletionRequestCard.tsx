"use client";

import { useState, useEffect } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import { wsClient, WebSocketMessage } from "@/lib/websocket-client";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Tag,
  Calendar,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DeletionRequest {
  id: string;
  userDID: string;
  timestamp: number;
  dataCategories: string[];
  status: "pending" | "processing" | "completed" | "failed";
  webhookStatus: "pending" | "delivered" | "failed";
  retryAttempts: number;
}

interface DeletionRequestCardProps {
  request: DeletionRequest;
  selected: boolean;
  onToggleSelect: () => void;
}

export function DeletionRequestCard({
  request,
  selected,
  onToggleSelect,
}: DeletionRequestCardProps) {
  const { confirmDeletion } = useCompany();
  const [isConfirming, setIsConfirming] = useState(false);
  const [localStatus, setLocalStatus] = useState(request.status);
  const [localWebhookStatus, setLocalWebhookStatus] = useState(
    request.webhookStatus,
  );

  const requestDate = new Date(request.timestamp);
  const timeAgo = formatDistanceToNow(requestDate, { addSuffix: true });

  // Listen for real-time updates
  useEffect(() => {
    const handleStatusUpdate = (message: WebSocketMessage) => {
      if (message.type === "data_status_change") {
        // Update local status based on WebSocket message
        setLocalStatus("completed");
        setLocalWebhookStatus("delivered");
      }
    };

    wsClient.on("data_status_change", handleStatusUpdate);

    return () => {
      wsClient.off("data_status_change", handleStatusUpdate);
    };
  }, [request.id]);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await confirmDeletion(request.id);
      setLocalStatus("completed");
      setLocalWebhookStatus("delivered");
    } catch (error) {
      console.error("Failed to confirm deletion:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleRetry = async () => {
    // Retry webhook delivery
    console.log("Retrying webhook for request:", request.id);
  };

  const getStatusIcon = () => {
    switch (localStatus) {
      case "completed":
        return <CheckCircle className="text-accent" size={20} />;
      case "processing":
        return <RefreshCw className="text-primary animate-spin" size={20} />;
      case "failed":
        return <XCircle className="text-destructive" size={20} />;
      case "pending":
      default:
        return <Clock className="text-destructive" size={20} />;
    }
  };

  const getStatusBadge = () => {
    const baseClasses = "text-xs font-semibold px-3 py-1 rounded-full";

    switch (localStatus) {
      case "completed":
        return (
          <span className={`${baseClasses} text-accent bg-accent/20`}>
            COMPLETED
          </span>
        );
      case "processing":
        return (
          <span className={`${baseClasses} text-primary bg-primary/20`}>
            PROCESSING
          </span>
        );
      case "failed":
        return (
          <span className={`${baseClasses} text-destructive bg-destructive/20`}>
            FAILED
          </span>
        );
      case "pending":
      default:
        return (
          <span className={`${baseClasses} text-destructive bg-destructive/20`}>
            PENDING
          </span>
        );
    }
  };

  const getWebhookBadge = () => {
    const baseClasses = "text-xs font-medium px-2 py-1 rounded";

    switch (localWebhookStatus) {
      case "delivered":
        return (
          <span className={`${baseClasses} text-accent bg-accent/20`}>
            Webhook Delivered
          </span>
        );
      case "failed":
        return (
          <span className={`${baseClasses} text-destructive bg-destructive/20`}>
            Webhook Failed
          </span>
        );
      case "pending":
      default:
        return (
          <span className={`${baseClasses} text-muted-foreground bg-secondary`}>
            Webhook Pending
          </span>
        );
    }
  };

  return (
    <div
      className={`p-6 rounded-lg border transition-all ${
        selected
          ? "bg-primary/5 border-primary"
          : "bg-secondary/30 border-border hover:border-primary/50"
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="mt-1 w-4 h-4 rounded border-border"
        />

        {/* Status Icon */}
        <div className="flex-shrink-0 mt-1">{getStatusIcon()}</div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="font-mono text-sm text-foreground mb-1 break-all">
                {request.userDID}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar size={12} />
                <span>{timeAgo}</span>
              </div>
            </div>
            {getStatusBadge()}
          </div>

          {/* Data Categories */}
          <div className="flex flex-wrap gap-2 mb-3">
            {request.dataCategories.map((category, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded"
              >
                <Tag size={12} />
                {category}
              </span>
            ))}
          </div>

          {/* Webhook Status */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {getWebhookBadge()}
              {request.retryAttempts > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({request.retryAttempts}{" "}
                  {request.retryAttempts === 1 ? "retry" : "retries"})
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-3 border-t border-border">
            {localStatus === "pending" && (
              <button
                onClick={handleConfirm}
                disabled={isConfirming}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isConfirming ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle size={14} />
                    Confirm Deletion
                  </>
                )}
              </button>
            )}

            {localWebhookStatus === "failed" && (
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <RefreshCw size={14} />
                Retry Webhook
              </button>
            )}

            {localStatus === "completed" && (
              <a
                href={`https://explorer.preprod.midnight.network/deletion/${request.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View Proof
                <ExternalLink size={12} />
              </a>
            )}

            <button className="ml-auto text-sm text-muted-foreground hover:text-foreground transition-colors">
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
