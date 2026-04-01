"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Check, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function Demo() {
  const [step, setStep] = useState(0)
  const [demoId, setDemoId] = useState("")
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (step === 4) {
      setShowConfetti(true)
      const timeout = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(timeout)
    }
  }, [step])

  const generateDemoId = () => {
    const id = "did:midnight:" + Math.random().toString(36).substring(2, 15)
    setDemoId(id)
    setStep(1)
  }

  const steps = [
    {
      title: "Generate Demo Identity",
      description: "Create a temporary DID to explore the dashboard",
      action: "Generate Identity",
      onClick: generateDemoId,
    },
    {
      title: "View Data Locations",
      description: "See 8 fictional companies holding your data in real-time",
      action: "See Locations",
      onClick: () => setStep(2),
    },
    {
      title: "Explore Access History",
      description: "Check who accessed your data and when",
      action: "View History",
      onClick: () => setStep(3),
    },
    {
      title: "One-Click Deletion",
      description: "Delete data simultaneously with blockchain proof",
      action: "Test Deletion",
      onClick: () => setStep(4),
    },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground pt-16">
      <Navigation />

      <section className="section py-20 px-4 sm:px-6 lg:px-8 bg-[#030303]">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="font-serif text-[clamp(2.5rem,5vw,4.5rem)] font-bold mb-6 tracking-tight">
              Interactive <span className="gradient-text italic">Demo</span>
            </h1>

            <p className="mono text-dim text-lg max-w-2xl mx-auto leading-[1.6]">
              Walk through the Oblivion Protocol experience from start to finish. Explore how GDPR compliance can actually work.
            </p>
          </div>

          {/* Step Indicator */}
          <div className="mb-16 relative">
            <div className="flex justify-between relative z-10 w-full mb-4 px-[1.5rem]">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`w-12 h-12 rounded bg-black border-2 flex items-center justify-center font-mono font-bold transition-all duration-300 ${
                    step >= i
                      ? "border-accent text-accent shadow-[0_0_15px_rgba(0,255,136,0.3)]"
                      : "border-[#222] text-[#333]"
                  }`}
                >
                  {step > i ? <Check size={20} /> : <span className="tracking-tighter">0{i + 1}</span>}
                </div>
              ))}
            </div>

            {/* Progress Line */}
            <div className="absolute top-6 left-0 right-0 h-[2px] bg-[#1a1a1a] z-0 px-6">
              <div
                className="h-full bg-[linear-gradient(90deg,transparent,rgba(0,255,136,1))] transition-all duration-500 ease-out"
                style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
              />
            </div>
            
            <div className="flex justify-between px-2">
               {steps.map((s, i) => (
                <div key={i} className={`text-center w-24 text-[0.65rem] mono uppercase tracking-widest ${step >= i ? "text-white" : "text-dim"}`}>
                  {s.action}
                </div>
               ))}
            </div>
          </div>

          {/* Current Step Content */}
          <div className="p-8 md:p-12 rounded bg-[#080808] border border-[#1a1a1a] relative overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] min-h-[400px] flex flex-col justify-center">
            {step < 4 && (
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent/50 to-transparent"></div>
            )}
            
            {step === 0 ? (
              <div className="text-center animate-fade-in">
                <h2 className="font-serif text-3xl font-bold text-white mb-4">{steps[0].title}</h2>
                <p className="mono text-dim text-sm mb-12 max-w-md mx-auto leading-[1.6]">{steps[0].description}</p>
                <button
                  onClick={generateDemoId}
                  className="button button-primary px-10 py-5 text-sm"
                >
                  Initiate Sequence
                </button>
              </div>
            ) : step === 1 ? (
              <div className="animate-fade-in text-center max-w-xl mx-auto">
                <h2 className="font-serif text-3xl font-bold text-white mb-8">Identity Synthesized</h2>
                <div className="mb-10 p-6 rounded bg-black border border-[#222]">
                  <div className="mono text-xs text-dim uppercase tracking-widest mb-3">Your Temporary DID</div>
                  <div className="font-mono text-accent break-all text-lg font-bold">{demoId}</div>
                </div>
                <p className="mono text-dim text-sm leading-[1.6] mb-10">
                  Your identity has successfully anchored to the local testnet. You now have authorized access to the footprint database to view the fictional companies holding your data.
                </p>
                <button
                  onClick={() => setStep(2)}
                  className="button button-primary px-10 py-5 text-sm flex items-center justify-center gap-3 mx-auto"
                >
                  Analyze Footprint <ArrowRight size={18} />
                </button>
              </div>
            ) : step === 2 ? (
              <div className="animate-fade-in">
                <h2 className="font-serif text-3xl font-bold text-white mb-8 text-center">{steps[1].title}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                  {[
                    { name: "EuroBank 🏦", data: "KYC documents, transactions" },
                    { name: "HealthChain 🏥", data: "Medical records" },
                    { name: "ShopNow 🛒", data: "Orders, address" },
                    { name: "MusicStream 🎵", data: "Listening history" },
                  ].map((company, i) => (
                    <div key={i} className="p-4 rounded bg-black border border-[#222] hover:border-[#333] transition-colors">
                      <div className="font-serif font-bold text-white mb-1">{company.name}</div>
                      <div className="mono text-xs text-dim">{company.data}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setStep(3)}
                  className="button button-primary px-10 py-5 text-sm flex items-center justify-center gap-3 mx-auto"
                >
                  Inspect Interceptions <ArrowRight size={18} />
                </button>
              </div>
            ) : step === 3 ? (
              <div className="animate-fade-in">
                <h2 className="font-serif text-3xl font-bold text-white mb-8 text-center">{steps[2].title}</h2>
                <div className="space-y-4 mb-10 max-w-2xl mx-auto">
                  {[
                    { company: "EuroBank", action: "Accessed KYC documents", time: "2 hours ago" },
                    { company: "MusicStream", action: "Logged in", time: "1 hour ago" },
                    { company: "ShopNow", action: "Retrieved order history", time: "2 hours ago" },
                  ].map((access, i) => (
                    <div key={i} className="p-5 rounded bg-black border border-[#222] flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <div className="font-serif font-bold text-white mb-1">{access.company}</div>
                        <div className="mono text-xs text-dim">{access.action}</div>
                      </div>
                      <div className="mono text-[0.65rem] uppercase tracking-widest text-[#555]">{access.time}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setStep(4)}
                  className="button button-primary px-10 py-5 text-sm flex items-center justify-center gap-3 mx-auto"
                >
                  Execute Master Deletion <ArrowRight size={18} />
                </button>
              </div>
            ) : (
              <div className="text-center animate-fade-in relative z-10">
                <div className="w-24 h-24 rounded border border-accent/30 bg-[radial-gradient(ellipse_at_center,rgba(0,255,136,0.1),transparent)] flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(0,255,136,0.2)]">
                  <Check className="text-accent" size={40} />
                </div>
                <h2 className="font-serif text-[clamp(2rem,3vw,3rem)] font-bold text-white mb-6">Sequence Complete</h2>
                <p className="mono text-dim text-sm leading-[1.6] mb-12 max-w-xl mx-auto">
                  You've experienced the complete Oblivion Protocol flow. The simulated data deletion was processed with cryptographic proofs recorded on the local Midnight testnet.
                </p>

                {showConfetti && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden rounded">
                    {Array.from({ length: 50 }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-1.5 h-1.5 bg-accent rounded shadow-[0_0_10px_rgba(0,255,136,1)] animate-bounce"
                        style={{
                          left: Math.random() * 100 + "%",
                          top: Math.random() * 100 + "%",
                          animationDelay: Math.random() * 0.5 + "s",
                          animationDuration: (Math.random() * 1 + 1) + "s",
                        }}
                      />
                    ))}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => { setStep(0); setDemoId(""); }}
                    className="button button-primary px-10 py-4 text-sm"
                  >
                    Reset Simulation
                  </button>
                  <Link
                    href="/"
                    className="button button-secondary px-10 py-4 text-sm"
                  >
                    Return Home
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
