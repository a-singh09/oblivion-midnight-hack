"use client";

import { useState } from "react";
import {
  X,
  Download,
  FileText,
  FileJson,
  FileSpreadsheet,
  QrCode,
} from "lucide-react";
import QRCode from "qrcode";

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

interface ProofExportDialogProps {
  proof: DeletionProof;
  onClose: () => void;
}

type ExportFormat = "pdf" | "json" | "csv";

export function ProofExportDialog({ proof, onClose }: ProofExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("json");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [showQR, setShowQR] = useState(false);

  const generateQRCode = async () => {
    const verificationUrl = `https://verify.oblivion.network/proof/${proof.deletionProofHash}`;
    try {
      const url = await QRCode.toDataURL(verificationUrl, {
        width: 300,
        margin: 2,
      });
      setQrCodeUrl(url);
      setShowQR(true);
    } catch (error) {
      console.error("Failed to generate QR code:", error);
    }
  };

  const exportProof = () => {
    const proofData = {
      serviceProvider: proof.serviceProvider,
      commitmentHash: proof.commitmentHash,
      deletionProofHash: proof.deletionProofHash,
      timestamp: new Date(proof.timestamp).toISOString(),
      blockNumber: proof.blockNumber,
      transactionHash: proof.transactionHash,
      zkProofVerified: proof.zkProofVerified,
      verificationUrl: `https://verify.oblivion.network/proof/${proof.deletionProofHash}`,
      explorerUrl: `https://explorer.preprod.midnight.network/tx/${proof.transactionHash}`,
    };

    let content: string;
    let mimeType: string;
    let filename: string;

    switch (selectedFormat) {
      case "json":
        content = JSON.stringify(proofData, null, 2);
        mimeType = "application/json";
        filename = `deletion-proof-${proof.id}.json`;
        break;

      case "csv":
        const headers = Object.keys(proofData).join(",");
        const values = Object.values(proofData)
          .map((v) => (typeof v === "string" && v.includes(",") ? `"${v}"` : v))
          .join(",");
        content = `${headers}\n${values}`;
        mimeType = "text/csv";
        filename = `deletion-proof-${proof.id}.csv`;
        break;

      case "pdf":
        // For PDF, we'll create a simple text representation
        // In production, use a proper PDF library like jsPDF
        content = `
DELETION PROOF CERTIFICATE
==========================

Service Provider: ${proofData.serviceProvider}
Deletion Date: ${proofData.timestamp}

BLOCKCHAIN VERIFICATION
-----------------------
Commitment Hash: ${proofData.commitmentHash}
Deletion Proof Hash: ${proofData.deletionProofHash}
Transaction Hash: ${proofData.transactionHash}
Block Number: ${proofData.blockNumber}
ZK Proof Verified: ${proofData.zkProofVerified ? "Yes" : "No"}

VERIFICATION LINKS
------------------
Verification URL: ${proofData.verificationUrl}
Explorer URL: ${proofData.explorerUrl}

This certificate provides cryptographic proof that data deletion
was completed and recorded on the Midnight blockchain.
        `.trim();
        mimeType = "text/plain";
        filename = `deletion-proof-${proof.id}.txt`;
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;

    const a = document.createElement("a");
    a.href = qrCodeUrl;
    a.download = `proof-qr-${proof.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-md w-full border border-border">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">
            Export Proof
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!showQR ? (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                Export this deletion proof in your preferred format for
                record-keeping or regulatory compliance.
              </p>

              {/* Format Selection */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => setSelectedFormat("json")}
                  className={`w-full p-4 rounded-lg border transition-all flex items-center gap-3 ${
                    selectedFormat === "json"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <FileJson
                    className={
                      selectedFormat === "json"
                        ? "text-primary"
                        : "text-muted-foreground"
                    }
                    size={24}
                  />
                  <div className="text-left flex-1">
                    <div className="font-medium text-foreground">
                      JSON Format
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Machine-readable structured data
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedFormat("csv")}
                  className={`w-full p-4 rounded-lg border transition-all flex items-center gap-3 ${
                    selectedFormat === "csv"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <FileSpreadsheet
                    className={
                      selectedFormat === "csv"
                        ? "text-primary"
                        : "text-muted-foreground"
                    }
                    size={24}
                  />
                  <div className="text-left flex-1">
                    <div className="font-medium text-foreground">
                      CSV Format
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Import into spreadsheets
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedFormat("pdf")}
                  className={`w-full p-4 rounded-lg border transition-all flex items-center gap-3 ${
                    selectedFormat === "pdf"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <FileText
                    className={
                      selectedFormat === "pdf"
                        ? "text-primary"
                        : "text-muted-foreground"
                    }
                    size={24}
                  />
                  <div className="text-left flex-1">
                    <div className="font-medium text-foreground">
                      PDF/Text Format
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Human-readable certificate
                    </div>
                  </div>
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={exportProof}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  Export
                </button>
                <button
                  onClick={generateQRCode}
                  className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <QrCode size={16} />
                  QR Code
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Scan this QR code to verify the proof on mobile devices
                </p>
                {qrCodeUrl && (
                  <img
                    src={qrCodeUrl}
                    alt="Verification QR Code"
                    className="mx-auto rounded-lg border border-border"
                  />
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={downloadQRCode}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  Download QR
                </button>
                <button
                  onClick={() => setShowQR(false)}
                  className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg font-medium transition-colors"
                >
                  Back
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
