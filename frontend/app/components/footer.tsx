"use client";   
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
export default function Footer() {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const logo = mounted && theme === "dark" ? (
        <Image src="/dark.svg" alt="MiniBots Logo" width={18} height={18} key="dark-logo" />
    ) : (
        <Image src="/light.png" alt="MiniBots Logo" width={18} height={18} key="light-logo" />
    );

    return (
        <footer className="mt-20 container mx-auto px-4">
            <hr className="border-border w-full" />

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 py-12">
                <div className="md:col-span-1">
                    <div className="flex items-center gap-2 mb-5">
                        <Link href="/" className="flex items-center space-x-2">
                            {mounted ? logo : <div style={{ width: 18, height: 18 }} />}
                            <span className="text-xl font-bold">MiniBots</span>
                        </Link>
                    </div>
                    <p className="text-sm text-primary-text-faded">
                        Empowering your digital workflow with intelligent automation solutions.
                    </p>
                </div>

                <div className="md:col-span-1">
                    <h3 className="font-semibold mb-3">Products</h3>
                    <ul className="space-y-2 text-primary-text-faded">
                        <li><Link href="/products/automation" className="text-sm text-muted-foreground hover:text-foreground">Automation</Link></li>
                        <li><Link href="/products/integrations" className="text-sm text-muted-foreground hover:text-foreground">Integrations</Link></li>
                        <li><Link href="/products/analytics" className="text-sm text-muted-foreground hover:text-foreground">Analytics</Link></li>
                    </ul>
                </div>

                <div className="md:col-span-1">
                    <h3 className="font-semibold mb-3">Resources</h3>
                    <ul className="space-y-2 text-primary-text-faded">
                        <li><Link href="/resources/documentation" className="text-sm text-muted-foreground hover:text-foreground">Documentation</Link></li>
                        <li><Link href="/resources/guides" className="text-sm text-muted-foreground hover:text-foreground">Guides</Link></li>
                        <li><Link href="/resources/tutorials" className="text-sm text-muted-foreground hover:text-foreground">Tutorials</Link></li>
                    </ul>
                </div>

                <div className="md:col-span-1">
                    <h3 className="font-semibold mb-3">Company</h3>
                    <ul className="space-y-2 text-primary-text-faded">
                        <li><Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">About</Link></li>
                        <li><Link href="/careers" className="text-sm text-muted-foreground hover:text-foreground">Careers</Link></li>
                        <li><Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">Blog</Link></li>
                    </ul>
                </div>

                <div className="md:col-span-1">
                    <h3 className="font-semibold mb-3">Contact</h3>
                    <ul className="space-y-2 text-primary-text-faded">
                        <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">Contact Us</Link></li>
                        <li><Link href="/support" className="text-sm text-muted-foreground hover:text-foreground">Support</Link></li>
                        <li><Link href="/sales" className="text-sm text-muted-foreground hover:text-foreground">Sales</Link></li>
                    </ul>
                </div>
            </div>

            <hr className="border-border w-full" />

            <div className="py-6 flex flex-col md:flex-row justify-between items-center">
                <p className="text-sm text-primary-text-faded">
                    &copy; {new Date().getFullYear()} MiniBots. All rights reserved.
                </p>
                <div className="flex gap-4 mt-4 md:mt-0">
                    <Link href="/privacy" className="text-sm text-primary-text-faded hover:text-foreground">Privacy Policy</Link>
                    <Link href="/terms" className="text-sm text-primary-text-faded hover:text-foreground">Terms of Service</Link>
                </div>
            </div>
        </footer>
    );
}