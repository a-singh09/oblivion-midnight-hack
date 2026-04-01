"use client";

import { useState } from "react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { StatusIndicator } from "@/components/dashboard/StatusIndicator";
import { Check, Loader2, Shield, Building2, CheckCircle } from "lucide-react";
import { apiClient } from "@/lib/api-client";

export default function CompanyRegistration() {
  const [formData, setFormData] = useState({
    userDID: "did:midnight:demo_user_123",
    serviceProvider: "",
    dataType: "",
    data: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");

  const dataTypeOptions = [
    "personal_info",
    "financial_data",
    "health_records",
    "location_data",
    "communication_data",
    "behavioral_data",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    setTxHash("");

    try {
      // Parse the data as JSON if it looks like JSON, otherwise send as string
      let parsedData;
      try {
        parsedData = JSON.parse(formData.data);
      } catch {
        parsedData = { value: formData.data };
      }

      const result = await apiClient.registerUserData({
        userDID: formData.userDID,
        data: parsedData,
        dataType: formData.dataType,
        serviceProvider: formData.serviceProvider,
      });

      setTxHash(result.blockchainTx);
      setSuccess(true);

      // Save DID to localStorage so dashboard can use it
      if (typeof window !== "undefined") {
        localStorage.setItem("userDID", formData.userDID);
        localStorage.setItem("lastCommitmentHash", result.commitmentHash);
      }

      // Reset form
      setTimeout(() => {
        setFormData({
          userDID: "did:midnight:demo_user_123",
          serviceProvider: "",
          dataType: "",
          data: "",
        });
        setSuccess(false);
        setTxHash("");
      }, 8000); // Increased to 8 seconds so user can read the message
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register data");
      console.error("Error registering data:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pt-16">
      <Navigation />

      <section className="section py-20 px-4 sm:px-6 lg:px-8">
        <div className="container max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent/5 rounded-xl border border-accent/10 flex items-center justify-center">
                <Building2 size={24} className="text-accent" />
              </div>
              <h1 className="font-serif text-[clamp(2rem,4vw,3.5rem)] font-bold tracking-tight m-0 leading-none">
                Company Registration
              </h1>
            </div>
            <StatusIndicator />
          </div>

          <p className="mono text-dim text-lg mb-12 max-w-2xl">
            Register user data with cryptographic commitments on the Midnight
            blockchain. This enables users to track and delete their data with
            ZK proofs.
          </p>

          {/* Info Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              {
                icon: <Shield size={24} className="text-accent" />,
                title: "Privacy First",
                desc: "Data encrypted, only commitments on-chain",
              },
              {
                icon: <CheckCircle size={24} className="text-accent" />,
                title: "GDPR Compliant",
                desc: "Automatic deletion proof generation",
              },
              {
                icon: <Building2 size={24} className="text-accent" />,
                title: "Easy Integration",
                desc: "Simple REST API for your systems",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-[#080808] border border-[#1a1a1a] p-6 rounded-lg transition-transform hover:-translate-y-1"
              >
                <div className="mb-4">
                  {item.icon}
                </div>
                <h3 className="font-serif text-xl font-bold mb-2">
                  {item.title}
                </h3>
                <p className="mono text-dim text-sm">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Registration Form */}
          <div className="bg-[#080808] border border-[#1a1a1a] p-8 md:p-10 rounded-lg mb-16 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-[#00d4aa]"></div>
            <h2 className="font-serif text-3xl font-bold mb-8">
              Register User Data
            </h2>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* User DID */}
              <div>
                <label className="block mono text-sm font-bold text-foreground mb-3 tracking-widest uppercase text-dim">
                  User DID <span className="text-[#ff3333]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.userDID}
                  onChange={(e) =>
                    setFormData({ ...formData, userDID: e.target.value })
                  }
                  placeholder="did:midnight:..."
                  required
                  disabled
                  className="w-full px-5 py-4 rounded bg-[#050505] border border-[#1a1a1a] text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent font-mono text-sm opacity-50 cursor-not-allowed transition-all"
                />
                <p className="mt-2 mono text-xs text-dim">
                  Demo user DID
                </p>
              </div>

              {/* Service Provider */}
              <div>
                <label className="block mono text-sm font-bold text-foreground mb-3 tracking-widest uppercase text-dim">
                  Service Provider <span className="text-[#ff3333]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.serviceProvider}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      serviceProvider: e.target.value,
                    })
                  }
                  placeholder="Your Company Name"
                  required
                  className="w-full px-5 py-4 rounded bg-[#0a0a0a] border border-[#1a1a1a] text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent font-mono text-sm transition-all"
                />
              </div>

              {/* Data Type */}
              <div>
                <label className="block mono text-sm font-bold text-foreground mb-3 tracking-widest uppercase text-dim">
                  Data Type <span className="text-[#ff3333]">*</span>
                </label>
                <select
                  value={formData.dataType}
                  onChange={(e) =>
                    setFormData({ ...formData, dataType: e.target.value })
                  }
                  required
                  className="w-full px-5 py-4 rounded bg-[#0a0a0a] border border-[#1a1a1a] text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent font-mono text-sm transition-all appearance-none"
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center' }}
                >
                  <option value="">Select data type...</option>
                  {dataTypeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type.replace(/_/g, " ").toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Data */}
              <div>
                <label className="block mono text-sm font-bold text-foreground mb-3 tracking-widest uppercase text-dim">
                  Data JSON <span className="text-[#ff3333]">*</span>
                </label>
                <textarea
                  value={formData.data}
                  onChange={(e) =>
                    setFormData({ ...formData, data: e.target.value })
                  }
                  placeholder="{\n  &quot;email&quot;: &quot;user@example.com&quot;,\n  &quot;name&quot;: &quot;John Doe&quot;\n}"
                  required
                  rows={4}
                  className="w-full px-5 py-4 rounded bg-[#0a0a0a] border border-[#1a1a1a] text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent font-mono text-sm transition-all resize-y"
                />
                <p className="mt-2 mono text-xs text-dim">
                  JSON object or plain text. Data will be encrypted before
                  storage.
                </p>
              </div>

              {/* Success Message */}
              {success && (
                <div className="p-6 rounded border border-accent/30 bg-[radial-gradient(ellipse_at_top_left,rgba(0,255,136,0.1),transparent)]">
                  <div className="flex items-center gap-3 text-accent mb-4">
                    <Check size={24} />
                    <span className="font-serif text-xl font-bold">
                      Data registered successfully!
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="p-5 rounded bg-[#0a0a0a] border border-[#1a1a1a]">
                      <div className="mono text-dim text-xs tracking-widest uppercase mb-2">
                        Your DID (Save this!):
                      </div>
                      <code className="text-sm text-accent break-all font-mono block mb-4 p-3 bg-black rounded border border-[#222]">
                        {formData.userDID}
                      </code>
                      <p className="mono text-xs text-dim">
                        💡 This DID has been saved. Go to{" "}
                        <a
                          href="/dashboard"
                          className="text-accent hover:underline border-b border-accent/30 hover:border-accent"
                        >
                          Dashboard
                        </a>{" "}
                        to see your data!
                      </p>
                    </div>

                    {txHash && (
                      <div className="mono text-dim text-sm flex flex-col gap-2">
                        <span className="tracking-widest uppercase text-xs">Transaction Hash:</span>
                        <code className="text-xs break-all text-white p-3 bg-[#0a0a0a] rounded border border-[#1a1a1a]">{txHash}</code>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-5 rounded bg-[#200000] border border-[#ff3333]/30 text-[#ff3333] mono text-sm flex items-center gap-3">
                  <Shield size={20} />
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="button button-primary w-full py-5 text-base mt-4"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin mr-3" />
                    Registering...
                  </>
                ) : (
                  <>
                    Register Data
                  </>
                )}
              </button>
            </form>
          </div>

          {/* API Documentation */}
          <div className="bg-[#080808] border border-[#1a1a1a] p-8 md:p-10 rounded-lg">
            <h2 className="font-serif text-3xl font-bold mb-4">
              API Integration
            </h2>
            <p className="mono text-dim text-sm mb-8 leading-[1.6]">
              Integrate Oblivion Protocol into your systems natively with our REST API:
            </p>

            <div className="space-y-6">
              {[
                {
                  method: "POST",
                  endpoint: "/api/register-data",
                  code: `{\n  "userDID": "did:midnight:...",\n  "data": { "email": "user@example.com" },\n  "dataType": "personal_info",\n  "serviceProvider": "YourCompany"\n}`
                },
                {
                  method: "GET",
                  endpoint: "/api/user/:did/footprint",
                  desc: "Returns all data locations for a user DID"
                },
                {
                  method: "POST",
                  endpoint: "/api/user/:did/delete-all",
                  desc: "Deletes all user data and generates ZK proofs"
                }
              ].map((api, idx) => (
                <div key={idx} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`mono text-xs font-bold px-2 py-1 rounded ${api.method === 'GET' ? 'bg-[#27c93f]/20 text-[#27c93f]' : 'bg-[#ffbd2e]/20 text-[#ffbd2e]'}`}>
                      {api.method}
                    </span>
                    <span className="mono text-sm text-foreground">{api.endpoint}</span>
                  </div>
                  {api.code && (
                    <pre className="text-xs text-dim overflow-x-auto bg-black p-4 rounded border border-[#222] mt-3">{api.code}</pre>
                  )}
                  {api.desc && (
                    <p className="mono text-xs text-dim mt-2">{api.desc}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
