import Link from "next/link";
import Image from "next/image";
import SignIn from "./ui/signin";
import Theme from "./ui/theme";

export default function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-4 border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      {/* Logo and Brand */}
      <Link href="/" className="flex items-center space-x-2">
        <Image src="/vercel.svg" alt="MiniBots Logo" width={18} height={18} />
        <span className="text-xl font-bold">MiniBots</span>
      </Link>

      {/* Main Navigation */}
      <div className="hidden md:flex items-center space-x-6">
        <Link href="/marketplace" className="hover:text-primary-text-hover transition-colors">
          Marketplace
        </Link>
        <div className="relative group">
          <button className="flex items-center cursor-pointer space-x-1 hover:text-primary-text-hover transition-colors">
            <span>Categories</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className="absolute top-full left-0 mt-2 w-48 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border/40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
            <div className="py-2">
              <Link href="/bots/sales-crm" className="block px-4 py-2 hover:bg-primary/10 transition-colors">
                Sales & CRM
              </Link>
              <Link href="/bots/marketing" className="block px-4 py-2 hover:bg-primary/10 transition-colors">
                Marketing
              </Link>
              <Link href="/bots/customer-support" className="block px-4 py-2 hover:bg-primary/10 transition-colors">
                Customer Support
              </Link>
              <Link href="/bots/hr" className="block px-4 py-2 hover:bg-primary/10 transition-colors">
                HR & Recruitment
              </Link>
              <Link href="/bots/finance" className="block px-4 py-2 hover:bg-primary/10 transition-colors">
                Finance & Accounting
              </Link>
              <Link href="/bots/development" className="block px-4 py-2 hover:bg-primary/10 transition-colors">
                Development
              </Link>
            </div>
          </div>
        </div>
        <Link href="/create" className="hover:text-primary-text-hover transition-colors">
          Create Bot
        </Link>
        <Link href="/community" className="hover:text-primary-text-hover transition-colors">
          Community
        </Link>
      </div>

      {/* User Actions */}
      <div className="flex items-center space-x-4">
        <SignIn />
        <Theme />
      </div>
    </nav>
  );
}