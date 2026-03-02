"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import {
  Copy,
  Check,
  Trash2,
  Shield,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { apiClient, DataLocation } from "@/lib/api-client";
import { useWallet } from "@/contexts/WalletContext";
import { WalletAuthGate } from "@/components/blockchain/WalletAuthGate";

export default function RealDashboard() {
  const { isConnected } = useWallet();
  const [userDID, setUserDID] = useState("");
  const [dataLocations, setDataLocations] = useState<DataLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "deleted">("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Require wallet connection
  if (!isConnected) {
    return <WalletAuthGate />;
  }

  const loadUserData = async () => {
    if (!userDID) {
      setError("Please enter a valid DID");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const locations = await apiClient.getUserFootprint(userDID);
      setDataLocations(locations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
      console.error("Error loading user data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!userDID) return;

    setIsDeleting(true);
    try {
      const result = await apiClient.deleteAllUserData(userDID);
      console.log("Deletion result:", result);

      // Reload data to show updated status
      await loadUserData();
      setShowDeleteModal(false);
      alert(
        `Successfully deleted ${result.deletedCount} records with blockchain proofs`,
      );
    } catch (err) {
      console.error("Error deleting data:", err);
      alert(
        "Failed to delete data: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const copyDID = () => {
    if (userDID) {
      navigator.clipboard.writeText(userDID);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const filteredLocations = dataLocations.filter((loc) => {
    if (filter === "all") return true;
    if (filter === "active") return !loc.deleted;
    if (filter === "deleted") return loc.deleted;
    return true;
  });

  const stats = {
    total: dataLocations.length,
    active: dataLocations.filter((l) => !l.deleted).length,
    deleted: dataLocations.filter((l) => l.deleted).length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Header */}
      <section className="border-b border-border bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <h1 className="text-3xl font-semibold text-foreground mb-6">
            Real Data Dashboard
          </h1>

          {/* DID Input */}
          <div className="max-w-2xl">
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={userDID}
                onChange={(e) => setUserDID(e.target.value)}
                placeholder="Enter your DID (e.g., did:midnight:...)"
                className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground"
              />
              <button
                onClick={loadUserData}
                disabled={loading || !userDID}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load Data"
                )}
              </button>
            </div>

            {userDID && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>Current DID: {userDID}</span>
                <button
                  onClick={copyDID}
                  className="p-1 hover:bg-secondary rounded transition-colors"
                >
                  {copied ? (
                    <Check size={14} className="text-accent" />
                  ) : (
                    <Copy size={14} className="text-muted-foreground" />
                  )}
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
                {error}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      {dataLocations.length > 0 && (
        <section className="border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Records", value: stats.total },
                { label: "Active Records", value: stats.active },
                { label: "Deleted Records", value: stats.deleted },
                { label: "Compliance", value: stats.deleted > 0 ? "✓" : "-" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg bg-secondary/50 border border-border"
                >
                  <div className="text-2xl md:text-3xl font-bold text-primary mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Delete All Section */}
        {stats.active > 0 && (
          <div className="mb-12 p-6 rounded-lg bg-destructive/10 border border-destructive/30">
            <div className="flex items-start gap-4">
              <AlertCircle
                className="text-destructive shrink-0 mt-1"
                size={24}
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Delete All My Data - Right to Be Forgotten
                </h3>
                <p className="text-muted-foreground mb-4">
                  This will delete your data from all {stats.active} active
                  locations with cryptographic proof on Midnight blockchain.
                  Cannot be undone.
                </p>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-6 py-2 bg-destructive text-white rounded-full font-semibold hover:opacity-90 transition-opacity"
                >
                  Delete All Data Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Data Locations */}
        {dataLocations.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-foreground">
                Your Data Locations
              </h2>
              <div className="flex gap-2">
                {(["all", "active", "deleted"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      filter === f
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f === "all"
                      ? `All (${stats.total})`
                      : `${f === "active" ? "Active" : "Deleted"} (${f === "active" ? stats.active : stats.deleted})`}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLocations.map((location) => (
                <div
                  key={location.commitmentHash}
                  className={`p-6 rounded-lg border transition-colors ${
                    location.deleted
                      ? "bg-secondary/30 border-border opacity-75"
                      : "bg-secondary/50 border-border hover:border-primary"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {location.deleted ? "🗑️" : "📦"}
                      </span>
                      <h3 className="font-semibold text-foreground">
                        {location.serviceProvider}
                      </h3>
                    </div>
                    {location.deleted ? (
                      <div className="flex items-center gap-1 text-xs text-accent">
                        <Shield size={14} />
                        <span>Deleted</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="w-2 h-2 bg-accent rounded-full"></span>
                        <span>Active</span>
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-muted-foreground mb-3">
                    {location.dataCategories?.join(", ") || "No categories"}
                  </div>

                  <div className="text-xs text-muted-foreground mb-3">
                    Created: {new Date(location.createdAt).toLocaleDateString()}
                  </div>

                  {location.deleted && location.deletionProofHash && (
                    <div className="mt-3 p-2 rounded bg-background/50 border border-border">
                      <div className="text-xs text-muted-foreground mb-1">
                        Deletion Proof:
                      </div>
                      <div className="text-xs font-mono text-foreground break-all">
                        {location.deletionProofHash.substring(0, 32)}...
                      </div>
                    </div>
                  )}

                  {!location.deleted && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="text-xs text-muted-foreground">
                        Commitment: {location.commitmentHash.substring(0, 16)}
                        ...
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && dataLocations.length === 0 && userDID && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              No data locations found for this DID
            </div>
            <p className="text-sm text-muted-foreground">
              Try registering some data first or check your DID is correct
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg border border-border p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Confirm Deletion
            </h3>
            <p className="text-muted-foreground mb-6">
              This will permanently delete your data from {stats.active}{" "}
              locations and generate ZK proofs on the Midnight blockchain. This
              action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-destructive text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete All"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
