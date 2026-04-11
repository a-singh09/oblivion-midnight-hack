"use client";

import { useState } from "react";
import { useDashboard } from "@/contexts/DashboardContext";
import {
  AlertCircle,
  Trash2,
  Check,
  Shield,
  Download,
  ExternalLink,
} from "lucide-react";
import { DeletionResult } from "@/lib/api-client";

export function DeleteAllButton() {
  const { dataLocations, deleteAllData, deletionProgress, isDeleting } =
    useDashboard();
  const [showModal, setShowModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState<
    "confirm" | "deleting" | "success"
  >("confirm");
  const [deletionResult, setDeletionResult] = useState<DeletionResult | null>(
    null,
  );

  const activeCount = dataLocations.filter((loc) => !loc.deleted).length;

  const handleDeleteClick = () => {
    setShowModal(true);
    setDeleteStep("confirm");
    setDeletionResult(null);
  };

  const confirmDelete = async () => {
    setDeleteStep("deleting");

    try {
      const result = await deleteAllData();
      setDeletionResult(result);
      setDeleteStep("success");
    } catch (error) {
      console.error("Deletion failed:", error);
      setShowModal(false);
    }
  };

  const downloadCertificate = () => {
    if (!deletionResult) return;

    const certificate = {
      deletedCount: deletionResult.deletedCount,
      blockchainProofs: deletionResult.blockchainProofs,
      certificates: deletionResult.certificates,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(certificate, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deletion-certificate-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (activeCount === 0) {
    return null;
  }

  return (
    <>
      <div className="mb-12 p-6 rounded-lg bg-destructive/10 border border-destructive/30">
        <div className="flex items-start gap-4">
          <AlertCircle
            className="text-destructive flex-shrink-0 mt-1"
            size={24}
          />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Delete All My Data - Right to Be Forgotten
            </h3>
            <p className="text-muted-foreground mb-4">
              This will delete your data from all {activeCount} active services.
              You'll receive cryptographic proof on the blockchain. This action
              cannot be undone.
            </p>
            <button
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="px-6 py-2 bg-destructive text-destructive-foreground rounded-full font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              <Trash2 size={16} />
              Delete All Data Now
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-md w-full p-6 border border-border">
            {deleteStep === "confirm" && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                    <AlertCircle className="text-destructive" size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Confirm Complete Deletion
                  </h3>
                </div>
                <p className="text-muted-foreground mb-6">
                  You're about to permanently delete your data from{" "}
                  {activeCount} services. This will:
                </p>
                <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-1">•</span>
                    <span>
                      Physically remove all encrypted data from storage
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-1">•</span>
                    <span>Generate zero-knowledge deletion proofs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-1">•</span>
                    <span>Record immutable proofs on Midnight blockchain</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-1">•</span>
                    <span>Cannot be reversed or undone</span>
                  </li>
                </ul>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    Delete Everything
                  </button>
                </div>
              </>
            )}

            {deleteStep === "deleting" && (
              <>
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Deleting your data...
                </h3>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${deletionProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    {deletionProgress}% complete
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full ${deletionProgress >= 33 ? "bg-primary" : "bg-primary/30 animate-pulse"}`}
                    />
                    <span
                      className={`text-sm ${deletionProgress >= 33 ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      Deleting from databases
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full ${deletionProgress >= 66 ? "bg-primary" : "bg-primary/30"}`}
                    />
                    <span
                      className={`text-sm ${deletionProgress >= 66 ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      Generating ZK proofs
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full ${deletionProgress >= 100 ? "bg-primary" : "bg-primary/30"}`}
                    />
                    <span
                      className={`text-sm ${deletionProgress >= 100 ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      Recording on blockchain
                    </span>
                  </div>
                </div>
              </>
            )}

            {deleteStep === "success" && deletionResult && (
              <>
                <div className="text-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3">
                    <Check className="text-accent" size={32} />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Deletion Complete!
                  </h3>
                </div>
                <p className="text-muted-foreground text-center mb-6">
                  Successfully deleted data from {deletionResult.deletedCount}{" "}
                  services with cryptographic proof recorded on the Midnight
                  blockchain.
                </p>

                <div className="space-y-3 mb-6">
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                    <div className="text-xs text-muted-foreground mb-1">
                      Blockchain Proofs
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      {deletionResult.blockchainProofs.length} proofs generated
                    </div>
                  </div>

                  {deletionResult.blockchainProofs
                    .slice(0, 2)
                    .map((proof, idx) => (
                      <a
                        key={idx}
                        href={`https://explorer.preprod.midnight.network/proof/${proof}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border hover:border-primary transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Shield size={16} className="text-primary" />
                          <span className="text-sm font-mono text-foreground">
                            {proof.slice(0, 16)}...
                          </span>
                        </div>
                        <ExternalLink
                          size={14}
                          className="text-muted-foreground"
                        />
                      </a>
                    ))}
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={downloadCertificate}
                    className="w-full px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Download size={16} />
                    Download Certificate
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
