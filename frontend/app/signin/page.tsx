'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from "../context/AuthContext";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function SignInPage() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [signupStep, setSignupStep] = useState(1);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [agencyName, setAgencyName] = useState('');
    const [offer, setOffer] = useState('');
    const [caseStudies, setCaseStudies] = useState('');
    const [servicePricing, setServicePricing] = useState('');
    const [loading, setLoading] = useState(false);
    const { refreshUser } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isSignUp && signupStep === 1) {
            // Validate first step
            if (!username || !email || !password) {
                toast.error('Please fill in all required fields');
                return;
            }
            setSignupStep(2);
            return;
        }
        
        if (isSignUp && signupStep === 2) {
            // Validate second step
            if (!agencyName) {
                toast.error('Please provide your agency name');
                return;
            }
        }
        
        setLoading(true);
        try {
            let url = `${API_BASE}/auth/${isSignUp ? 'register' : 'login'}`;
            let body: any = isSignUp
                ? { 
                    username, 
                    email, 
                    password, 
                    role: 'user',
                    agencyName,
                    offer,
                    caseStudies,
                    servicePricing
                  }
                : { email, password, role: 'user' };
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                credentials: 'include',
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.message || 'Something went wrong');
            } else {
                toast.success(isSignUp ? 'Registration successful!' : 'Login successful!');
                // Refresh user data from backend to get complete user info
                await refreshUser();
                if (isSignUp) {
                    router.push('/upgrade');
                } else {
                    router.push('/');
                }
            }
        } catch (err) {
            toast.error('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="bg-background text-[var(--foreground)] border border-border rounded-lg p-8 w-full max-w-[600px] shadow-lg [&_input:-webkit-autofill]:bg-background [&_input:-webkit-autofill:hover]:bg-background [&_input:-webkit-autofill:focus]:bg-background [&_input:-webkit-autofill]:text-[var(--foreground)] [&_input:-webkit-autofill]:!transition-[background-color] [&_input:-webkit-autofill]:!duration-[5000s] [&_input:-webkit-autofill]:[text-fill-color:var(--foreground)] [&_input:-webkit-autofill]:[-webkit-text-fill-color:var(--foreground)]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
                    <Link href="/" className="text-gray-500 hover:text-gray-700 cursor-pointer">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </Link>
                </div>
                
                {/* Steps Navigation for Signup */}
                {isSignUp && (
                    <div className="flex items-center justify-center mb-6">
                        <div className="flex items-center space-x-4">
                            <div className={`flex items-center ${signupStep >= 1 ? 'text-foreground' : 'text-gray-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${signupStep >= 1 ? 'border-primary bg-primary text-white' : 'border-gray-300'}`}>
                                    1
                                </div>
                                <span className="ml-2 text-sm font-medium">Personal Info</span>
                            </div>
                            <div className={`w-8 h-0.5 ${signupStep >= 2 ? 'bg-background' : 'bg-gray-300'}`}></div>
                            <div className={`flex items-center ${signupStep >= 2 ? 'text-primary' : 'text-gray-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${signupStep >= 2 ? 'border-primary bg-primary text-white' : 'border-gray-300'}`}>
                                    2
                                </div>
                                <span className="ml-2 text-sm font-medium">Agency Info</span>
                            </div>
                        </div>
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Sign In Mode - Only Email and Password */}
                    {!isSignUp && (
                        <>
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
                        </>
                    )}
                    
                    {/* Sign Up Step 1 - Personal Info */}
                    {isSignUp && signupStep === 1 && (
                        <>
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium mb-1">Username</label>
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover"
                                    required
                                />
                            </div>
                            
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
                        </>
                    )}
                    
                    {/* Sign Up Step 2 - Agency Info Only */}
                    {isSignUp && signupStep === 2 && (
                        <>
                            <div>
                                <label htmlFor="agencyName" className="block text-sm font-medium mb-1">
                                    What is your agency's name?
                                </label>
                                <input
                                    type="text"
                                    id="agencyName"
                                    value={agencyName}
                                    onChange={(e) => setAgencyName(e.target.value)}
                                    placeholder="Enter your name if you don't have an agency"
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label htmlFor="offer" className="block text-sm font-medium mb-1">
                                    What is your offer?
                                </label>
                                <input
                                    type="text"
                                    id="offer"
                                    value={offer}
                                    onChange={(e) => setOffer(e.target.value)}
                                    placeholder="Only enter if you have an offer in place"
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover"
                                />
                            </div>
                            
                            <div>
                                <label htmlFor="caseStudies" className="block text-sm font-medium mb-1">
                                    List a few case studies and testimonials
                                </label>
                                <textarea
                                    id="caseStudies"
                                    value={caseStudies}
                                    onChange={(e) => setCaseStudies(e.target.value)}
                                    placeholder="Leave blank if you don't have any"
                                    rows={3}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover resize-none"
                                />
                            </div>
                            
                            <div>
                                <label htmlFor="servicePricing" className="block text-sm font-medium mb-1">
                                    What are your services priced at?
                                </label>
                                <input
                                    type="text"
                                    id="servicePricing"
                                    value={servicePricing}
                                    onChange={(e) => setServicePricing(e.target.value)}
                                    placeholder="Leave blank if you are new"
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover"
                                />
                            </div>
                        </>
                    )}
                    <div className="flex space-x-3">
                        {isSignUp && signupStep === 2 && (
                            <button 
                                type="button" 
                                onClick={() => setSignupStep(1)}
                                className="flex-1 cursor-pointer mx-auto border border-border text-foreground py-2 rounded-lg hover:bg-primary-hover transition-colors"
                            >
                                Back
                            </button>
                        )}
                        <button 
                            type="submit" 
                            disabled={loading} 
                            className={`cursor-pointer mx-auto border border-border text-foreground py-2 rounded-lg hover:bg-primary-hover transition-colors ${isSignUp && signupStep === 2 ? 'flex-1' : 'w-full'}`}
                        >
                            {loading 
                                ? (isSignUp ? 'Signing Up...' : 'Signing In...') 
                                : (isSignUp 
                                    ? (signupStep === 1 ? 'Next' : 'Sign Up') 
                                    : 'Sign In'
                                  )
                            }
                        </button>
                    </div>
                </form>

                <div className="mt-4 text-center text-sm">
                    <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary-text-faded cursor-pointer hover:text-primary-text-hover">
                        {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                    </button>
                </div>
            </div>
        </div>
    );
}
