"use client";

import { User, Building2, Target, FileText, DollarSign } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

export default function UserIcon() {
    const { user } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const hasAgencyInfo = user && (
        user.agencyName || 
        user.offer || 
        user.caseStudies || 
        user.servicePricing
    );

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="px-2 py-2 text-sm border cursor-pointer border-border text-foreground rounded-xl hover:bg-primary-hover transition-colors"
                  title="User Profile"
            >
                <User className="w-4 h-4" />
            </button>
            
            {showDropdown && (
                <div className="absolute top-full right-0 mt-2 bg-background border border-border rounded-lg shadow-lg p-4 w-80 z-50">
                    <h3 className="text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        User Profile
                    </h3>
                    
                    <div className="space-y-3">
                        {/* Basic Info */}
                        <div className="border-b border-border/30 pb-3">
                            <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                                Account Info
                            </h4>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">
                                    <span className="font-medium">Username:</span> {user?.username || 'N/A'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    <span className="font-medium">Email:</span> {user?.email || 'N/A'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    <span className="font-medium">Plan:</span> {user?.plan || 'free'}
                                </p>
                            </div>
                        </div>

                        {/* Agency Information */}
                        {hasAgencyInfo && (
                            <div className="space-y-3">
                                {user?.agencyName && (
                                    <div className="border-b border-border/30 pb-3">
                                        <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                                            <Building2 className="h-3 w-3 text-blue-500" />
                                            Agency Name
                                        </h4>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {user.agencyName}
                                        </p>
                                    </div>
                                )}

                                {user?.offer && (
                                    <div className="border-b border-border/30 pb-3">
                                        <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                                            <Target className="h-3 w-3 text-green-500" />
                                            Offer
                                        </h4>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {user.offer}
                                        </p>
                                    </div>
                                )}

                                {user?.caseStudies && (
                                    <div className="border-b border-border/30 pb-3">
                                        <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                                            <FileText className="h-3 w-3 text-purple-500" />
                                            Case Studies
                                        </h4>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {user.caseStudies}
                                        </p>
                                    </div>
                                )}

                                {user?.servicePricing && (
                                    <div className="border-b border-border/30 pb-3">
                                        <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                                            <DollarSign className="h-3 w-3 text-yellow-500" />
                                            Service Pricing
                                        </h4>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {user.servicePricing}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* No Agency Info Message */}
                        {!hasAgencyInfo && (
                            <div className="text-center py-4">
                                <p className="text-xs text-muted-foreground">
                                    No agency information available
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Update your profile to add agency details
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}