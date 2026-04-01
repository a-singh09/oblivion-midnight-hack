"use client";

import React, { useEffect, useRef, useState } from "react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { ArrowRight, Terminal, ShieldAlert, Fingerprint, Database, Link2, ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useWallet } from "@/contexts/WalletContext";

gsap.registerPlugin(ScrollTrigger);

// Particle string generator
const particleChars = ['0', '1', 'a', 'b', 'c', 'd', 'e', 'f', 'x', 'h', 'k', 'z'];

const CodeBlock = ({ code }: { code: string }) => (
  <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6 text-left mt-6 overflow-x-auto">
    <div className="flex gap-2 mb-4">
      <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
      <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></div>
      <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></div>
    </div>
    <pre className="font-mono text-[0.85rem] text-[#a0a0a0] m-0 overflow-x-auto">
      <code>{code}</code>
    </pre>
  </div>
);

const featureData = [
  {
    title: "Zero Knowledge Proofs",
    desc: "Personal data never touches the blockchain. Only commitment hashes are stored, ensuring absolute mathematical privacy for the user.",
    icon: <Fingerprint size={28} className="text-accent" />
  },
  {
    title: "Immutable Evidence",
    desc: "Replaces screenshots and fragile log files. Deletion proofs are stored on Midnight Network permanently, creating an unforgeable record.",
    icon: <ShieldAlert size={28} className="text-accent" />
  },
  {
    title: "No Code Changes",
    desc: "Plug-and-play SDK. Execute your standard DELETE queries. Our CDC agent transparently watches PostgreSQL WAL for deletions.",
    icon: <Database size={28} className="text-accent" />
  },
  {
    title: "Public Verifier",
    desc: "Generate Deletion Certificates with public URLs. Regulators verify compliance without authentication, replacing trust with math.",
    icon: <Link2 size={28} className="text-accent" />
  }
];

