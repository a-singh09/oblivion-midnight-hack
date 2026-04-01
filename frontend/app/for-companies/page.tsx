"use client";

import { useState } from "react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { CheckCircle, Shield, TrendingUp, AlertCircle, Terminal, Database } from "lucide-react";

export default function ForCompanies() {
  const [roiMonthly, setRoiMonthly] = useState(50);
  const [costPerRequest, setCostPerRequest] = useState(250);
  const [hourlyRate, setHourlyRate] = useState(150);

  const currentCost = roiMonthly * costPerRequest * (hourlyRate / 60);
  const oblivionCost = 500;
  const savings = currentCost - oblivionCost;
  const savingsPercent = Math.round((savings / currentCost) * 100);

  return (
    <div className="min-h-screen bg-background text-foreground pt-16">
      <Navigation />

      {/* Hero Section */}
      <section className="section py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60vw] h-[60vw] bg-[radial-gradient(ellipse,rgba(0,255,136,0.02)_0%,rgba(0,0,0,0)_60%)] pointer-events-none z-0"></div>
        <div className="container max-w-4xl mx-auto text-center relative z-10">
          <h1 className="font-serif text-[clamp(2.5rem,5vw,4.5rem)] font-bold tracking-tight mb-6 leading-tight">
            GDPR Compliance That<br /><span className="gradient-text">Installs in 5 Minutes</span>
          </h1>

          <p className="mono text-dim text-xl max-w-2xl mx-auto mb-10 leading-[1.6]">
            One SDK. Zero blockchain knowledge. Automatic deletion proofs. Never fear a €20M fine again.
          </p>

          <div className="flex flex-wrap gap-6 justify-center text-sm font-mono text-dim mb-12">
            <div className="flex items-center gap-2">
              <CheckCircle size={18} className="text-accent" />
              <span>5-minute integration</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={18} className="text-accent" />
              <span>€500/month flat</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={18} className="text-accent" />
              <span>Audit-ready proofs</span>
            </div>
          </div>

          {/* Code Snippet */}
          <div className="inline-block bg-[#0a0a0a] border border-[#1a1a1a] rounded p-5 mb-8 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <div className="font-mono text-sm text-foreground flex items-center gap-3">
              <Terminal size={18} className="text-accent" /> npm install @oblivion/sdk
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="section py-20 px-4 flex flex-col items-center border-t border-[#111] bg-[#030303]">
        <div className="container max-w-6xl mx-auto">
          <h2 className="font-serif text-[clamp(2.5rem,4vw,3.5rem)] font-bold text-center mb-16">
            Stop Wrestling with <span className="gradient-text italic">Compliance</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: AlertCircle,
                title: "Manual processes are expensive",
                desc: "Deletion requests cost €200-500 each and take days of engineering time to process.",
              },
              {
                icon: Shield,
                title: "Regulatory risk",
                desc: "Fear of €20M fines or 4% revenue penalties for failing to comply with deletion requests.",
              },
              {
                icon: TrendingUp,
                title: "No audit trail",
                desc: "Regulators demand proof, but you only have fragile log files. Impossible audits without verifiable proof.",
              },
            ].map((item, i) => {
              const IconComponent = item.icon;
              return (
                <div key={i} className="bg-[#080808] border border-[#1a1a1a] p-8 rounded-lg transition-transform hover:-translate-y-1">
                  <div className="w-14 h-14 bg-accent/5 rounded-xl border border-accent/10 flex items-center justify-center mb-6">
                    <IconComponent className="text-accent" size={28} />
                  </div>
                  <h3 className="font-serif text-xl font-bold mb-4">{item.title}</h3>
                  <p className="mono text-dim text-sm leading-[1.6]">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Before/After */}
      <section className="section py-24 px-4 border-t border-[#111]">
        <div className="container max-w-6xl mx-auto">
          <h2 className="font-serif text-4xl font-bold text-center mb-16 tracking-wide">Before vs After</h2>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {[
              {
                title: "WITHOUT Oblivion",
                items: [
                  "30 days legal response time",
                  "€500 engineering time per request",
                  "Zero cryptographic proof of deletion",
                  "Manual, error-prone GDPR processes",
                  "Constant risk of compliance fines",
                ],
                color: "destructive",
              },
              {
                title: "WITH Oblivion Protocol",
                items: [
                  "15 seconds automated processing",
                  "€0 engineering time per request",
                  "Immutable blockchain proof generated",
                  "Transparent, automated compliance",
                  "Zero regulatory risk",
                ],
                color: "accent",
              },
            ].map((section, i) => (
              <div key={i} className={`p-10 rounded-lg border ${
                section.color === "destructive" 
                  ? "bg-[radial-gradient(ellipse_at_top_right,rgba(255,51,51,0.05),transparent)] border-[#2a0a0a]" 
                  : "bg-[radial-gradient(ellipse_at_top_left,rgba(0,255,136,0.05),transparent)] border-[#0a2a1a]"
              }`}>
                <h3
                  className={`font-serif text-2xl font-bold mb-8 uppercase tracking-wider ${
                    section.color === "destructive" ? "text-[#ff3333]" : "text-accent"
                  }`}
                >
                  {section.title}
                </h3>
                <ul className="space-y-5">
                  {section.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-4">
                      <div className={`mt-0.5 rounded-full p-1 ${section.color === "destructive" ? "bg-[#ff3333]/10" : "bg-accent/10"}`}>
                        <CheckCircle
                          size={18}
                          className={section.color === "destructive" ? "text-[#ff3333]" : "text-accent"}
                        />
                      </div>
                      <span className="mono text-dim text-[0.95rem] leading-[1.6]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Methods */}
      <section className="section py-24 px-4 border-t border-[#111] bg-[#030303]">
        <div className="container max-w-6xl mx-auto">
          <h2 className="font-serif text-4xl font-bold text-center mb-16 tracking-wide">Choose Your Integration</h2>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Native SDK",
                subtitle: "Node.js / TypeScript",
                code: "npm install @oblivion/sdk",
                icon: Terminal
              },
              {
                title: "Database CDC Plugin",
                subtitle: "PostgreSQL Logical Replication",
                code: "CREATE EXTENSION oblivion_sdk;",
                icon: Database
              },
              {
                title: "API Proxy",
                subtitle: "Transparent REST middleware",
                code: "proxy: 'https://api.oblivion.io/v1'",
                icon: Shield
              },
              {
                title: "Shopify & SaaS Apps",
                subtitle: "Marketplace integrations via OAuth",
                code: "Apps → Oblivion Protocol",
                icon: AlertCircle
              },
            ].map((method, i) => {
              const Icon = method.icon;
              return (
                <div key={i} className="bg-[#080808] border border-[#1a1a1a] p-8 rounded-lg flex items-start gap-6 hover:border-[#333] transition-colors">
                  <div className="w-12 h-12 bg-[#111] rounded border border-[#222] flex items-center justify-center flex-shrink-0">
                    <Icon size={20} className="text-dim" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-serif text-xl font-bold mb-1">{method.title}</h3>
                    <p className="mono text-dim text-xs tracking-widest uppercase mb-4">{method.subtitle}</p>
                    <div className="bg-black border border-[#222] p-4 rounded font-mono text-[0.85rem] text-accent overflow-x-auto shadow-inner">
                      {method.code}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section py-24 px-4 border-t border-[#111]">
        <div className="container max-w-6xl mx-auto">
          <h2 className="font-serif text-4xl font-bold text-center mb-16 tracking-wide">Predictable Pricing</h2>

          <div className="grid md:grid-cols-3 gap-8 items-center lg:px-12">
            {[
              {
                name: "Developer",
                price: "Free",
                desc: "Get started on testnet",
                features: ["Up to 100 users", "Testnet only", "Community discord support"],
              },
              {
                name: "Professional",
                price: "€500",
                period: "/month",
                desc: "Most popular for startups",
                features: ["Unlimited users", "Production mainnet", "Priority support", "Monthly compliance audit reports"],
                highlight: true,
              },
              {
                name: "Enterprise",
                price: "Custom",
                desc: "For large scale deployments",
                features: ["Dedicated integration support", "On-premise deployment option", "Custom SLAs", "Advanced analytics dashboard"],
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`p-10 rounded-lg border transition-all duration-300 relative bg-[#080808] ${
                  plan.highlight 
                    ? "border-accent/50 shadow-[0_0_50px_rgba(0,255,136,0.05)] md:-mt-8 md:mb-8" 
                    : "border-[#1a1a1a] hover:border-[#333]"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent text-black font-bold uppercase tracking-widest text-[0.65rem] px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(0,255,136,0.5)]">
                    Most Popular
                  </div>
                )}
                <h3 className="mono text-dim text-sm tracking-widest uppercase mb-4">{plan.name}</h3>
                <div className="mb-6 flex items-baseline gap-2">
                  <span className="font-serif text-[clamp(2.5rem,4vw,3.5rem)] font-bold leading-none">{plan.price}</span>
                  {plan.period && <span className="mono text-dim">{plan.period}</span>}
                </div>
                <p className="mono text-dim text-xs mb-8">{plan.desc}</p>
                <button
                  className={`w-full py-4 text-sm tracking-widest uppercase mb-8 transition-colors rounded ${
                    plan.highlight
                      ? "bg-accent text-black font-bold hover:bg-accent/90"
                      : "bg-[#111] border border-[#222] text-white hover:bg-[#222]"
                  }`}
                >
                  Get Started
                </button>
                <ul className="space-y-4">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <CheckCircle size={16} className={`mt-0.5 ${plan.highlight ? "text-accent" : "text-[#555]"}`} />
                      <span className="mono text-dim text-[0.85rem] leading-[1.6]">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="section py-24 px-4 border-t border-[#111] bg-[#030303]">
        <div className="container max-w-4xl mx-auto">
          <h2 className="font-serif text-4xl font-bold text-center mb-16 tracking-wide">ROI Calculator</h2>

          <div className="p-8 md:p-12 rounded-lg bg-[#080808] border border-[#1a1a1a]">
            <div className="grid md:grid-cols-3 gap-10 md:gap-8 mb-12">
              <div>
                <label className="block mono text-xs font-bold text-dim mb-4 uppercase tracking-widest">DSAR requests / month</label>
                <input
                  type="range"
                  min="1"
                  max="500"
                  value={roiMonthly}
                  onChange={(e) => setRoiMonthly(Number(e.target.value))}
                  className="w-full h-1 bg-[#222] rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: "var(--accent-emerald)" }}
                />
                <div className="font-mono text-3xl font-bold text-foreground mt-4">{roiMonthly}</div>
              </div>

              <div>
                <label className="block mono text-xs font-bold text-dim mb-4 uppercase tracking-widest">Cost per request (€)</label>
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="25"
                  value={costPerRequest}
                  onChange={(e) => setCostPerRequest(Number(e.target.value))}
                  className="w-full h-1 bg-[#222] rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: "var(--accent-emerald)" }}
                />
                <div className="font-mono text-3xl font-bold text-foreground mt-4">€{costPerRequest}</div>
              </div>

              <div>
                <label className="block mono text-xs font-bold text-dim mb-4 uppercase tracking-widest">Hourly rate (€)</label>
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="25"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="w-full h-1 bg-[#222] rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: "var(--accent-emerald)" }}
                />
                <div className="font-mono text-3xl font-bold text-foreground mt-4">€{hourlyRate}</div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 border-t border-[#1a1a1a] pt-12">
              <div className="p-6 rounded bg-[#0a0a0a] border border-[#1a1a1a]">
                <div className="mono text-[0.7rem] text-dim tracking-widest uppercase mb-3 text-center md:text-left">Current monthly cost</div>
                <div className="font-mono text-3xl md:text-2xl lg:text-3xl font-bold text-[#ff3333] text-center md:text-left">€{Math.round(currentCost).toLocaleString()}</div>
              </div>
              <div className="p-6 rounded bg-[#0a0a0a] border border-[#1a1a1a]">
                <div className="mono text-[0.7rem] text-dim tracking-widest uppercase mb-3 text-center md:text-left">With Oblivion</div>
                <div className="font-mono text-3xl md:text-2xl lg:text-3xl font-bold text-foreground text-center md:text-left">€500</div>
              </div>
              <div className="p-6 rounded bg-[radial-gradient(ellipse_at_top_right,rgba(0,255,136,0.1),transparent)] border border-accent/30 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-5">
                  <TrendingUp size={100} />
                </div>
                <div className="mono text-[0.7rem] text-accent tracking-widest uppercase mb-3 relative z-10 text-center md:text-left">Monthly savings</div>
                <div className="font-mono text-[clamp(2rem,4vw,3rem)] font-bold text-accent glow relative z-10 text-center md:text-left leading-none">{Math.max(0, savingsPercent)}%</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section py-32 px-4 border-t border-[#111] text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] h-[500px] bg-[radial-gradient(ellipse,rgba(0,255,136,0.05)_0%,rgba(0,0,0,0)_70%)] pointer-events-none"></div>
        <div className="container max-w-4xl mx-auto relative z-10">
          <h2 className="font-serif text-[clamp(2.5rem,5vw,4rem)] font-bold mb-8">Ready to automate<br/><span className="gradient-text italic">GDPR compliance?</span></h2>
          <p className="mono text-dim text-lg mb-12 max-w-2xl mx-auto">
            Get started in 5 minutes with our SDK. No blockchain knowledge required.
          </p>

          <button className="button button-primary px-12 py-5 text-base">
            Start Developer Trial
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
