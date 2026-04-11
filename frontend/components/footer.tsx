import Link from "next/link";
import { Hexagon } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[#1a1a1a] py-16 pb-8 bg-black">
      <div className="container flex flex-wrap justify-between gap-8 items-start">
        <div className="max-w-[300px]">
          <div className="font-serif text-[1.2rem] font-bold tracking-[1px] mb-4 flex items-center gap-2">
            <Hexagon size={24} className="text-accent" strokeWidth={1.5} />
            OBLIVION
          </div>
          <p className="text-dim mono text-[0.8rem] leading-[1.6]">
            Cryptographic, independently verifiable proof that personal data has been securely and permanently deleted.
          </p>
        </div>

        <div className="flex gap-16 flex-col sm:flex-row mt-8 sm:mt-0">
          <div>
            <h4 className="mono text-dim text-[0.8rem] tracking-[1px] mb-4">PROTOCOL</h4>
            <ul className="list-none p-0 flex flex-col gap-2">
              <li>
                <Link href="/how-it-works" className="text-[#aaa] no-underline text-[0.9rem] hover:text-white transition-colors">How It Works</Link>
              </li>
              <li>
                <Link href="/for-companies" className="text-[#aaa] no-underline text-[0.9rem] hover:text-white transition-colors">For Companies</Link>
              </li>
              <li>
                <a href="#" className="text-[#aaa] no-underline text-[0.9rem] hover:text-white transition-colors">SDK Reference</a>
              </li>
              <li>
                <a href="https://github.com/a-singh09/oblivian-midnight-hack" target="_blank" rel="noopener noreferrer" className="text-[#aaa] no-underline text-[0.9rem] hover:text-white transition-colors">GitHub</a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mono text-dim text-[0.8rem] tracking-[1px] mb-4">NETWORK</h4>
            <ul className="list-none p-0 flex flex-col gap-2">
              <li>
                <a href="#" className="text-[#aaa] no-underline text-[0.9rem] hover:text-white transition-colors">Explorer (Testnet)</a>
              </li>
              <li>
                <a href="https://midnight.network" target="_blank" rel="noopener noreferrer" className="text-[#aaa] no-underline text-[0.9rem] hover:text-white transition-colors">Midnight Network</a>
              </li>
              <li>
                <a href="#" className="text-[#aaa] no-underline text-[0.9rem] hover:text-white transition-colors">Node Status</a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="container mt-16 pt-8 border-t border-[#111] flex justify-between flex-wrap gap-4">
        <p className="text-dim mono text-[0.8rem]">&copy; {new Date().getFullYear()} Oblivion Protocol. MIT License.</p>
        <p className="text-dim mono text-[0.8rem]">Built on Midnight Network. Powered by ZK.</p>
      </div>
    </footer>
  );
}
