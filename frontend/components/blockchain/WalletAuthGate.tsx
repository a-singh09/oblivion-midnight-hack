"use client";

import { useWallet } from "@/contexts/WalletContext";
import { Wallet, Shield, AlertCircle } from "lucide-react";
import Link from "next/link";
import { WalletConnectButton } from "./WalletConnectButton";

export function WalletAuthGate() {
  const { isConnected, isConnecting, error } = useWallet();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="text-primary" size={32} />
          </div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">
            Wallet Connection Required
          </h1>
          <p className="text-muted-foreground">
            Please connect your Lace wallet to access the dashboard
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="text-destructive mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive mb-1">
                Connection Error
              </p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <Wallet className="text-primary" size={24} />
              <div className="flex-1">
                <p className="font-medium text-foreground">Lace Wallet</p>
                <p className="text-sm text-muted-foreground">
                  Secure blockchain wallet
                </p>
              </div>
            </div>

            <div className="text-center">
              <WalletConnectButton />
            </div>

            <div className="pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground mb-4">
                Don't have a Lace wallet?
              </p>
              <a
                href="https://www.lace.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                Download Lace Wallet →
              </a>
            </div>

            <div className="pt-4 border-t border-border">
              <Link
                href="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Your privacy is protected with zero-knowledge proofs
          </p>
        </div>
      </div>
    </div>
  );
}
