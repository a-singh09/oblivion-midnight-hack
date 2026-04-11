"use client";

import { useState } from "react";
import {
  Shield,
  Download,
  ExternalLink,
  CheckCircle,
  FileText,
  QrCode,
} from "lucide-react";
import { ProofVerificationCard } from "@/components/proofs/ProofVerificationCard";

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

export default function ProofsPage() {
  const [selectedProof, setSelectedProof] = useState<DeletionProof | null>(
    null,
  );
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Mock data - would come from API
  const proofs: DeletionProof[] = [
    {
      id: "1",
      serviceProvider: "EuroBank",
      commitmentHash: "0x1234567890abcdef1234567890abcdef12345678",
      deletionProofHash: "0xabcdef1234567890abcdef1234567890abcdef12",
      timestamp: Date.now() - 86400000,
      blockNumber: 12345678,
      transactionHash: "0x9876543210fedcba9876543210fedcba98765432",
      zkProofVerified: true,
    },
    {
      id: "2",
      serviceProvider: "HealthChain Medical",
      commitmentHash: "0x2345678901bcdef2345678901bcdef23456789",
      deletionProofHash: "0xbcdef2345678901bcdef2345678901bcdef234",
      timestamp: Date.now() - 172800000,
      blockNumber: 12345123,
      transactionHash: "0x8765432109edcba8765432109edcba87654321",
      zkProofVerified: true,
    },
  ];

  const generateAuditReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      totalProofs: proofs.length,
      proofs: proofs.map((p) => ({
        serviceProvider: p.serviceProvider,
        commitmentHash: p.commitmentHash,
        deletionProofHash: p.deletionProofHash,
        timestamp: new Date(p.timestamp).toISOString(),
        blockNumber: p.blockNumber,
        transactionHash: p.transactionHash,
        zkProofVerified: p.zkProofVerified,
        explorerLink: `https://explorer.preprod.midnight.network/tx/${p.transactionHash}`,
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Header */}
      <section className="border-b border-border bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-foreground mb-2">
                Deletion Proofs
              </h1>
              <p className="text-sm text-muted-foreground">
                Cryptographic proof of your data deletions on the blockchain
              </p>
            </div>
            <button
              onClick={generateAuditReport}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              <Download size={16} />
              Generate Audit Report
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="text-accent" size={24} />
                <div className="text-3xl font-bold text-foreground">
                  {proofs.length}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Total Deletion Proofs
              </div>
            </div>

            <div className="p-6 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="text-accent" size={24} />
                <div className="text-3xl font-bold text-accent">
                  {proofs.filter((p) => p.zkProofVerified).length}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                ZK Proofs Verified
              </div>
            </div>

            <div className="p-6 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="text-primary" size={24} />
                <div className="text-3xl font-bold text-primary">100%</div>
              </div>
              <div className="text-sm text-muted-foreground">
                Compliance Rate
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proofs List */}
      <section>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Your Deletion Proofs
          </h2>

          {proofs.length === 0 ? (
            <div className="text-center py-12">
              <Shield
                className="text-muted-foreground mx-auto mb-4"
                size={48}
              />
              <p className="text-muted-foreground">No deletion proofs yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {proofs.map((proof) => (
                <div
                  key={proof.id}
                  className="p-6 rounded-lg bg-secondary/30 border border-border hover:border-primary transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        {proof.serviceProvider}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Deleted {new Date(proof.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    {proof.zkProofVerified && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-accent bg-accent/20 px-3 py-1 rounded-full">
                        <CheckCircle size={14} />
                        Verified
                      </span>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Commitment Hash
                      </div>
                      <div className="font-mono text-sm text-foreground break-all">
                        {proof.commitmentHash}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Deletion Proof Hash
                      </div>
                      <div className="font-mono text-sm text-foreground break-all">
                        {proof.deletionProofHash}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Block Number
                      </div>
                      <div className="font-mono text-sm text-foreground">
                        #{proof.blockNumber.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Transaction Hash
                      </div>
                      <div className="font-mono text-sm text-foreground break-all">
                        {proof.transactionHash.slice(0, 20)}...
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <button
                      onClick={() => setSelectedProof(proof)}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                      <Shield size={14} />
                      Verify Proof
                    </button>
                    <a
                      href={`https://explorer.preprod.midnight.network/tx/${proof.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      View on Explorer
                      <ExternalLink size={14} />
                    </a>
                    <button
                      onClick={() => {
                        setSelectedProof(proof);
                        setShowExportDialog(true);
                      }}
                      className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <Download size={14} />
                      Export
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Proof Verification Modal */}
      {selectedProof && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full">
            <ProofVerificationCard
              commitmentHash={selectedProof.commitmentHash}
              deletionProofHash={selectedProof.deletionProofHash}
              transactionHash={selectedProof.transactionHash}
              blockNumber={selectedProof.blockNumber}
              timestamp={selectedProof.timestamp}
            />
            <button
              onClick={() => setSelectedProof(null)}
              className="mt-4 w-full px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
