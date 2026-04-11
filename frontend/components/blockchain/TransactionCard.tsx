"use client";

import { ExternalLink, Copy, Check, Shield } from "lucide-react";
import { useState } from "react";

interface TransactionCardProps {
  hash: string;
  type: "registration" | "deletion";
  timestamp: number;
  serviceProvider?: string;
  proofHash?: string;
}

export function TransactionCard({
  hash,
  type,
  timestamp,
  serviceProvider,
  proofHash,
}: TransactionCardProps) {
  const [copied, setCopied] = useState(false);

  const copyHash = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const explorerUrl = `https://explorer.preprod.midnight.network/tx/${hash}`;

  return (
    <div className="p-4 rounded-lg bg-secondary/30 border border-border">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield
            size={16}
            className={type === "deletion" ? "text-destructive" : "text-accent"}
          />
          <span className="text-sm font-semibold text-foreground">
            {type === "deletion" ? "Deletion Proof" : "Data Registration"}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {new Date(timestamp).toLocaleString()}
        </span>
      </div>

      {serviceProvider && (
        <div className="mb-2 text-sm text-muted-foreground">
          Service: <span className="text-foreground">{serviceProvider}</span>
        </div>
      )}

      <div className="flex items-center gap-2 p-2 rounded bg-background border border-border">
        <code className="flex-1 text-xs text-muted-foreground font-mono truncate">
          {hash}
        </code>
        <button
          onClick={copyHash}
          className="p-1 hover:bg-secondary rounded transition-colors flex-shrink-0"
          title="Copy transaction hash"
        >
          {copied ? (
            <Check size={14} className="text-accent" />
          ) : (
            <Copy size={14} className="text-muted-foreground" />
          )}
        </button>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 hover:bg-secondary rounded transition-colors flex-shrink-0"
          title="View on Midnight Explorer"
        >
          <ExternalLink size={14} className="text-primary" />
        </a>
      </div>

      {proofHash && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="text-xs text-muted-foreground mb-1">
            ZK Proof Hash:
          </div>
          <code className="text-xs text-accent font-mono break-all">
            {proofHash}
          </code>
        </div>
      )}
    </div>
  );
}
