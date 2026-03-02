"use client";

import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { CheckCircle, Lock, Zap } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { WalletConnectButton } from "@/components/blockchain/WalletConnectButton";

export default function Home() {
  const { isConnected } = useWallet();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-secondary/50 border border-border">
            <Lock size={16} className="text-primary" />
            <span className="text-sm text-muted-foreground">
              Built on Midnight Blockchain
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-semibold text-foreground mb-6 leading-tight">
            Your Data, Your Control
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Exercise your "Right to Be Forgotten" with one click. See everywhere
            your data lives. Delete it all instantly with cryptographic proof.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            {isConnected ? (
              <Link
                href="/dashboard"
                className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-colors inline-block"
              >
                Launch Dashboard
              </Link>
            ) : (
              <div className="px-8 py-3">
                <WalletConnectButton />
              </div>
            )}
            <Link
              href="/for-companies"
              className="px-8 py-3 border border-border text-foreground rounded-full font-semibold hover:bg-secondary transition-colors inline-block"
            >
              For Companies
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap gap-4 justify-center text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-accent" />
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-accent" />
              <span>Zero-Knowledge Proofs</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-accent" />
              <span>Instant Deletion</span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-semibold text-foreground mb-16 text-center">
            The Right to Be Forgotten is Broken
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Stat Cards */}
            {[
              {
                stat: "73",
                title: "Average deletion requests needed",
                desc: "Users must manually contact dozens of companies, wait weeks, have zero proof",
              },
              {
                stat: "30",
                title: "Days legal response time",
                desc: "Companies struggle with manual processes, fear €20M fines",
              },
              {
                stat: "0%",
                title: "Cryptographic proof",
                desc: "No way to prove deletion happened, just trust us",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-6 rounded-lg bg-secondary/50 border border-border"
              >
                <div className="text-5xl font-bold text-primary mb-2">
                  {item.stat}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-semibold text-foreground mb-4 text-center">
            Meet Oblivion Protocol
          </h2>
          <p className="text-center text-muted-foreground text-lg mb-16">
            GDPR compliance that actually works
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-lg bg-secondary/30 border border-border">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <Zap className="text-primary" size={24} />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-3">
                Your Personal Data Dashboard
              </h3>
              <p className="text-muted-foreground mb-6">
                See everywhere your data lives in real-time. One click deletes
                from ALL services simultaneously. Get cryptographic blockchain
                proof forever.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <CheckCircle
                    size={16}
                    className="text-accent flex-shrink-0 mt-1"
                  />
                  <span>Real-time tracking</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle
                    size={16}
                    className="text-accent flex-shrink-0 mt-1"
                  />
                  <span>One-click deletion</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle
                    size={16}
                    className="text-accent flex-shrink-0 mt-1"
                  />
                  <span>Blockchain proofs</span>
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-lg bg-secondary/30 border border-border">
              <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                <Lock className="text-accent" size={24} />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-3">
                Automatic Compliance for Companies
              </h3>
              <p className="text-muted-foreground mb-6">
                Install SDK like Google Analytics, zero blockchain knowledge
                needed. Auto-deletion proofs, no more manual GDPR requests.
              </p>
              <div className="bg-background/50 p-4 rounded font-mono text-sm text-primary mb-4">
                <div>npm install @oblivion/sdk</div>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <CheckCircle
                    size={16}
                    className="text-accent flex-shrink-0 mt-1"
                  />
                  <span>5-minute setup</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle
                    size={16}
                    className="text-accent flex-shrink-0 mt-1"
                  />
                  <span>Auto-deletion proofs</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-semibold text-foreground mb-16 text-center">
            How It Works
          </h2>

          <div className="space-y-8">
            {[
              {
                step: "1",
                title: "User signs up for service",
                desc: "Automatically registers in dashboard",
              },
              {
                step: "2",
                title: "See your data footprint",
                desc: "Real-time view of all services holding data",
              },
              {
                step: "3",
                title: "One-click deletion",
                desc: "Data erased from all services in 10-15 seconds",
              },
              {
                step: "4",
                title: "Cryptographic proof forever",
                desc: "Zero-knowledge proofs on blockchain",
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-6">
                <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-semibold">
                    {item.step}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-3xl font-semibold text-foreground mb-6">
                €42.57B
              </h3>
              <p className="text-muted-foreground">
                European blockchain market blocked by GDPR
              </p>
            </div>
            <div>
              <h3 className="text-3xl font-semibold text-primary mb-6">€20M</h3>
              <p className="text-muted-foreground">
                Maximum GDPR fine or 4% of annual revenue
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-semibold text-foreground mb-6">
            Ready to Take Control of Your Data?
          </h2>
          <p className="text-muted-foreground text-lg mb-12">
            Free for users, €500/month for companies
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/demo"
              className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-colors inline-block"
            >
              Try Dashboard Demo
            </Link>
            <Link
              href="/for-companies"
              className="px-8 py-3 border border-border text-foreground rounded-full font-semibold hover:bg-secondary transition-colors inline-block"
            >
              Integrate Your Company
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
