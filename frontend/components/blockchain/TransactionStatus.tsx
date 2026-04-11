"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2, Check, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TransactionStatusProps {
  txHash: string;
  onComplete?: (success: boolean) => void;
}

type TxStatus = "pending" | "confirmed" | "failed";

export function TransactionStatus({
  txHash,
  onComplete,
}: TransactionStatusProps) {
  const [status, setStatus] = useState<TxStatus>("pending");
  const [blockNumber, setBlockNumber] = useState<number | null>(null);
  const [confirmations, setConfirmations] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    // Poll transaction status
    const pollInterval = setInterval(async () => {
      try {
        // In production, this would query the indexer
        const response = await fetch(`/api/transaction/${txHash}/status`);
        const data = await response.json();

        setStatus(data.status);
        setBlockNumber(data.blockNumber);
        setConfirmations(data.confirmations || 0);

        if (data.status === "confirmed" || data.status === "failed") {
          clearInterval(pollInterval);
          onComplete?.(data.status === "confirmed");
        }
      } catch (error) {
        console.error("Error polling transaction:", error);
      }
    }, 2000);

    // Update elapsed time
    const timeInterval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(timeInterval);
    };
  }, [txHash, onComplete]);

  const explorerUrl = `https://explorer.preprod.midnight.network/tx/${txHash}`;

  const getStatusIcon = () => {
    switch (status) {
      case "pending":
        return <Loader2 className="animate-spin text-primary" size={20} />;
      case "confirmed":
        return <Check className="text-accent" size={20} />;
      case "failed":
        return <X className="text-destructive" size={20} />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "pending":
        return "Pending Confirmation";
      case "confirmed":
        return "Confirmed";
      case "failed":
        return "Failed";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "pending":
        return "border-primary/30 bg-primary/10";
      case "confirmed":
        return "border-accent/30 bg-accent/10";
      case "failed":
        return "border-destructive/30 bg-destructive/10";
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-semibold text-foreground">
            {getStatusText()}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock size={12} />
          {elapsedTime}s
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <div className="text-muted-foreground mb-1">Transaction Hash</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono text-xs text-primary break-all">
              {txHash}
            </code>
            <Button
              onClick={() => window.open(explorerUrl, "_blank")}
              variant="ghost"
              size="sm"
              className="shrink-0"
            >
              <ExternalLink size={14} />
            </Button>
          </div>
        </div>

        {blockNumber && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Block Number:</span>
            <span className="font-mono text-foreground">{blockNumber}</span>
          </div>
        )}

        {confirmations > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Confirmations:</span>
            <span className="font-mono text-foreground">{confirmations}</span>
          </div>
        )}
      </div>

      {status === "pending" && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="text-xs text-muted-foreground">
            Waiting for blockchain confirmation... This usually takes 10-30
            seconds.
          </div>
        </div>
      )}

      {status === "confirmed" && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="text-xs text-accent">
            ✓ Transaction confirmed on the blockchain
          </div>
        </div>
      )}

      {status === "failed" && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="text-xs text-destructive">
            ✗ Transaction failed. Please try again.
          </div>
        </div>
      )}
    </div>
  );
}
