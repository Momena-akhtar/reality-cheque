'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useAdminAuth } from "../context/AdminAuthContext";
import { ShieldIcon } from 'lucide-react';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function AdminSignInPopup({ onClose }: { onClose: () => void }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { setAdmin } = useAdminAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.message || 'Invalid admin credentials');
            } else {
                toast.success('Admin login successful!');
                localStorage.setItem('adminToken', data.token);
                setAdmin(data.admin);
            }
        } catch (err) {
            toast.error('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center  z-[100]">
            <div className="bg-background text-foreground border border-border rounded-lg p-8 w-[400px] shadow-lg [&_input:-webkit-autofill]:bg-background [&_input:-webkit-autofill:hover]:bg-background [&_input:-webkit-autofill:focus]:bg-background [&_input:-webkit-autofill]:text-[var(--foreground)] [&_input:-webkit-autofill]:!transition-[background-color] [&_input:-webkit-autofill]:!duration-[5000s] [&_input:-webkit-autofill]:[text-fill-color:var(--foreground)] [&_input:-webkit-autofill]:[-webkit-text-fill-color:var(--foreground)]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Admin Login</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 cursor-pointer">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover"
                            required
                        />
                    </div>
                    <button type="submit" disabled={loading} className="w-full cursor-pointer mx-auto border border-border text-foreground py-2 rounded-lg hover:bg-primary-hover transition-colors">
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-4 text-center text-sm">
                    <div className="flex justify-center">
                        <div className='flex items-center gap-1'>
                            <ShieldIcon className='w-4 h-4'/>
                            <p className="text-center text-primary-text-faded">
                                Admin access only
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
