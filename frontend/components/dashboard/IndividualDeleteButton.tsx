"use client";

import { useState } from "react";
import { Trash2, Check, AlertCircle, Shield, ExternalLink } from "lucide-react";

interface IndividualDeleteButtonProps {
  commitmentHash: string;
  serviceProvider: string;
  onDelete: (commitmentHash: string) => Promise<void>;
}

export function IndividualDeleteButton({
  commitmentHash,
  serviceProvider,
  onDelete,
}: IndividualDeleteButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteStep, setDeleteStep] = useState<
    "confirm" | "deleting" | "success"
  >("confirm");
  const [proofHash, setProofHash] = useState<string | null>(null);

  const handleDeleteClick = () => {
    setShowModal(true);
    setDeleteStep("confirm");
  };

  const confirmDelete = async () => {
    setDeleteStep("deleting");
    setIsDeleting(true);

    try {
      await onDelete(commitmentHash);
      // Simulate proof generation
      setProofHash(`proof_${Math.random().toString(36).substr(2, 16)}`);
      setDeleteStep("success");
    } catch (error) {
      console.error("Deletion failed:", error);
      setShowModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={handleDeleteClick}
        className="p-2 hover:bg-destructive/20 rounded transition-colors text-destructive"
        aria-label={`Delete data from ${serviceProvider}`}
      >
        <Trash2 size={18} />
      </button>

      {/* Delete Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-md w-full p-6 border border-border">
            {deleteStep === "confirm" && (
              <>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Confirm Deletion
                </h3>
                <p className="text-muted-foreground mb-6">
                  You're about to delete your data from{" "}
                  <strong>{serviceProvider}</strong>. This action is permanent
                  and will generate a cryptographic proof on the blockchain.
                </p>
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
                    Delete
                  </button>
                </div>
              </>
            )}

            {deleteStep === "deleting" && (
              <>
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Deleting your data...
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-primary animate-pulse" />
                    <span className="text-muted-foreground">
                      Deleting from database
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-primary/50" />
                    <span className="text-muted-foreground opacity-50">
                      Generating ZK proof
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-primary/50" />
                    <span className="text-muted-foreground opacity-50">
                      Recording on blockchain
                    </span>
                  </div>
                </div>
              </>
            )}

            {deleteStep === "success" && (
              <>
                <div className="text-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3">
                    <Check className="text-accent" size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Deletion Complete
                  </h3>
                </div>
                <p className="text-muted-foreground text-center mb-4">
                  Your data has been successfully deleted from {serviceProvider}{" "}
                  with cryptographic proof recorded on the blockchain.
                </p>
                {proofHash && (
                  <a
                    href={`https://explorer.preprod.midnight.network/proof/${proofHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors mb-3"
                  >
                    <Shield size={16} />
                    View Blockchain Proof
                    <ExternalLink size={14} />
                  </a>
                )}
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary transition-colors"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
