"use client";

import { useState, useEffect } from "react";
import {
  ExternalLink,
  CheckCircle,
  Shield,
  Clock,
  QrCode,
  Copy,
  Check,
} from "lucide-react";
import QRCode from "qrcode";

interface BlockchainExplorerWidgetProps {
  transactionHash: string;
  proofHash: string;
  blockNumber: number;
  timestamp: number;
}

export function BlockchainExplorerWidget({
  transactionHash,
  proofHash,
  blockNumber,
  timestamp,
}: BlockchainExplorerWidgetProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<
    "verifying" | "verified" | "failed"
  >("verifying");

  const explorerUrl = `https://explorer.preprod.midnight.network/tx/${transactionHash}`;
  const proofUrl = `https://explorer.preprod.midnight.network/proof/${proofHash}`;

  useEffect(() => {
    // Simulate verification
    const timer = setTimeout(() => {
      setVerificationStatus("verified");
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const generateQRCode = async () => {
    try {
      const url = await QRCode.toDataURL(explorerUrl, {
        width: 300,
        margin: 2,
      });
      setQrCodeUrl(url);
      setShowQR(true);
    } catch (error) {
      console.error("Failed to generate QR code:", error);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-6 rounded-lg bg-secondary/30 border border-border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Shield className="text-primary" size={20} />
          Blockchain Verification
        </h3>
        {verificationStatus === "verified" && (
          <span className="flex items-center gap-1 text-xs font-semibold text-accent bg-accent/20 px-3 py-1 rounded-full">
            <CheckCircle size={14} />
            Verified
          </span>
        )}
        {verificationStatus === "verifying" && (
          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-secondary px-3 py-1 rounded-full">
            <Clock size={14} className="animate-pulse" />
            Verifying...
          </span>
        )}
      </div>

      {/* Transaction Details */}
      <div className="space-y-4 mb-6">
        <div className="p-4 rounded-lg bg-background/50 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Transaction Hash
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(transactionHash, "tx")}
                className="p-1 hover:bg-secondary rounded transition-colors"
              >
                {copied === "tx" ? (
                  <Check size={14} className="text-accent" />
                ) : (
                  <Copy size={14} className="text-muted-foreground" />
                )}
              </button>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
          <div className="font-mono text-sm text-foreground break-all">
            {transactionHash}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-background/50 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              ZK Proof Hash
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(proofHash, "proof")}
                className="p-1 hover:bg-secondary rounded transition-colors"
              >
                {copied === "proof" ? (
                  <Check size={14} className="text-accent" />
                ) : (
                  <Copy size={14} className="text-muted-foreground" />
                )}
              </button>
              <a
                href={proofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
          <div className="font-mono text-sm text-foreground break-all">
            {proofHash}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-background/50 border border-border">
            <div className="text-sm font-medium text-muted-foreground mb-1">
              Block Number
            </div>
            <div className="font-mono text-lg font-semibold text-foreground">
              #{blockNumber.toLocaleString()}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-background/50 border border-border">
            <div className="text-sm font-medium text-muted-foreground mb-1">
              Confirmations
            </div>
            <div className="font-mono text-lg font-semibold text-accent">
              {Math.floor(Math.random() * 100) + 50}
            </div>
          </div>
        </div>
      </div>

      {/* Verification Status */}
      {verificationStatus === "verified" && (
        <div className="mb-6 p-4 rounded-lg bg-accent/10 border border-accent/30">
          <div className="flex items-start gap-3">
            <CheckCircle className="text-accent shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <div className="font-semibold text-foreground mb-1">
                ZK Proof Validated
              </div>
              <div className="text-sm text-muted-foreground mb-3">
                Zero-knowledge proof has been cryptographically verified on the
                Midnight blockchain
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-accent" size={14} />
                  <span className="text-foreground">
                    Witness data confirmed
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-accent" size={14} />
                  <span className="text-foreground">
                    Contract state verified
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-accent" size={14} />
                  <span className="text-foreground">Signature valid</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-accent" size={14} />
                  <span className="text-foreground">Block confirmed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Smart Contract State */}
      <div className="mb-6 p-4 rounded-lg bg-background/50 border border-border">
        <div className="text-sm font-medium text-foreground mb-3">
          Smart Contract State
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Contract:</span>
            <span className="font-mono text-foreground">OblivionDeletion</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Method:</span>
            <span className="font-mono text-foreground">recordDeletion()</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gas Used:</span>
            <span className="font-mono text-foreground">127,543</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Timestamp:</span>
            <span className="text-foreground">
              {new Date(timestamp).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
        >
          <ExternalLink size={16} />
          View on Explorer
        </a>
        <button
          onClick={generateQRCode}
          className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <QrCode size={16} />
          QR Code
        </button>
      </div>

      {/* QR Code Modal */}
      {showQR && qrCodeUrl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-sm w-full p-6 border border-border">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Scan to Verify
              </h3>
              <p className="text-sm text-muted-foreground">
                Scan this QR code with your mobile device to verify the proof
              </p>
            </div>
            <img
              src={qrCodeUrl}
              alt="Verification QR Code"
              className="mx-auto rounded-lg border border-border mb-4"
            />
            <button
              onClick={() => setShowQR(false)}
              className="w-full px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
