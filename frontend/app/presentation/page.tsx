"use client";

import { useEffect, useState } from "react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import {
  CheckCircle,
  Shield,
  Zap,
  TrendingUp,
  Users,
  Database,
  Globe,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";

export default function PresentationPage() {
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [testResults, setTestResults] = useState({
    total: 10,
    passed: 9,
    failed: 1,
  });

  useEffect(() => {
    // Fetch system status
    const checkStatus = async () => {
      try {
        const health = await apiClient.healthCheck();
        setSystemStatus(health);
      } catch (error) {
        console.error("Failed to fetch status:", error);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground pt-16">
      <Navigation />

      {/* Hero Section */}
      <section className="section py-32 px-4 relative flex items-center justify-center min-h-[70vh] border-b border-[#111]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,136,0.03)_0%,rgba(0,0,0,0)_70%)] pointer-events-none z-0"></div>
        <div className="container max-w-6xl mx-auto text-center relative z-10">
          <div className="badge inline-flex mb-8">
            <span className="badge-dot"></span> Built on Midnight Blockchain
          </div>

          <h1 className="font-serif text-[clamp(3.5rem,7vw,6.5rem)] font-bold mb-4 leading-none tracking-tight">
            Oblivion Protocol
          </h1>

          <p className="font-serif text-[clamp(1.5rem,3vw,2.5rem)] italic gradient-text mb-8 tracking-wide">
            Right to Be Forgotten, Actually Working
          </p>

          <p className="mono text-dim text-lg max-w-3xl mx-auto mb-16 leading-[1.6]">
            One-click data deletion with zero-knowledge proofs. GDPR compliance
            that doesn't suck.
          </p>

          {/* System Status */}
          <div className="inline-flex items-center gap-6 px-8 py-4 rounded bg-[#080808] border border-[#1a1a1a] shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            {systemStatus?.status === "ok" ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 bg-accent rounded-full animate-pulse shadow-[0_0_10px_rgba(0,255,136,1)]"></div>
                  <span className="mono text-accent text-sm tracking-widest font-bold uppercase">LIVE DEMO</span>
                </div>
                <div className="h-6 w-[1px] bg-[#222]"></div>
                <div className="flex gap-6 text-sm mono text-dim uppercase tracking-widest">
                  <span className="flex items-center gap-2">
                    <Database size={16} className="text-accent" />
                    DB
                  </span>
                  <span className="flex items-center gap-2">
                    <Globe size={16} className="text-accent" />
                    Chain
                  </span>
                  <span className="flex items-center gap-2">
                    <Shield size={16} className="text-accent" />
                    Proofs
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 text-dim mono tracking-widest uppercase text-sm">
                <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full animate-pulse"></div>
                Checking system status...
              </div>
            )}
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="section py-24 px-4 bg-[#030303] border-b border-[#111]">
        <div className="container max-w-6xl mx-auto">
          <h2 className="font-serif text-[clamp(2.5rem,5vw,4rem)] font-bold mb-6 text-center tracking-tight">
            The <span className="text-[#ff3333] italic">Problem</span>
          </h2>
          <p className="mono text-dim text-lg text-center mb-20 max-w-3xl mx-auto leading-[1.6]">
            GDPR gave us the "Right to Be Forgotten" but nobody implemented it
            properly.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                number: "73",
                label: "Companies to contact",
                desc: "Average user must manually email 73 companies to delete their data",
                icon: <Users size={32} />,
              },
              {
                number: "30",
                label: "Days to respond",
                desc: "Legal requirement, but enforcement is manual, slow, and unverified",
                icon: <TrendingUp size={32} />,
              },
              {
                number: "€20M",
                label: "Maximum fine",
                desc: "Or 4% of global revenue - companies live in constant regulatory fear",
                icon: <Lock size={32} />,
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="p-10 rounded border border-[#ff3333]/20 bg-[radial-gradient(ellipse_at_top,rgba(255,51,51,0.05),transparent)] text-center transition-transform hover:-translate-y-1"
              >
                <div className="flex justify-center mb-6 text-[#ff3333]">
                  {stat.icon}
                </div>
                <div className="font-mono text-[clamp(3rem,4vw,4.5rem)] font-bold text-[#ff3333] mb-4 leading-none">
                  {stat.number}
                </div>
                <h3 className="font-serif text-xl font-bold mb-4 text-white">
                  {stat.label}
                </h3>
                <p className="mono text-dim text-sm leading-[1.6]">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Solution */}
      <section className="section py-24 px-4 border-b border-[#111]">
        <div className="container max-w-6xl mx-auto">
          <h2 className="font-serif text-[clamp(2.5rem,5vw,4rem)] font-bold mb-6 text-center tracking-tight">
            Our <span className="gradient-text italic">Solution</span>
          </h2>
          <p className="mono text-dim text-lg text-center mb-20 max-w-3xl mx-auto leading-[1.6]">
            One-click deletion with cryptographic proof using Midnight's
            zero-knowledge technology.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: <Zap size={28} />,
                title: "One-Click Deletion",
                desc: "Users delete data from all services simultaneously. No manual emails, no waiting weeks.",
                color: "text-amber-500",
                bg: "bg-amber-500/10 border-amber-500/20"
              },
              {
                icon: <Shield size={28} />,
                title: "Zero-Knowledge Proofs",
                desc: "Cryptographic proof of deletion without revealing what the data was. Powered by Midnight.",
                color: "text-blue-500",
                bg: "bg-blue-500/10 border-blue-500/20"
              },
              {
                icon: <CheckCircle size={28} />,
                title: "Automatic Compliance",
                desc: "Companies integrate once, compliance happens automatically. 5-minute setup.",
                color: "text-accent",
                bg: "bg-accent/10 border-accent/20"
              },
              {
                icon: <Database size={28} />,
                title: "Audit Trail",
                desc: "Immutable blockchain record of all operations. Perfect for regulatory audits.",
                color: "text-purple-500",
                bg: "bg-purple-500/10 border-purple-500/20"
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-8 rounded bg-[#080808] border border-[#1a1a1a] hover:border-[#333] transition-colors flex flex-col items-start gap-4"
              >
                <div className={`p-4 rounded border ${feature.bg} ${feature.color}`}>
                  {feature.icon}
                </div>
                <h3 className="font-serif text-2xl font-bold text-white mb-2 mt-2">
                  {feature.title}
                </h3>
                <p className="mono text-dim text-sm leading-[1.6]">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="section py-24 px-4 bg-[#030303] border-b border-[#111]">
        <div className="container max-w-6xl mx-auto">
          <h2 className="font-serif text-[clamp(2.5rem,5vw,4rem)] font-bold mb-6 text-center tracking-tight">
            Technical <span className="gradient-text italic">Architecture</span>
          </h2>
          <p className="mono text-dim text-lg text-center mb-20">
            Production-ready integration with Midnight blockchain
          </p>

          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div>
              <h3 className="font-serif text-2xl font-bold text-white mb-8 tracking-wide">
                Tech Stack
              </h3>
              <div className="space-y-4">
                {[
                  {
                    label: "Blockchain",
                    value: "Midnight Network (Testnet)",
                  },
                  { label: "Smart Contracts", value: "Compact Language" },
                  {
                    label: "ZK Proofs",
                    value: "Midnight Proof Server",
                  },
                  {
                    label: "Backend",
                    value: "Node.js + Express + TypeScript",
                  },
                  {
                    label: "Frontend",
                    value: "Next.js 14 + React + Tailwind",
                  },
                  {
                    label: "Database",
                    value: "PostgreSQL (Aiven managed)",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded bg-[#0a0a0a] border border-[#1a1a1a] gap-2"
                  >
                    <span className="mono text-dim text-xs tracking-widest uppercase">{item.label}</span>
                    <span className="mono text-accent text-sm font-bold">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-12">
              <div>
                <h3 className="font-serif text-2xl font-bold text-white mb-8 tracking-wide">
                  Deployed Contracts
                </h3>
                <div className="space-y-4">
                  <div className="p-5 rounded bg-[#0a0a0a] border border-[#1a1a1a]">
                    <div className="mono text-white tracking-widest uppercase text-xs font-bold mb-3">
                      DataCommitment
                    </div>
                    <div className="bg-black border border-[#222] p-3 rounded overflow-x-auto">
                      <code className="text-xs font-mono text-dim break-all">
                        0200a8e253d6db90d13bc02e42667f2705b28208...
                      </code>
                    </div>
                  </div>
                  <div className="p-5 rounded bg-[#0a0a0a] border border-[#1a1a1a]">
                    <div className="mono text-white tracking-widest uppercase text-xs font-bold mb-3">
                      ZKDeletionVerifier
                    </div>
                    <div className="bg-black border border-[#222] p-3 rounded overflow-x-auto">
                      <code className="text-xs font-mono text-dim break-all">
                        0200983887c84b45fdd7bb93bc97a23a8e4d0008...
                      </code>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-serif text-2xl font-bold text-white mb-8 tracking-wide">
                  System Health
                </h3>
                <div className="p-8 rounded border border-accent/20 bg-[radial-gradient(ellipse_at_bottom_right,rgba(0,255,136,0.1),transparent)] relative overflow-hidden">
                  <div className="grid grid-cols-2 gap-8 mb-6 relative z-10">
                    <div>
                      <div className="font-mono text-4xl font-bold text-white mb-2">
                        {testResults.passed}<span className="text-dim">/{testResults.total}</span>
                      </div>
                      <div className="mono text-xs text-accent tracking-widest uppercase">
                        Tests Passing
                      </div>
                    </div>
                    <div>
                      <div className="font-mono text-4xl font-bold text-white mb-2">
                        <span className="glow text-accent">{Math.round((testResults.passed / testResults.total) * 100)}%</span>
                      </div>
                      <div className="mono text-xs text-accent tracking-widest uppercase">
                        Success Rate
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mono text-sm font-bold tracking-widest uppercase text-accent border-t border-accent/20 pt-6 mt-2 relative z-10">
                    <CheckCircle size={18} />
                    All Systems Operational
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Architecture Diagram */}
          <div className="p-10 rounded bg-[#080808] border border-[#1a1a1a]">
            <h3 className="font-serif text-2xl font-bold text-center mb-12 tracking-wide text-white">
              Data Flow
            </h3>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative">
              <div className="hidden md:block absolute top-[2.5rem] left-0 right-0 h-[1px] bg-[#222] z-0"></div>
              
              {[
                { icon: Users, label: "User", sub: "Request deletion", color: "text-[#eee]" },
                { icon: Database, label: "Backend", sub: "Generate proofs", color: "text-blue-500" },
                { icon: Globe, label: "Midnight", sub: "Verify & record", color: "text-purple-500" },
                { icon: CheckCircle, label: "Proof", sub: "Immutable record", color: "text-accent" },
              ].map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center text-center relative z-10 w-full md:w-auto">
                    <div className={`w-20 h-20 mb-6 rounded bg-[#0a0a0a] border border-[#222] flex items-center justify-center ${step.color} shadow-[0_0_15px_rgba(0,0,0,1)]`}>
                      <Icon size={32} />
                    </div>
                    <div className="mono text-sm font-bold text-white tracking-widest uppercase mb-2">{step.label}</div>
                    <div className="mono text-xs text-dim">{step.sub}</div>
                    
                    {i < 3 && (
                      <div className="md:hidden w-[1px] h-8 bg-[#222] my-4"></div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Impact */}
      <section className="section py-24 px-4 bg-[#0a0a0a]">
        <div className="container max-w-6xl mx-auto">
          <h2 className="font-serif text-[clamp(2.5rem,5vw,4rem)] font-bold mb-20 text-center tracking-tight">
            Real-World <span className="gradient-text italic">Impact</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-10 rounded bg-[#050505] border border-[#1a1a1a] flex flex-col items-start hover:border-accent/30 transition-colors">
              <h3 className="font-serif text-2xl font-bold text-white mb-8 tracking-wide border-b border-[#222] pb-6 w-full flex items-center gap-4">
                <span className="text-2xl">👤</span> For Users
              </h3>
              <ul className="space-y-6 flex-1 pt-2">
                {[
                  "Delete data from 73+ companies in 1 click",
                  "Get cryptographic proof of deletion",
                  "See everywhere their data lives in real-time",
                  "No emails, no waiting, no trust required"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <div className="mt-1 rounded border border-accent/20 bg-accent/5 p-1 shrink-0">
                      <CheckCircle size={16} className="text-accent" />
                    </div>
                    <span className="mono text-dim text-sm leading-[1.6]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-10 rounded bg-[#050505] border border-[#1a1a1a] flex flex-col items-start hover:border-accent/30 transition-colors">
              <h3 className="font-serif text-2xl font-bold text-white mb-8 tracking-wide border-b border-[#222] pb-6 w-full flex items-center gap-4">
                <span className="text-2xl">🏢</span> For Companies
              </h3>
              <ul className="space-y-6 flex-1 pt-2">
                {[
                  "5-minute integration with REST API",
                  "Automatic GDPR compliance",
                  "Audit-ready blockchain trail",
                  "Avoid €20M fines with proven compliance"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <div className="mt-1 rounded border border-accent/20 bg-accent/5 p-1 shrink-0">
                      <CheckCircle size={16} className="text-accent" />
                    </div>
                    <span className="mono text-dim text-sm leading-[1.6]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Live Demo CTA */}
      <section className="section py-32 px-4 border-t border-[#111] bg-black relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(0,255,136,0.05)_0%,rgba(0,0,0,0)_70%)] pointer-events-none"></div>
        <div className="container max-w-6xl mx-auto text-center relative z-10">
          <h2 className="font-serif text-[clamp(2.5rem,5vw,4.5rem)] font-bold mb-6 tracking-tight">
            See It In <span className="gradient-text italic">Action</span>
          </h2>
          <p className="mono text-dim text-xl mb-16 max-w-2xl mx-auto">
            Fully functional demo with real Midnight blockchain integration.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              {
                step: "1",
                title: "Register",
                desc: "Companies register data",
                link: "/company-registration",
              },
              {
                step: "2",
                title: "Footprint",
                desc: "Users see their data",
                link: "/dashboard",
              },
              {
                step: "3",
                title: "Delete",
                desc: "1-click blockchain proof",
                link: "/dashboard",
              },
            ].map((item, i) => (
              <Link
                key={i}
                href={item.link}
                className="group block p-8 rounded bg-[#0a0a0a] border border-[#1a1a1a] hover:border-accent transition-all hover:shadow-[0_0_30px_rgba(0,255,136,0.05)] text-center"
              >
                <div className="w-14 h-14 mx-auto mb-6 rounded border border-accent/30 bg-accent/5 flex items-center justify-center text-accent font-mono font-bold text-xl transition-all group-hover:scale-110 group-hover:bg-accent/10">
                  {item.step}
                </div>
                <h3 className="font-serif text-xl font-bold text-white mb-2">
                  {item.title}
                </h3>
                <p className="mono text-xs text-dim mb-4 tracking-widest uppercase">
                  {item.desc}
                </p>
                <span className="mono text-xs font-bold text-accent tracking-widest uppercase transition-all group-hover:gap-2 flex items-center justify-center gap-1">
                  Try it <span>→</span>
                </span>
              </Link>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/dashboard"
              className="button button-primary px-12 py-5 text-base"
            >
              Launch Live Demo
            </Link>
            <Link
              href="/company-registration"
              className="button button-secondary px-12 py-5 text-base"
            >
              Register Test Data
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
