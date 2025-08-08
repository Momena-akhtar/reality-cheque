"use client";   
import Link from "next/link";
export default function Footer() {
 
    return (
        <footer className="mt-20 w-full">
            <hr className="border-border w-full" />
            <div className="text-center py-6">
                <p className="text-sm text-primary-text-faded">
                    &copy; {new Date().getFullYear()} Reality Cheque. All rights reserved.
                </p>
            </div>
        </footer>
    );
}