"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Hexagon } from "lucide-react";
import { WalletConnectButton } from "@/components/blockchain/WalletConnectButton";
import { useWallet } from "@/contexts/WalletContext";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const { isConnected } = useWallet();

  const navLinks = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Register Data", href: "/company-registration" },
    { name: "Demo", href: "/presentation" },
    { name: "For Companies", href: "/for-companies" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 p-6 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-[5px] border-b border-white/5">
      <div className="container flex justify-between items-center px-0">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <Hexagon size={28} className="text-accent" strokeWidth={1.5} />
          <span className="font-serif text-xl font-bold tracking-[1px] text-foreground">
            OBLIVION
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <div className="flex gap-8 items-center">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="font-mono text-[0.85rem] uppercase tracking-[1px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
          
          <div className="flex items-center gap-4 ml-4">
            <WalletConnectButton />
            {isConnected && (
              <Link
                href="/dashboard"
                className="font-mono border border-accent text-accent px-4 py-2 rounded-[4px] text-[0.8rem] uppercase cursor-pointer hover:bg-accent/10 transition-all"
              >
                Launch App
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-foreground p-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-md border-b border-white/5 py-6 px-6 flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="font-mono text-sm uppercase tracking-[1px] text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-4 pt-4 border-t border-white/10">
            <WalletConnectButton />
            {isConnected && (
              <Link
                href="/dashboard"
                className="font-mono border border-accent text-accent px-4 py-3 rounded-[4px] text-sm uppercase text-center hover:bg-accent/10 transition-all"
                onClick={() => setIsOpen(false)}
              >
                Launch App
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
