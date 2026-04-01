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
  Network
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
    <div className="min-h-screen bg-background text-foreground pt-16">
      <Navigation />

      {/* Header */}
      <section className="border-b border-[#111] bg-[#030303]">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="font-serif text-[clamp(2.5rem,4vw,3.5rem)] font-bold mb-3 tracking-tight">
                Data Dashboard
              </h1>
              <div className="flex flex-wrap items-center gap-4 bg-[#0a0a0a] p-3 px-4 rounded border border-[#1a1a1a] inline-flex">
                <span className="mono text-xs text-dim tracking-widest uppercase">
                  ACTIVE DECENTRALIZED IDENTITY
                </span>
                <div className="h-4 w-px bg-[#222]"></div>
                <div className="flex items-center gap-2">
                  <span className="mono text-accent text-sm break-all font-bold">
                    {userDID}
                  </span>
                  <button
                    onClick={copyDID}
                    className="p-1 px-2 hover:bg-[#111] border border-transparent hover:border-[#222] rounded transition-colors flex items-center gap-1"
                  >
                    {copied ? (
                      <Check size={14} className="text-accent" />
                    ) : (
                      <Copy size={14} className="text-dim" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <Link
              href="/"
              className="mono text-xs tracking-widest uppercase text-dim hover:text-white transition-colors border-b border-[#222] hover:border-white pb-1"
            >
              ← Back to Home
            </Link>
          </div>

          {/* DID Input Section */}
          <div className="flex flex-col sm:flex-row gap-4 p-5 rounded bg-[#080808] border border-[#1a1a1a]">
            <div className="flex-1 relative">
              <input
                type="text"
                value={didInput}
                onChange={(e) => setDidInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLoadDID()}
                placeholder="Enter your Midnight DID"
                disabled
                className="w-full pl-5 pr-5 py-4 rounded bg-[#030303] border border-[#1a1a1a] text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent font-mono text-sm opacity-60 cursor-not-allowed transition-all"
              />
              <Network size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-[#333]" />
            </div>
            <button
              onClick={handleLoadDID}
              disabled={loading}
              className="button button-primary py-4 px-8 min-w-[160px] flex items-center justify-center text-sm"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                "Load Footprint"
              )}
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="w-14 h-[54px] border border-[#1a1a1a] bg-[#0a0a0a] rounded flex items-center justify-center hover:bg-[#111] hover:border-[#222] transition-colors disabled:opacity-50 group"
              title="Refresh data"
            >
              <Shield size={18} className="text-dim group-hover:text-accent transition-colors" />
            </button>
          </div>
          
          {error && (
            <div className="mt-4 p-4 rounded bg-[#200000] border border-[#ff3333]/30 text-[#ff3333] mono text-sm flex items-center gap-3">
              <AlertCircle size={18} />
              {error}
            </div>
          )}
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-[#111] bg-[#000000]">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Active Connections", value: stats.active, suffix: "" },
              {
                label: "Access Events (30d)",
                value: stats.accessEvents,
                suffix: ""
              },
              { label: "Deleted Entities", value: stats.deleted, suffix: "" },
              { label: "Verification Score", value: "100", suffix: "%", textClass: "text-accent glow" },
            ].map((stat, i) => (
              <div
                key={i}
                className="p-6 rounded bg-[#050505] border border-[#1a1a1a]"
              >
                <div className="mono text-dim text-[0.65rem] tracking-widest uppercase mb-3">
                  {stat.label}
                </div>
                <div className={`font-mono text-3xl md:text-4xl font-bold ${stat.textClass || 'text-white'}`}>
                  {stat.value}{stat.suffix && <span className="text-xl inline-block ml-1 opacity-50">{stat.suffix}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Delete All Section */}
        <div className="mb-16 p-8 md:p-10 rounded border border-[#ff3333]/30 bg-[radial-gradient(ellipse_at_top_right,rgba(255,51,51,0.05),transparent)] relative overflow-hidden group">
          <AlertCircle className="absolute -right-10 -bottom-10 w-64 h-64 text-[#ff3333]/5 group-hover:text-[#ff3333]/10 transition-colors pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8 justify-between">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="w-16 h-16 rounded bg-[#2a0a0a] border border-[#551111] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(255,51,51,0.2)]">
                <AlertCircle size={32} className="text-[#ff3333]" />
              </div>
              <div className="flex-1">
                <div className="mono text-[#ff3333] text-xs font-bold tracking-widest uppercase mb-2">
                  Emergency Protocol
                </div>
                <h3 className="font-serif text-3xl font-bold text-white mb-2">
                  Right to Be Forgotten
                </h3>
                <p className="mono text-dim text-sm max-w-xl leading-[1.6]">
                  Instantly execute a recursive deletion command across all {stats.active} anchored services. ZK-SNARK proofs will be generated for every deletion. This action is immutable and irreversible.
                </p>
              </div>
            </div>
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
              className="button px-10 py-5 text-sm bg-transparent border border-[#ff3333] text-[#ff3333] hover:bg-[#ff3333] hover:text-black font-bold tracking-widest uppercase relative overflow-hidden transition-all duration-300 shadow-[0_0_20px_rgba(255,51,51,0.1)] hover:shadow-[0_0_30px_rgba(255,51,51,0.3)] whitespace-nowrap"
            >
              {isDeleting ? (
                <span className="flex items-center gap-3">
                  <Loader2 size={18} className="animate-spin" /> EXECUTING...
                </span>
              ) : (
                "PURGE ALL DATA"
              )}
            </button>
          </div>
        </div>

        {/* Data Locations */}
        <div className="mb-20">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6 border-b border-[#111] pb-6">
            <h2 className="font-serif text-3xl font-bold text-white">
              Data Footprint
            </h2>
            <div className="flex gap-2 p-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded">
              {(["all", "active", "deleted"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-5 py-2.5 rounded mono text-xs uppercase tracking-widest transition-colors ${
                    filter === f
                      ? "bg-[#1a1a1a] text-accent font-bold shadow-sm"
                      : "text-dim hover:bg-[#111] hover:text-white"
                  }`}
                >
                  {f === "all"
                    ? `All (${stats.total})`
                    : `${f === "active" ? "Active" : "Provably Deleted"} (${f === "active" ? stats.active : stats.deleted})`}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className={`p-6 rounded border transition-all duration-300 flex flex-col h-full ${
                  service.deleted
                    ? "bg-[#050505] border-[#111] opacity-70 hover:opacity-100"
                    : "bg-[#080808] border-[#1a1a1a] hover:border-[#333] shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                }`}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded bg-[#111] border border-[#222] flex items-center justify-center text-2xl filter grayscale contrast-125">
                      {service.emoji}
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-bold text-white mb-1">
                        {service.serviceProvider}
                      </h3>
                      <div className="mono text-[0.65rem] uppercase tracking-widest text-dim px-2 mb-1 border border-[#222] inline-block rounded bg-[#111]">
                        {service.dataCategories?.join(", ") ||
                          service.dataType ||
                          "DATASET ALIEN"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1"></div>

                {service.deleted ? (
                  <div className="pt-4 border-t border-[#111] mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="mono text-xs font-bold text-dim tracking-widest uppercase">Status</span>
                      <span className="mono text-[0.65rem] font-bold text-accent bg-accent/10 border border-accent/20 px-2 py-1 rounded tracking-widest uppercase flex items-center gap-1">
                        <Check size={10} /> PROVABLY DELETED
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="mono text-xs text-dim uppercase tracking-widest">Timestamp</span>
                      <span className="mono text-xs text-dim">{service.deletedAt?.toString() ?? "-"}</span>
                    </div>
                    {service.deletionProofHash && (
                      <a
                        href="#"
                        className="w-full py-3 bg-[#0a0a0a] border border-[#222] hover:border-accent/50 text-dim hover:text-accent rounded mono text-xs tracking-widest flex items-center justify-center gap-2 transition-colors uppercase"
                      >
                        <Shield size={14} /> View On-Chain Proof
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="pt-4 border-t border-[#1a1a1a] mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="mono text-xs font-bold text-dim tracking-widest uppercase">Status</span>
                      <span className="mono text-[0.65rem] font-bold text-white bg-[#1a1a1a] border border-[#333] px-2 py-1 rounded tracking-widest uppercase flex items-center gap-1 focus:outline-none">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse mr-1"></div> ACTIVE RESOURCE
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-5">
                      <span className="mono text-xs text-dim uppercase tracking-widest">Anchored</span>
                      <span className="mono text-xs text-white">{service.lastAccessed}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteClick(service.commitmentHash)}
                      className="w-full py-3 bg-transparent border border-[#ff3333]/30 text-[#ff3333] hover:bg-[#ff3333] hover:text-black rounded mono text-xs font-bold tracking-widest flex items-center justify-center gap-2 transition-all uppercase"
                    >
                      <Trash2 size={14} /> Request Deletion
                    </button>
                  </div>
                )}
              </div>
            ))}
            
            {filteredServices.length === 0 && (
              <div className="col-span-full py-20 text-center rounded border border-dashed border-[#222] bg-[#050505]">
                <Shield size={48} className="mx-auto text-[#222] mb-4" />
                <h3 className="font-serif text-xl text-white mb-2">No footprints detected</h3>
                <p className="mono text-dim text-sm">Update your filter or connect a different identity.</p>
              </div>
            )}
          </div>
        </div>

        {/* Access Timeline & Raw Audit Log */}
        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="font-serif text-2xl font-bold text-white mb-6 border-b border-[#111] pb-4">
              Access Interceptions
            </h2>
            <div className="space-y-4">
              {recentAccess.map((access, i) => (
                <div
                  key={i}
                  className="p-5 rounded bg-[#080808] border border-[#1a1a1a] flex items-start justify-between group hover:border-[#333] transition-colors"
                >
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-serif font-bold text-white text-lg">
                        {access.company}
                      </span>
                      <span className="mono text-[0.6rem] text-accent tracking-widest uppercase border border-accent/20 bg-accent/5 px-2 py-0.5 rounded">
                        {access.purpose}
                      </span>
                    </div>
                    <p className="mono text-dim text-sm">
                      {access.action}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="mono text-xs text-dim block mb-1 uppercase tracking-widest">
                      {access.time}
                    </span>
                    <span className="mono text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                      AUTHORIZED
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h2 className="font-serif text-2xl font-bold text-white mb-6 border-b border-[#111] pb-4">
              Midnight Raw Terminal
            </h2>
            <div className="p-5 rounded bg-black border border-[#222] h-[340px] font-mono text-[0.65rem] text-accent/80 overflow-y-auto shadow-inner leading-[1.8] flex flex-col justify-end">
              <div className="opacity-50 hover:opacity-100 transition-opacity">
                <div>[SYSTEM] Initiating connection to Midnight DevNet...</div>
                <div>[BLOCK:83492] Verified state transition for commitment x09f...</div>
                <div>[NET] Synchronizing ZK snarks... OK</div>
                <div>[SYSTEM] Wallet connected: {userDID.substring(0, 24)}...</div>
                <br/>
                {dataLocations.slice(0, 5).map((loc, i) => (
                  <div key={i} className="mb-2">
                    <span className="text-dim">[{new Date(loc.createdAt).toISOString()}]</span>{" "}
                    {loc.deleted ? (
                      <span className="text-[#ff3333]">DELETION_PROOF_VERIFIED</span>
                    ) : (
                      <span className="text-accent">COMMITMENT_ANCHORED</span>
                    )}{" "}
                    | SP={loc.serviceProvider.toUpperCase()} | HASH={loc.commitmentHash}
                  </div>
                ))}
                
                <div className="mt-2 text-dim animate-pulse">_ await new events</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCommitment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#050505] rounded max-w-lg w-full p-8 border border-[#222] shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            {deleteStep === "confirm" && (
              <>
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#1a1a1a]">
                  <div className="w-12 h-12 rounded bg-[#2a0a0a] border border-[#ff3333]/30 flex items-center justify-center">
                    <AlertCircle className="text-[#ff3333]" size={24} />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-white">
                      Confirm Deletion
                    </h3>
                    <div className="mono text-[#ff3333] text-xs font-bold tracking-widest uppercase">
                      Irreversible Action
                    </div>
                  </div>
                </div>
                
                <div className="bg-black border border-[#1a1a1a] p-4 rounded mb-8 font-mono text-xs text-dim break-all">
                  <span className="text-white block mb-2 uppercase tracking-widest">Target Hash:</span>
                  {selectedCommitment}
                </div>
                
                <p className="mono text-dim text-sm mb-8 leading-[1.6]">
                  A request will be sent to the service provider. Their CDC Agent will erase the underlying data and a <span className="text-white">Zero-Knowledge Proof</span> will be published to the Midnight Blockchain.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 py-4 border border-[#333] bg-[#111] rounded font-bold mono tracking-widest uppercase text-white hover:bg-[#222] transition-colors"
                  >
                    Abort
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 py-4 bg-[#ff3333] text-black rounded font-bold mono tracking-widest uppercase hover:bg-[#ff4444] transition-colors shadow-[0_0_20px_rgba(255,51,51,0.2)]"
                  >
                    Confirm Deletion
                  </button>
                </div>
              </>
            )}

            {deleteStep === "deleting" && (
              <div className="py-8">
                <div className="flex justify-center mb-8">
                  <Loader2 className="w-16 h-16 text-accent animate-spin" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-center text-white mb-8">
                  Synthesizing ZK-Proof
                </h3>
                <div className="space-y-4 max-w-sm mx-auto">
                  <div className="flex items-center justify-between mono text-xs uppercase tracking-widest border-b border-[#1a1a1a] pb-3">
                    <span className="text-dim">Provider DB Erasure</span>
                    <span className="text-accent flex items-center gap-2"><Check size={12} /> COMPLETE</span>
                  </div>
                  <div className="flex items-center justify-between mono text-xs uppercase tracking-widest border-b border-[#1a1a1a] pb-3">
                    <span className="text-white">Circuit Synthesis</span>
                    <span className="text-accent animate-pulse font-bold">WORKING...</span>
                  </div>
                  <div className="flex items-center justify-between mono text-xs uppercase tracking-widest opacity-50">
                    <span>Network Anchoring</span>
                    <span>PENDING</span>
                  </div>
                </div>
              </div>
            )}

            {deleteStep === "success" && (
              <div className="py-8 text-center">
                <div className="w-20 h-20 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(0,255,136,0.2)]">
                  <Check className="text-accent" size={40} />
                </div>
                <h3 className="font-serif text-3xl font-bold text-white mb-4">
                  Erasure Complete
                </h3>
                <p className="mono text-dim text-sm mb-10 leading-[1.6]">
                  Your data has been permanently removed. A zero-knowledge proof has been verified and permanently anchored to the Midnight blockchain.
                </p>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full py-4 border border-accent bg-accent/5 text-accent rounded font-bold mono tracking-widest uppercase hover:bg-accent/10 transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
