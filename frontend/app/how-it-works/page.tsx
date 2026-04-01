"use client";

import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { ChevronDown, Network } from "lucide-react";
import { useState } from "react";

export default function HowItWorks() {
  const [openAccordion, setOpenAccordion] = useState<number | null>(0);

  const technologies = [
    {
      title: "Why Only Midnight?",
      content:
        "Only Midnight blockchain has programmable privacy via zero-knowledge proofs built-in natively. Compare to Ethereum (all data public), Solana (no ZK natively), Midnight (private + ZK). We leverage this to store deletion commitments without ever revealing the underlying data.",
    },
    {
      title: "Zero-Knowledge Proofs",
      content:
        "We allow companies to mathematically prove 'I deleted data matching identifier X' without revealing what data was deleted, who the user is, or how much data was stored. This gives users absolute certainty of deletion while perfectly preserving company operational security.",
    },
    {
      title: "Cryptographic Commitments",
      content:
        "When data is first collected, a cryptographic hash (commitment) is stored on the Midnight blockchain. The actual data stays encrypted in the company's traditional off-chain database (e.g., PostgreSQL). When deletion occurs, a valid ZK proof of the deletion state change is generated and verified against this original commitment.",
    },
    {
      title: "PostgreSQL WAL CDC Agent",
      content:
        "Our open-source agent sits alongside the company's database and reads the Write-Ahead Log (WAL) securely. It watches for standard DELETE queries. When it sees one targeted at a registered user's row, it automatically intercepts the event and synthesizes the Midnight ZK proof, requiring zero code changes from the company.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pt-16">
      <Navigation />

      {/* Hero */}
      <section className="section py-24 px-4 relative flex items-center justify-center min-h-[60vh]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-[radial-gradient(ellipse,rgba(0,255,136,0.03)_0%,rgba(0,0,0,0)_60%)] pointer-events-none z-0"></div>
        <div className="container max-w-4xl mx-auto text-center relative z-10">
          <div className="badge inline-flex mb-8">
            <span className="badge-dot"></span> Architecture Deep Dive
          </div>
          <h1 className="font-serif text-[clamp(2.5rem,5vw,5rem)] font-bold tracking-tight mb-8 leading-none">
            How Oblivion Protocol<br /><span className="gradient-text italic">Works</span>
          </h1>

          <p className="mono text-dim text-xl max-w-2xl mx-auto leading-[1.6] mb-16">
            The only infrastructure that can mathematically prove GDPR deletion occurred <span className="text-white">without revealing the underlying data</span>.
          </p>

          <div className="p-10 rounded-lg bg-[radial-gradient(ellipse_at_top_right,rgba(0,255,136,0.05),transparent)] border border-accent/20 relative overflow-hidden backdrop-blur-sm">
            <Network className="absolute -right-10 -bottom-10 w-64 h-64 text-accent/10 pointer-events-none" />
            <div className="mono text-xs text-dim tracking-widest uppercase mb-6 text-left relative z-10">Interactive Architecture Flow</div>
            <div className="font-mono text-sm md:text-base text-accent flex flex-wrap items-center justify-center gap-2 md:gap-4 relative z-10 p-4 bg-black/50 border border-[#1a1a1a] rounded">
              <span>User</span>
              <span className="text-dim">→</span>
              <span>Company DB</span>
              <span className="text-dim">→</span>
              <span className="text-white">CDC Agent</span>
              <span className="text-dim">→</span>
              <span>Midnight Network</span>
              <span className="text-dim">→</span>
              <span className="glow">ZK Proof</span>
            </div>
          </div>
        </div>
      </section>

      {/* Technologies */}
      <section className="section py-24 px-4 border-t border-[#111] bg-[#030303]">
        <div className="container max-w-4xl mx-auto">
          <h2 className="font-serif text-[clamp(2rem,4vw,3rem)] font-bold mb-12 text-center">Core <span className="gradient-text">Technologies</span></h2>

          <div className="space-y-4">
            {technologies.map((tech, i) => (
              <div
                key={i}
                className="rounded-lg bg-[#080808] border border-[#1a1a1a] transition-all duration-300 overflow-hidden"
              >
                <button
                  onClick={() => setOpenAccordion(openAccordion === i ? null : i)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-[#111] transition-colors"
                >
                  <h3 className="font-serif text-xl font-bold text-white tracking-wide">{tech.title}</h3>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-[#111] border border-[#222] transition-transform duration-300 ${openAccordion === i ? "rotate-180 border-accent/30 text-accent" : "text-dim"}`}>
                    <ChevronDown size={18} />
                  </div>
                </button>
                <div 
                  className={`px-6 pb-6 pt-2 font-mono text-sm text-dim leading-[1.8] border-t border-[#1a1a1a] transition-all duration-300 ${openAccordion === i ? "block" : "hidden"}`}
                >
                  {tech.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Flow */}
      <section className="section py-32 px-4 border-t border-[#111]">
        <div className="container max-w-5xl mx-auto">
          <h2 className="font-serif text-[clamp(2.5rem,4vw,4rem)] font-bold mb-20 text-center tracking-tight">The Deletion Matrix</h2>

          <div className="relative">
            {/* Timeline Line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-[1px] bg-[linear-gradient(to_bottom,transparent,rgba(0,255,136,0.3),transparent)] -translate-x-1/2"></div>

            <div className="space-y-12 relative z-10">
              {[
                {
                  step: "01",
                  title: "User Registration Intent",
                  desc: "When a user signs up for a service, the company's system generates a cryptographic commitment (hash) of their identity and anchors it on the Midnight blockchain.",
                  side: "left"
                },
                {
                  step: "02",
                  title: "Data Deletion Request",
                  desc: "User invokes their right to be forgotten via the Oblivion Dashboard. A webhook is fired to the company's internal deletion endpoint.",
                  side: "right"
                },
                {
                  step: "03",
                  title: "Standard DELETE Query",
                  desc: "Company executes their standard `DELETE FROM users WHERE...` query. No blockchain integration required in their application logic.",
                  side: "left"
                },
                {
                  step: "04",
                  title: "CDC Agent Interception",
                  desc: "Oblivion's PostgreSQL CDC Agent detects the WAL event. It verifies the targeted row matches the anchored commitment.",
                  side: "right"
                },
                {
                  step: "05",
                  title: "Zero-Knowledge Circuit Execution",
                  desc: "The agent generates a ZK-SNARK proof locally that a database deletion occurred matching the specific commitment.",
                  side: "left"
                },
                {
                  step: "06",
                  title: "Immutable Public Proof",
                  desc: "Proof is published to Midnight Network. A standalone verifier URL is generated, allowing regulators to confirm compliance via math, not trust.",
                  side: "right"
                },
              ].map((item, i) => (
                <div key={i} className={`flex flex-col md:flex-row gap-8 items-center ${item.side === 'right' ? 'md:flex-row-reverse' : ''}`}>
                  <div className={`flex-1 w-full p-8 rounded-lg bg-[#080808] border border-[#1a1a1a] hover:border-accent/30 transition-all ${item.side === 'left' ? 'md:text-right md:pl-16' : 'md:text-left md:pr-16'}`}>
                    <div className="font-mono text-accent text-sm tracking-widest uppercase mb-3">Phase {item.step}</div>
                    <h3 className="font-serif text-2xl font-bold text-white mb-4">{item.title}</h3>
                    <p className="mono text-dim text-sm leading-[1.6]">{item.desc}</p>
                  </div>
                  
                  <div className="w-16 h-16 rounded-xl bg-black border-2 border-[#222] flex items-center justify-center flex-shrink-0 z-10 shadow-[0_0_20px_rgba(0,0,0,1)] text-white font-mono font-bold text-lg relative before:absolute before:-inset-1 before:bg-accent/20 before:-z-10 before:rounded-xl">
                    {item.step}
                  </div>
                  
                  <div className="flex-1 w-full hidden md:block"></div>
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
