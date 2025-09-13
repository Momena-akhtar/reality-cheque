'use client';   
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '../context/AdminAuthContext';
import AdminSignInPopup from "../components/admin-signin";
import Logo from '../components/ui/logo';
import Theme from '../components/ui/theme';

export default function AdminPage() {
    const { admin, adminLoading } = useAdminAuth();
    const router = useRouter();

    useEffect(() => {
        if (!adminLoading && admin) {
            router.push('/admin/panel');
        }
    }, [admin, adminLoading, router]);

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

    if (admin) {
        return null;
    }

    return (
        <div>
        <div 
             className="fixed h-16 m-auto top-0 left-0 right-0 z-50 flex justify-between items-center p-4 border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 transition-all duration-300"
            >
                <Logo />
                <Theme />
            </div>
            <AdminSignInPopup onClose={() => {}} />
        </div>
    );
}