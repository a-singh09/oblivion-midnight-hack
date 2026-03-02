"use client";

import { useEffect, useState } from "react";
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

interface ServiceView extends Omit<DataLocation, "deletedAt"> {
  id: string;
  emoji?: string;
  lastAccessed?: string;
  deletedAt?: string | number | Date;
}

export default function Dashboard() {
  const { isConnected } = useWallet();
  const [userDID, setUserDID] = useState<string>(() => {
    // Try to load from localStorage first
    if (typeof window !== "undefined") {
      return localStorage.getItem("userDID") || "did:midnight:demo_user_123";
    }
    return "did:midnight:demo_user_123";
  });
  const [didInput, setDidInput] = useState<string>(userDID);
  const [dataLocations, setDataLocations] = useState<ServiceView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "deleted">("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCommitment, setSelectedCommitment] = useState<string | null>(
    null,
  );
  const [deleteStep, setDeleteStep] = useState<
    "confirm" | "deleting" | "success"
  >("confirm");
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Require wallet connection
  if (!isConnected) {
    return <WalletAuthGate />;
  }

  const loadData = async () => {
    if (!userDID) return;
    setLoading(true);
    setError(null);

    try {
      const locations = await apiClient.getUserFootprint(userDID);

      // Map to service view (add small synthetic fields for richer UI)
      const services: ServiceView[] = locations.map((loc, idx) => ({
        ...loc,
        id: loc.commitmentHash,
        emoji: idx % 2 === 0 ? "📦" : "🗄️",
        lastAccessed: new Date(loc.createdAt).toLocaleDateString(),
        deletedAt: loc.deletedAt
          ? typeof loc.deletedAt === "number"
            ? loc.deletedAt
            : new Date(loc.deletedAt).getTime()
          : undefined,
      }));

      setDataLocations(services);

      // Save to localStorage for future visits
      if (typeof window !== "undefined") {
        localStorage.setItem("userDID", userDID);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDID = () => {
    if (didInput && didInput.startsWith("did:midnight:")) {
      setUserDID(didInput);
    } else {
      setError('Please enter a valid DID starting with "did:midnight:"');
    }
  };

  useEffect(() => {
    if (userDID) {
      loadData();
    }
  }, [userDID]);

  const stats = {
    total: dataLocations.length,
    active: dataLocations.filter((s) => !s.deleted).length,
    deleted: dataLocations.filter((s) => s.deleted).length,
    accessEvents: 47,
  };

  const filteredServices = dataLocations.filter((s) => {
    if (filter === "all") return true;
    if (filter === "active") return !s.deleted;
    if (filter === "deleted") return s.deleted;
    return true;
  });

  const handleDeleteClick = (commitmentHash: string) => {
    setSelectedCommitment(commitmentHash);
    setShowDeleteModal(true);
    setDeleteStep("confirm");
  };

  const confirmDelete = async () => {
    if (!selectedCommitment || !userDID) return;

    setDeleteStep("deleting");
    setIsDeleting(true);

    try {
      const res = await apiClient.deleteCommitment(userDID, selectedCommitment);

      // Simple UX flow
      setTimeout(() => {
        setDeleteStep("success");
        setIsDeleting(false);
        // Refresh data
        loadData();
      }, 800);
    } catch (err) {
      setIsDeleting(false);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const copyDID = () => {
    if (userDID) {
      navigator.clipboard.writeText(userDID);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const recentAccess = [
    {
      company: "EuroBank",
      action: "Accessed KYC documents",
      purpose: "Verification",
      time: "2 hours ago",
    },
    {
      company: "MusicStream",
      action: "Logged in",
      purpose: "Authentication",
      time: "1 hour ago",
    },
    {
      company: "FoodDelivery",
      action: "Retrieved order history",
      purpose: "Customer Service",
      time: "2 hours ago",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Header */}
      <section className="border-b border-border bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-semibold text-foreground mb-2">
                Your Data Dashboard
              </h1>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  DID: {userDID}
                </span>
                <button
                  onClick={copyDID}
                  className="p-1 hover:bg-secondary rounded transition-colors"
                >
                  {copied ? (
                    <Check size={16} className="text-accent" />
                  ) : (
                    <Copy size={16} className="text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
            <Link
              href="/"
              className="text-primary hover:text-primary/80 transition-colors font-medium"
            >
              ← Back to Home
            </Link>
          </div>

          {/* DID Input Section */}
          <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-lg bg-background border border-border">
            <div className="flex-1">
              <input
                type="text"
                value={didInput}
                onChange={(e) => setDidInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLoadDID()}
                placeholder="Enter your Midnight DID (e.g., did:midnight:your_id_123)"
                disabled
                className="w-full px-4 py-2 rounded-lg bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-not-allowed opacity-75"
              />
            </div>
            <button
              onClick={handleLoadDID}
              disabled={loading}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                "Load My Data"
              )}
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <Shield size={16} />
            </button>
          </div>

          {/* Helper Text */}
          {/* <p className="text-xs text-muted-foreground mt-2 px-4">
            💡 Demo DID hardcoded for hackathon:{" "}
            <span className="font-mono text-primary">
              did:midnight:demo_user_123
            </span>{" "}
            {userDID === "did:midnight:demo_user_123" ? "✅" : "❌"}
          </p> */}
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Services holding data", value: stats.active },
              {
                label: "Data access events (30 days)",
                value: stats.accessEvents,
              },
              { label: "Successful deletions", value: stats.deleted },
              { label: "Compliance status", value: "100%" },
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Delete All Section */}
        <div className="mb-12 p-6 rounded-lg bg-destructive/10 border border-destructive/30">
          <div className="flex items-start gap-4">
            <AlertCircle className="text-destructive shrink-0 mt-1" size={24} />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Delete All My Data - Right to Be Forgotten
              </h3>
              <p className="text-muted-foreground mb-4">
                This will delete your data from all {stats.active} services.
                You'll receive cryptographic proof. Cannot be undone.
              </p>
              <button
                onClick={async () => {
                  if (!userDID) return;
                  setIsDeleting(true);
                  try {
                    await apiClient.deleteAllUserData(userDID);
                    await loadData();
                    alert(
                      "Deletion started — proofs will be generated on the backend.",
                    );
                  } catch (err) {
                    alert(err instanceof Error ? err.message : String(err));
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                className="px-6 py-2 bg-destructive text-white rounded-full font-semibold hover:opacity-90 transition-opacity"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Deleting...
                  </>
                ) : (
                  "Delete All Data Now"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Data Locations */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-foreground">
              Where Your Data Lives
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
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className={`p-6 rounded-lg border transition-colors ${
                  service.deleted
                    ? "bg-secondary/30 border-border opacity-60"
                    : "bg-secondary/50 border-border hover:border-primary"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{service.emoji}</span>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {service.serviceProvider}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {service.dataCategories?.join(", ") ||
                          service.dataType ||
                          "Unknown"}
                      </p>
                    </div>
                  </div>
                  {service.deleted ? (
                    <span className="text-xs font-semibold text-accent bg-accent/20 px-3 py-1 rounded-full">
                      DELETED
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-primary bg-primary/20 px-3 py-1 rounded-full">
                      ACTIVE
                    </span>
                  )}
                </div>

                {service.deleted ? (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Deleted on {service.deletedAt?.toString() ?? "-"}
                    </p>
                    {service.deletionProofHash && (
                      <a
                        href="#"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <Shield size={14} /> View blockchain proof
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Created {service.lastAccessed}
                    </span>
                    <button
                      onClick={() => handleDeleteClick(service.commitmentHash)}
                      className="p-2 hover:bg-destructive/20 rounded transition-colors text-destructive"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Access Timeline */}
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Recent Access History
          </h2>
          <div className="space-y-3">
            {recentAccess.map((access, i) => (
              <div
                key={i}
                className="p-4 rounded-lg bg-secondary/30 border border-border flex items-start justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">
                      {access.company}
                    </span>
                    <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                      {access.purpose}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {access.action}
                  </p>
                </div>
                <span className="text-sm text-muted-foreground shrink-0">
                  {access.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCommitment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-md w-full p-6 border border-border">
            {deleteStep === "confirm" && (
              <>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Confirm Deletion
                </h3>
                <p className="text-muted-foreground mb-6">
                  You're about to delete this commitment. This is permanent.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-4 py-2 border border-border rounded-lg font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-2 bg-destructive text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
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
                  Your data has been successfully deleted with cryptographic
                  proof recorded on the blockchain.
                </p>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full px-4 py-2 border border-border rounded-lg font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
