"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Theme from "../components/ui/theme";
import Logo from "../components/ui/logo";
import { ArrowLeft, Mail, Shield, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "../components/ui/button";
export default function ForgotPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{[key: string]: string}>({});
    const [resendCooldown, setResendCooldown] = useState(0);
    
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
        
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/email/send-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (data.success) {
                setCurrentStep(2);
                toast.success("OTP sent successfully! Please check your email.");
            } else {
                setErrors({ email: data.message || "Failed to send OTP" });
                toast.error(data.message || "Failed to send OTP");
            }
        } catch (error) {
            console.error('Error sending OTP:', error);
            setErrors({ email: "Network error. Please try again." });
            toast.error("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
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
        
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/email/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, otp: otpString }),
            });

            const data = await response.json();

            if (data.success) {
                setCurrentStep(3);
                toast.success("OTP verified successfully! Please reset your password.");
            } else {
                setErrors({ otp: data.message || "Invalid or expired OTP" });
                toast.error(data.message || "Invalid or expired OTP");
            }
        } catch (error) {
            console.error('Error verifying OTP:', error);
            setErrors({ otp: "Network error. Please try again." });
            toast.error("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Resend OTP functionality
    const handleResendOtp = async () => {
        if (resendCooldown > 0) return;
        
        setIsLoading(true);
        setErrors({});
        
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/email/send-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success("OTP resent successfully!");
                setResendCooldown(60); // 60 seconds cooldown
                const interval = setInterval(() => {
                    setResendCooldown((prev) => {
                        if (prev <= 1) {
                            clearInterval(interval);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            } else {
                toast.error(data.message || "Failed to resend OTP");
            }
        } catch (error) {
            console.error('Error resending OTP:', error);
            toast.error("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
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
        
        try {
            const otpString = otp.join("");
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email, 
                    otp: otpString, 
                    newPassword 
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Password reset successful! Please sign in with your new password.");
                router.push("/signin");
            } else {
                setErrors({ newPassword: data.message || "Failed to reset password" });
                toast.error(data.message || "Failed to reset password");
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            setErrors({ newPassword: "Network error. Please try again." });
            toast.error("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const goBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            setErrors({});
            // Clear OTP when going back from step 3 to step 2
            if (currentStep === 3) {
                setOtp(["", "", "", "", "", ""]);
            }
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
                                <Mail className={`w-4 h-4 ${currentStep >= 1 ? 'text-background' : 'text-muted-foreground'}`} />
                            </div>
                            <span className="ml-2 text-sm font-medium">Email</span>
                        </div>
                        <div className={`w-8 h-0.5 ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
                        <div className={`flex items-center ${currentStep >= 2 ? 'text-foreground' : 'text-muted'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 2 ? 'border-primary bg-primary text-foreground' : 'border-gray-300'}`}>
                                <Shield className={`w-4 h-4 ${currentStep >= 2 ? 'text-background' : 'text-muted-foreground'}`} />
                            </div>
                            <span className="ml-2 text-sm font-medium">Verify</span>
                        </div>
                        <div className={`w-8 h-0.5 ${currentStep >= 3 ? 'bg-primary' : 'bg-muted'}`}></div>
                        <div className={`flex items-center ${currentStep >= 3 ? 'text-foreground' : 'text-muted'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 3 ? 'border-primary bg-primary text-foreground' : 'border-gray-300'}`}>
                                <KeyRound className={`w-4 h-4 ${currentStep >= 3 ? 'text-background' : 'text-muted-foreground'}`} />
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
                        <Button
                            type="button"
                            className="w-full"
                            onClick={handleSendOtp}
                            disabled={isLoading}
                            >
                            {isLoading ? "Sending..." : "Send Reset OTP"}
                        </Button>
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
                        
                        <div className="text-center">
                            <Button
                                type="button"
                                onClick={handleResendOtp}
                                disabled={resendCooldown > 0 || isLoading}
                                className="w-full"
>
                                {resendCooldown > 0 
                                    ? `Resend OTP in ${resendCooldown}s` 
                                    : "Didn't receive the code? Resend OTP"
                                }
                            </Button>
                        </div>
                        
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={goBack}
                                className="w-full"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                            <Button
                                type="button"
                                onClick={handleVerifyOtp}
                                disabled={isLoading}
                                className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "Verifying..." : "Verify OTP"}
                            </Button>
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
                            <Button
                                variant="outline"
                                type="button"
                                onClick={goBack}
                                className="w-full"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                            <Button
                                type="button"
                                onClick={handleResetPassword}
                                disabled={isLoading}
                                className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "Resetting..." : "Reset Password"}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}