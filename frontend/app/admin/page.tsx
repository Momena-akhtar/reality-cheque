'use client';   
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '../context/AdminAuthContext';
import AdminSignInPopup from "../components/admin-signin";

export default function AdminPage() {
    const { admin, adminLoading } = useAdminAuth();
    const router = useRouter();

    useEffect(() => {
        // If admin is logged in, redirect to panel
        if (!adminLoading && admin) {
            router.push('/admin/panel');
        }
    }, [admin, adminLoading, router]);

    // Show loading while checking authentication
    if (adminLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
                    <p className="text-primary-text-faded">Loading...</p>
                </div>
            </div>
        );
    }

    // Show admin signin popup if not logged in
    return (
        <div>
            <AdminSignInPopup onClose={() => {}} />
        </div>
    );
}