export default function Home() {
  const { isConnected } = useWallet();
  const heroRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const [dsars, setDsars] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero Animations
      const tl = gsap.timeline();
      tl.fromTo('.hero-badge', 
        { y: 20, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
      );
      tl.fromTo('.hero-headline',
        { y: 40, opacity: 0, rotateX: -20 },
        { y: 0, opacity: 1, rotateX: 0, duration: 0.8, ease: 'back.out(1.7)' },
        "-=0.4"
      );
      tl.fromTo('.hero-scribble', 
        { strokeDashoffset: 500 }, 
        { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut' }, 
        "-=0.2"
      );
      tl.fromTo('.hero-subtext',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
        "-=0.6"
      );
      tl.fromTo('.hero-cta',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: 'power3.out' },
        "-=0.4"
      );

      // How It Works Animation
      const steps = gsap.utils.toArray('.step-card');
      steps.forEach((step: any) => {
        gsap.fromTo(step,
          { opacity: 0, y: 50 },
          {
            opacity: 1, y: 0, duration: 0.8, ease: "power3.out",
            scrollTrigger: { trigger: step, start: "top 80%" }
          }
        );
      });

      gsap.fromTo('.timeline-line',
        { height: 0 },
        {
          height: '100%', ease: "none",
          scrollTrigger: { trigger: '.steps-container', start: "top 50%", end: "bottom 50%", scrub: true }
        }
      );

      // Stats Counters
      const obj = { val: 0 };
      gsap.to(obj, {
        val: 9812734, duration: 3, ease: "power2.out",
        scrollTrigger: { trigger: statsRef.current, start: "top 80%" },
        onUpdate: () => setDsars(Math.floor(obj.val))
      });

      gsap.fromTo(statsRef.current,
        { opacity: 0, scale: 0.95, filter: 'blur(10px)' },
        { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1, ease: "power3.out", scrollTrigger: { trigger: statsRef.current, start: "top 85%" } }
      );

      // Features Animation
      gsap.fromTo('.feature-card',
        { y: 50, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: "back.out(1.5)",
          scrollTrigger: { trigger: featuresRef.current, start: "top 75%" }
        }
      );

      // Final CTA Animation
      const container = document.getElementById('particles-canvas');
      if (container) {
        container.innerHTML = '';
        for (let i = 0; i < 30; i++) {
          const p = document.createElement('div');
          p.innerText = particleChars[Math.floor(Math.random() * particleChars.length)];
          p.style.position = 'absolute';
          p.style.left = Math.random() * 100 + 'vw';
          p.style.top = Math.random() * 100 + 'vh';
          p.style.color = 'var(--accent-emerald)';
          p.style.fontFamily = 'monospace';
          p.style.fontSize = (Math.random() * 10 + 10) + 'px';
          p.style.opacity = '0';
          p.style.textShadow = '0 0 5px var(--accent-emerald)';
          container.appendChild(p);
          gsap.to(p, {
            y: -100 - (Math.random() * 200), opacity: Math.random() * 0.5 + 0.1, duration: Math.random() * 5 + 5,
            repeat: -1, yoyo: true, ease: "sine.inOut", delay: Math.random() * 5
          });
        }
      }

      gsap.fromTo(ctaRef.current,
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: ctaRef.current, start: 'top 80%' } }
      );

    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden pt-16">
      <Navigation />

      {/* Hero Section */}
      <section className="section min-h-[calc(100vh-4rem)] flex items-center" ref={heroRef}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-[radial-gradient(circle,rgba(0,255,136,0.03)_0%,rgba(0,0,0,0)_70%)] pointer-events-none z-0"></div>
        <div className="container text-center relative z-10 w-full">
          <div className="badge hero-badge mb-8 mx-auto">
            <span className="badge-dot"></span> Midnight Preview Network
          </div>
          <h1 className="hero-headline text-[clamp(2.5rem,7vw,6rem)] tracking-tight mb-8">
            <span className="inline-block">Proof</span>{" "}
            <span className="inline-block">of</span>{" "}
            <span className="inline-block relative">
              <i className="not-italic opacity-90 mx-2">Deletion</i>
              <svg width="100%" height="30" viewBox="0 0 300 30" className="absolute -bottom-[2px] left-0 overflow-visible z-[-1]">
                <path
                  className="hero-scribble"
                  d="M5,20 Q50,0 150,15 T295,20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="500"
                  style={{ color: 'var(--accent-emerald)', filter: 'drop-shadow(0 0 8px rgba(0, 255, 136, 0.5))' }}
                />
              </svg>
            </span>
          </h1>
          <p className="hero-subtext mono text-dim text-lg max-w-3xl mx-auto mb-12">
            Oblivion Protocol generates mathematically verifiable, tamper-proof evidence that a specific personal data record was <span className="text-foreground">permanently erased</span>. Replaces trust with math.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/dashboard" className="hero-cta button button-primary">
              Launch App <ArrowRight size={18} className="ml-2" />
            </Link>
            <div className="hero-cta button button-secondary">
              <Terminal size={18} className="mr-2" /> npm install @oblivion/sdk
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section bg-[#030303]" id="how-it-works" ref={howItWorksRef}>
        <div className="container">
          <h2 className="text-center mb-16 text-[clamp(2rem,4vw,3.5rem)]">
            How it works. <br /><span className="gradient-text italic">Trust the math.</span>
          </h2>
          <div className="steps-container relative flex flex-col gap-16 max-w-3xl mx-auto">
            <div className="absolute left-6 top-0 bottom-0 w-[2px] bg-[#111] z-0">
              <div className="timeline-line w-full bg-gradient-to-b from-accent to-[#00d4aa] filter drop-shadow-[0_0_5px_var(--accent-emerald)]"></div>
            </div>

            {[
              {
                title: "Register Intent",
                desc: "Anchor a cryptographic fingerprint on-chain before the DB deletion runs.",
                code: `// Express.js Route\nawait oblivion.registerIntent({ \n  table: "users", \n  primaryKey: userId, \n  dsarRequestId: dsarId \n});`
              },
              {
                title: "Standard Deletion",
                desc: "Run your existing DELETE query. Our CDC Agent watches your PostgreSQL WAL (Write-Ahead Log) securely.",
                code: `// Your existing code remains unchanged\nawait db.query(\n  "DELETE FROM users WHERE id = $1", \n  [userId]\n);`
              },
              {
                title: "Generate Proof",
                desc: "Agent matches the WAL event and submits a Midnight ZK proof. A public verification URL is generated.",
                code: `// Regulator visits verifiable URL:\n{\n  "verified": true,\n  "midnightBlock": "1234567",\n  "txHash": "0xabc123..."\n}`
              }
            ].map((step, idx) => (
              <div key={idx} className="step-card flex gap-8 relative z-10">
                <div className="w-[50px] h-[50px] rounded-full bg-black border-2 border-accent flex items-center justify-center font-mono font-bold flex-shrink-0 shadow-[0_0_15px_rgba(0,255,136,0.3)]">
                  {idx + 1}
                </div>
                <div className="flex-1 pt-2 min-w-0">
                  <h3 className="text-3xl mb-2">{step.title}</h3>
                  <p className="text-dim mono text-[0.95rem]">{step.desc}</p>
                  <CodeBlock code={step.code} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section bg-gradient-to-b from-black to-[#050a08] border-y border-[#111]" ref={statsRef}>
        <div className="container text-center">
          <h2 className="text-dim mono text-base uppercase tracking-[2px] mb-8">
            Network State: Compact Contract
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-12 my-16">
            <div className="text-center">
              <div className="gradient-text text-[clamp(2.5rem,5vw,4.5rem)] font-mono font-bold leading-none">
                {dsars.toLocaleString()}
              </div>
              <div className="text-dim mono mt-4 text-[0.9rem]">Deletions Verified (WAL LSN)</div>
            </div>
            
            <div className="w-full sm:w-[1px] h-[1px] sm:h-24 bg-[radial-gradient(circle,var(--accent-emerald)_0%,transparent_100%)] opacity-30"></div>
            
            <div className="text-center">
              <div className="gradient-text glow text-[clamp(2.5rem,5vw,4.5rem)] font-mono font-bold leading-none">
                0%
              </div>
              <div className="text-dim mono mt-4 text-[0.9rem]">Personal Data Stored On-Chain</div>
            </div>

            <div className="w-full sm:w-[1px] h-[1px] sm:h-24 bg-[radial-gradient(circle,var(--accent-emerald)_0%,transparent_100%)] opacity-30"></div>

            <div className="text-center">
              <div className="text-[clamp(2.5rem,5vw,4.5rem)] font-mono font-bold leading-none text-foreground">
                £0
              </div>
              <div className="text-dim mono mt-4 text-[0.9rem]">GDPR Non-Compliance Fines</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section" id="features" ref={featuresRef}>
        <div className="container">
          <h2 className="text-center mb-16 text-[clamp(2rem,8vw,3rem)]">
            Uncompromising <span className="gradient-text">Architecture.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featureData.map((feature, i) => (
              <div
                key={i}
                className="feature-card bg-[#080808] border border-[#1a1a1a] p-10 rounded-lg transition-all duration-300 hover:border-accent/40 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,255,136,0.05)] cursor-default"
              >
                <div className="w-16 h-16 bg-accent/5 rounded-xl flex items-center justify-center mb-6 border border-accent/10">
                  {feature.icon}
                </div>
                <h3 className="text-2xl mb-4">{feature.title}</h3>
                <p className="text-dim mono text-[0.9rem] leading-[1.6]">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="section relative overflow-hidden py-48">
        <div id="particles-canvas" className="absolute inset-0 pointer-events-none opacity-30 z-0"></div>
        <div className="container text-center relative z-10" ref={ctaRef}>
          <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] mb-6 leading-tight">
            Ready to prove <span className="italic text-dim">nothing</span>?
          </h2>
          <p className="mono text-dim text-xl max-w-2xl mx-auto mb-12">
            Integrate Oblivion Protocol today and eliminate GDPR deletion compliance risks forever.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/company-registration" className="button button-primary px-12 py-4 text-base">
              Start Building
            </Link>
            <button className="button button-secondary px-12 py-4 text-base">
              View Explorer <ArrowUpRight size={20} className="ml-2" />
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
