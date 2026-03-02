"use client";

import { useEffect, useState } from "react";
import { useDashboard } from "@/contexts/DashboardContext";
import {
  Copy,
  Check,
  Shield,
  AlertCircle,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { DataLocationCard } from "@/components/dashboard/DataLocationCard";
import { DataVisualization } from "@/components/dashboard/DataVisualization";
import { DeleteAllButton } from "@/components/dashboard/DeleteAllButton";
import { TransactionMonitor } from "@/components/blockchain/TransactionMonitor";
import { useWallet } from "@/contexts/WalletContext";
import { WalletAuthGate } from "@/components/blockchain/WalletAuthGate";

export default function UserDashboardPage() {
  const { isConnected } = useWallet();
  const { userDID, setUserDID, dataLocations, loading, error, refreshData } =
    useDashboard();
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "deleted">("all");

  // Require wallet connection
  if (!isConnected) {
    return <WalletAuthGate />;
  }

  // Set demo user DID on mount
  useEffect(() => {
    if (!userDID) {
      setUserDID("did:midnight:demo_user_123");
    }
  }, [userDID, setUserDID]);

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
    active: dataLocations.filter((loc) => !loc.deleted).length,
    deleted: dataLocations.filter((loc) => !loc.deleted).length,
    categories: new Set(
      dataLocations.flatMap(
        (loc) => loc.dataCategories || (loc.dataType ? [loc.dataType] : []),
      ),
    ).size,
  };

  if (loading && dataLocations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw
            className="animate-spin text-primary mx-auto mb-4"
            size={32}
          />
          <p className="text-muted-foreground">
            Loading your data footprint...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <section className="border-b border-border bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-foreground mb-2">
                Your Data Dashboard
              </h1>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  DID: {userDID || "Not set"}
                </span>
                <button
                  onClick={copyDID}
                  className="p-1 hover:bg-secondary rounded transition-colors"
                  aria-label="Copy DID"
                >
                  {copied ? (
                    <Check size={16} className="text-accent" />
                  ) : (
                    <Copy size={16} className="text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
            <button
              onClick={refreshData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>
        </div>
      </section>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-3">
            <AlertCircle
              className="text-destructive shrink-0 mt-0.5"
              size={20}
            />
            <div>
              <p className="text-sm font-medium text-foreground">
                Error loading data
              </p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <section className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={16} className="text-primary" />
                <div className="text-2xl md:text-3xl font-bold text-primary">
                  {stats.active}
                </div>
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">
                Services holding data
              </div>
            </div>

            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                {stats.categories}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">
                Data categories
              </div>
            </div>

            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <Shield size={16} className="text-accent" />
                <div className="text-2xl md:text-3xl font-bold text-accent">
                  {stats.deleted}
                </div>
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">
                Successful deletions
              </div>
            </div>

            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="text-2xl md:text-3xl font-bold text-primary mb-1">
                {stats.active > 0 ? "100%" : "N/A"}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">
                Compliance status
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Transaction Monitor */}
        <div className="mb-12">
          <TransactionMonitor />
        </div>

        {/* Delete All Section */}
        <DeleteAllButton />

        {/* Data Visualization */}
        {dataLocations.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-6">
              Data Distribution
            </h2>
            <DataVisualization dataLocations={dataLocations} />
          </div>
        )}

        {/* Data Locations */}
        <div>
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
                    : f === "active"
                      ? `Active (${stats.active})`
                      : `Deleted (${stats.deleted})`}
                </button>
              ))}
            </div>
          </div>

          {filteredLocations.length === 0 ? (
            <div className="text-center py-12">
              <Shield
                className="text-muted-foreground mx-auto mb-4"
                size={48}
              />
              <p className="text-muted-foreground">
                {filter === "all"
                  ? "No data locations found"
                  : `No ${filter} data locations`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLocations.map((location) => (
                <DataLocationCard
                  key={location.commitmentHash}
                  location={location}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
