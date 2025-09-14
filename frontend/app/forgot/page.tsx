"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Theme from "../components/ui/theme";
import Logo from "../components/ui/logo";
import { ArrowLeft, Mail, Shield, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
export default function ForgotPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{[key: string]: string}>({});
    
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
    const router = useRouter();    
    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) return;
        
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent, step: number) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (step === 1) {
                handleSendOtp();
            } else if (step === 2) {
                handleVerifyOtp();
            } else if (step === 3) {
                handleResetPassword();
            }
        }
    };

    // Step 1: Send OTP
    const handleSendOtp = async () => {
        if (!email) {
            setErrors({ email: "Email is required" });
            return;
        }
        
        if (!/\S+@\S+\.\S+/.test(email)) {
            setErrors({ email: "Please enter a valid email address" });
            return;
        }

        setIsLoading(true);
        setErrors({});
        
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            setCurrentStep(2);
            toast.success("OTP sent successfully! Please check your email.");
        }, 1500);
    };

    // Step 2: Verify OTP
    const handleVerifyOtp = async () => {
        const otpString = otp.join("");
        if (otpString.length !== 6) {
            setErrors({ otp: "Please enter the complete 6-digit OTP" });
            return;
        }

        setIsLoading(true);
        setErrors({});
        
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            setCurrentStep(3);
            toast.success("OTP verified successfully! Please reset your password.");
        }, 1500);
    };

    // Step 3: Reset Password
    const handleResetPassword = async () => {
        if (!newPassword) {
            setErrors({ newPassword: "New password is required" });
            return;
        }
        
        if (newPassword.length < 8) {
            setErrors({ newPassword: "Password must be at least 8 characters long" });
            return;
        }
        
        if (newPassword !== confirmPassword) {
            setErrors({ confirmPassword: "Passwords do not match" });
            return;
        }

        setIsLoading(true);
        setErrors({});
        
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            toast.success("Password reset successful! Please sign in with your new password.");
            router.push("/signin");
        }, 1500);
    };

    const goBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            setErrors({});
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 pt-20">
            {/* Header */}
            <div className="fixed h-16 m-auto top-0 left-0 right-0 z-50 flex justify-between items-center p-4 border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
                <Logo />
                <Theme />
            </div>

            {/* Main Content */}
            <div className="bg-background text-foreground border border-border rounded-lg p-8 shadow-lg w-full max-w-[500px] [&_input:-webkit-autofill]:bg-background [&_input:-webkit-autofill:hover]:bg-background [&_input:-webkit-autofill:focus]:bg-background [&_input:-webkit-autofill]:text-foreground [&_input:-webkit-autofill]:!transition-[background-color] [&_input:-webkit-autofill]:!duration-[5000s] [&_input:-webkit-autofill]:[text-fill-color:var(--foreground)] [&_input:-webkit-autofill]:[-webkit-text-fill-color:var(--foreground)]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Reset Password</h2>
                    <Link href="/signin" className="text-gray-500 hover:text-gray-700 cursor-pointer">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </Link>
                </div>
                <div className="mb-6 text-[#757575] text-sm">
                    <p>We'll help you get back to your account. Enter your email to reset your password.</p>
                </div>

                {/* Steps Navigation */}
                <div className="flex items-center justify-center mb-6">
                    <div className="flex items-center space-x-4">
                        <div className={`flex items-center ${currentStep >= 1 ? 'text-foreground' : 'text-muted'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 1 ? 'border-primary bg-primary text-foreground' : 'border-gray-300'}`}>
                                <Mail className="w-4 h-4" />
                            </div>
                            <span className="ml-2 text-sm font-medium">Email</span>
                        </div>
                        <div className={`w-8 h-0.5 ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
                        <div className={`flex items-center ${currentStep >= 2 ? 'text-foreground' : 'text-muted'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 2 ? 'border-primary bg-primary text-foreground' : 'border-gray-300'}`}>
                                <Shield className="w-4 h-4" />
                            </div>
                            <span className="ml-2 text-sm font-medium">Verify</span>
                        </div>
                        <div className={`w-8 h-0.5 ${currentStep >= 3 ? 'bg-primary' : 'bg-muted'}`}></div>
                        <div className={`flex items-center ${currentStep >= 3 ? 'text-foreground' : 'text-muted'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 3 ? 'border-primary bg-primary text-foreground' : 'border-gray-300'}`}>
                                <KeyRound className="w-4 h-4" />
                            </div>
                            <span className="ml-2 text-sm font-medium">Reset</span>
                        </div>
                    </div>
                </div>

                {/* Step 1: Email Input */}
                {currentStep === 1 && (
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyPress={(e) => handleKeyPress(e, 1)}
                                className={`w-full px-3 py-2 border border-border rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover ${errors.email ? 'border-red-500' : ''}`}
                                placeholder="Enter your email address"
                                required
                            />
                            {errors.email && (
                                <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={isLoading}
                            className="w-full bg-primary cursor-pointer text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Sending..." : "Send Reset OTP"}
                        </button>
                    </div>
                )}

                {/* Step 2: OTP Verification */}
                {currentStep === 2 && (
                    <div className="space-y-4">
                        <div className="text-center">
                            <p className="text-sm text-[#757575] mb-2">
                                We've sent a 6-digit code to
                            </p>
                            <p className="font-medium text-blue-500">{email}</p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1 text-[#757575]">Enter OTP</label>
                            <div className="flex justify-center gap-2">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => { otpRefs.current[index] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        onKeyPress={(e) => handleKeyPress(e, 2)}
                                        className={`w-12 h-12 text-center text-lg font-semibold border border-border rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover ${
                                            errors.otp ? "border-red-500" : ""
                                        }`}
                                    />
                                ))}
                            </div>
                            {errors.otp && (
                                <p className="text-sm text-red-500 text-center mt-1">{errors.otp}</p>
                            )}
                        </div>
                        
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={goBack}
                                className="flex-1 border border-border cursor-pointer hover:bg-accent hover:text-accent-foreground px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={handleVerifyOtp}
                                disabled={isLoading}
                                className="flex-1 bg-primary cursor-pointer text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "Verifying..." : "Verify OTP"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Password Reset */}
                {currentStep === 3 && (
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium mb-1">New Password</label>
                            <input
                                type="password"
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                onKeyPress={(e) => handleKeyPress(e, 3)}
                                className={`w-full px-3 py-2 border border-border rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover ${errors.newPassword ? 'border-red-500' : ''}`}
                                placeholder="Enter new password"
                                required
                            />
                            {errors.newPassword && (
                                <p className="text-sm text-red-500 mt-1">{errors.newPassword}</p>
                            )}
                        </div>
                        
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">Confirm New Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                onKeyPress={(e) => handleKeyPress(e, 3)}
                                className={`w-full px-3 py-2 border border-border rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover ${errors.confirmPassword ? 'border-red-500' : ''}`}
                                placeholder="Confirm new password"
                                required
                            />
                            {errors.confirmPassword && (
                                <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>
                            )}
                        </div>
                        
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={goBack}
                                className="flex-1 border border-border cursor-pointer hover:bg-accent hover:text-accent-foreground px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={handleResetPassword}
                                disabled={isLoading}
                                className="flex-1 bg-primary cursor-pointer text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "Resetting..." : "Reset Password"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}