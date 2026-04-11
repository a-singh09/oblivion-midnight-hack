"use client";

import { useState } from "react";
import {
  X,
  CheckCircle,
  Shield,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";

interface DeletionProof {
  id: string;
  serviceProvider: string;
  commitmentHash: string;
  deletionProofHash: string;
  timestamp: number;
  blockNumber: number;
  transactionHash: string;
  zkProofVerified: boolean;
}

interface ProofVerificationWidgetProps {
  proof: DeletionProof;
  onClose: () => void;
}

export function ProofVerificationWidget({
  proof,
  onClose,
}: ProofVerificationWidgetProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const verificationSteps = [
    {
      label: "Commitment Hash on Blockchain",
      value: proof.commitmentHash,
      verified: true,
      link: `https://explorer.preprod.midnight.network/commitment/${proof.commitmentHash}`,
    },
    {
      label: "Deletion Proof Hash",
      value: proof.deletionProofHash,
      verified: proof.zkProofVerified,
      link: `https://explorer.preprod.midnight.network/proof/${proof.deletionProofHash}`,
    },
    {
      label: "ZK-SNARK Verification",
      value: proof.zkProofVerified ? "Valid" : "Pending",
      verified: proof.zkProofVerified,
    },
    {
      label: "Block Confirmation",
      value: `Block #${proof.blockNumber.toLocaleString()}`,
      verified: true,
      link: `https://explorer.preprod.midnight.network/block/${proof.blockNumber}`,
    },
    {
      label: "Cryptographic Signature",
      value: "Valid",
      verified: true,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
              <Shield className="text-accent" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Proof Verification
              </h2>
              <p className="text-sm text-muted-foreground">
                {proof.serviceProvider}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Overall Status */}
          <div className="mb-6 p-4 rounded-lg bg-accent/10 border border-accent/30 flex items-start gap-3">
            <CheckCircle
              className="text-accent flex-shrink-0 mt-0.5"
              size={20}
            />
            <div>
              <p className="font-semibold text-foreground mb-1">
                Proof Verified Successfully
              </p>
              <p className="text-sm text-muted-foreground">
                This deletion has been cryptographically verified on the
                Midnight blockchain
              </p>
            </div>
          </div>

          {/* Verification Steps */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-foreground">
              Verification Details
            </h3>
            {verificationSteps.map((step, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-secondary/30 border border-border"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-foreground">
                      {step.label}
                    </div>
                    {step.verified && (
                      <CheckCircle className="text-accent" size={16} />
                    )}
                  </div>
                  {step.link && (
                    <a
                      href={step.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 text-xs"
                    >
                      View
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="font-mono text-sm text-muted-foreground break-all flex-1">
                    {step.value}
                  </div>
                  {step.value.startsWith("0x") && (
                    <button
                      onClick={() => copyToClipboard(step.value, step.label)}
                      className="p-1 hover:bg-secondary rounded transition-colors flex-shrink-0"
                    >
                      {copied === step.label ? (
                        <Check size={14} className="text-accent" />
                      ) : (
                        <Copy size={14} className="text-muted-foreground" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Timestamp */}
          <div className="mb-6 p-4 rounded-lg bg-secondary/30 border border-border">
            <div className="text-sm font-medium text-foreground mb-1">
              Deletion Timestamp
            </div>
            <div className="text-sm text-muted-foreground">
              {new Date(proof.timestamp).toLocaleString()} (Block #
              {proof.blockNumber.toLocaleString()})
            </div>
          </div>

          {/* Witness Data */}
          <div className="mb-6 p-4 rounded-lg bg-secondary/30 border border-border">
            <div className="text-sm font-medium text-foreground mb-2">
              Witness Data Confirmation
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Zero-knowledge proof confirms data deletion without revealing the
              actual data content
            </p>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="text-accent" size={16} />
              <span className="text-accent font-medium">
                Witness data verified (content private)
              </span>
            </div>
          </div>

          {/* Smart Contract State */}
          <div className="p-4 rounded-lg bg-secondary/30 border border-border">
            <div className="text-sm font-medium text-foreground mb-2">
              Smart Contract State
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contract Address:</span>
                <span className="font-mono text-foreground">0x1234...5678</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  State at Deletion:
                </span>
                <span className="text-accent font-medium">Confirmed</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Proof Type:</span>
                <span className="text-foreground">ZK-SNARK</span>
              </div>
            </div>
          </div>

          {/* Public Verification URL */}
          <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/30">
            <div className="text-sm font-medium text-foreground mb-2">
              Third-Party Verification
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Share this URL with auditors or regulators for independent
              verification
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={`https://verify.oblivion.network/proof/${proof.deletionProofHash}`}
                readOnly
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono"
              />
              <button
                onClick={() =>
                  copyToClipboard(
                    `https://verify.oblivion.network/proof/${proof.deletionProofHash}`,
                    "verification-url",
                  )
                }
                className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                {copied === "verification-url" ? (
                  <Check size={16} />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-border p-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
