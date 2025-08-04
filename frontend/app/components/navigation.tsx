"use client";
import SignInButton from "./ui/signin-button";
import Theme from "./ui/theme";
import Logo from "./ui/logo";
import { useAuth } from "../context/AuthContext";
import { SidebarTrigger, useSidebar } from "./ui/sidebar";
import { useRouter } from "next/navigation";

export default function Navigation() {
  const { user, loading } = useAuth();
  const { state } = useSidebar();
  const router = useRouter();

  return (
    <>
      <nav 
        className="fixed h-16 m-auto top-0 left-0 right-0 z-50 flex justify-between items-center p-4 border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 transition-all duration-300"
      >
        {/* Logo and Brand */}
        <div className="flex items-center space-x-4">
        <SidebarTrigger className="-ml-1" />
        <Logo />
        </div>

        {/* Main Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <button 
            onClick={() => {
              document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-primary-text-hover transition-colors cursor-pointer"
          >
            Home
          </button>
          <button 
            onClick={() => {
              document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-primary-text-hover transition-colors cursor-pointer"
          >
            Explore
          </button>
          <button 
            onClick={() => {
              document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-primary-text-hover transition-colors cursor-pointer"
          >
            Contact
          </button>
        </div>

        {/* User Actions */}
        <div className="flex items-center space-x-4">
          <SignInButton onSignInClick={() => router.push('/signin')} user={user} loading={loading} />
          <Theme />
        </div>  
      </nav>
    </>
  );
}