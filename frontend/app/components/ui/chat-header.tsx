"use client"
import Theme from "./theme";
import Logo from "./logo";
import { MessageSquare, Star, Building2, Users, Target, TrendingUp, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

interface Feature {
  _id: string;
  name: string;
  description: string;
  prompt: string;
  order: number;
  isOptional: boolean;
}

interface ChatHeaderProps {
  onShowHistory?: () => void;
  hasHistory?: boolean;
  modelFeatures?: Feature[];
}

export default function ChatHeader({ onShowHistory, hasHistory = false, modelFeatures = [] }: ChatHeaderProps) {
  const [showFeatures, setShowFeatures] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userInfoRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFeatures(false);
      }
      if (userInfoRef.current && !userInfoRef.current.contains(event.target as Node)) {
        setShowUserInfo(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const hasFeatures = modelFeatures && modelFeatures.length > 0;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 py-2">
      <Logo />
      <div className="flex justify-end gap-2">
        {/* User & Agency Info */}
        {user && (
          <div className="relative" ref={userInfoRef}>
            <button
              onClick={() => setShowUserInfo(!showUserInfo)}
              className="px-2 py-2 text-sm border cursor-pointer border-border text-foreground rounded-full hover:bg-primary-hover transition-colors"
              title="User & Agency Info"
            >
              <Building2 className="h-4 w-4" />
            </button>
            
            {showUserInfo && (
              <div className="absolute top-full right-0 mt-2 bg-background border border-border rounded-lg shadow-lg p-4 w-96 z-50 max-h-96 overflow-y-auto scrollbar-thin">
                <h3 className="text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  User & Agency Information
                </h3>
                
                {/* Account Info Section */}
                <div className="border-b border-border/30 pb-3 mb-3">
                  <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <User className="h-3 w-3 text-primary" />
                    Account Info
                  </h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">Username:</span>
                      <span className="text-muted-foreground">{user.username || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">Email:</span>
                      <span className="text-muted-foreground">{user.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">Tier:</span>
                      <span className="text-muted-foreground">{user.tier || 'tier1'}</span>
                    </div>
                  </div>
                </div>
                
                {/* Agency Information Section */}
                <div className="space-y-3 text-xs">
                  {user.userType && (
                    <div className="flex items-start gap-2">
                      <div className="h-3 w-3 bg-blue-500 rounded-full mt-0.5 flex-shrink-0"></div>
                      <div>
                        <span className="font-medium text-foreground">User Type:</span>
                        <span className="text-muted-foreground ml-1 capitalize">{user.userType}</span>
                      </div>
                    </div>
                  )}
                  
                  {user.usageType && (
                    <div className="flex items-start gap-2">
                      <div className="h-3 w-3 bg-green-500 rounded-full mt-0.5 flex-shrink-0"></div>
                      <div>
                        <span className="font-medium text-foreground">Usage:</span>
                        <span className="text-muted-foreground ml-1 capitalize">{user.usageType === 'personal' ? 'Personal/Team' : 'For Clients'}</span>
                      </div>
                    </div>
                  )}
                  
                  {user.agencyName && (
                    <div className="flex items-start gap-2">
                      <Building2 className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-foreground">{user.userType === 'agency' ? 'Agency:' : 'Business:'}</span>
                        <span className="text-muted-foreground ml-1">{user.agencyName}</span>
                      </div>
                    </div>
                  )}
                  
                  {user.services && user.services.length > 0 && (
                    <div className="flex items-start gap-2">
                      <div className="h-3 w-3 bg-green-500 rounded-full mt-0.5 flex-shrink-0"></div>
                      <div>
                        <span className="font-medium text-foreground">Services:</span>
                        <span className="text-muted-foreground ml-1">{user.services.map(s => s.name).join(', ')}</span>
                      </div>
                    </div>
                  )}
                  
                  {user.website && (
                    <div className="flex items-start gap-2">
                      <div className="h-3 w-3 bg-purple-500 rounded-full mt-0.5 flex-shrink-0"></div>
                      <div>
                        <span className="font-medium text-foreground">Website:</span>
                        <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline ml-1">{user.website}</a>
                      </div>
                    </div>
                  )}
                  
                  {user.clientsServed && (
                    <div className="flex items-start gap-2">
                      <Users className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-foreground">Clients Served:</span>
                        <span className="text-muted-foreground ml-1">{user.clientsServed}</span>
                      </div>
                    </div>
                  )}
                  
                  {user.idealClientProfile && (
                    <div className="flex items-start gap-2">
                      <Target className="h-3 w-3 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-foreground">Ideal Client Profile:</span>
                        <span className="text-muted-foreground ml-1">{user.idealClientProfile.substring(0, 50)}...</span>
                      </div>
                    </div>
                  )}
                  
                  {user.monthlyRevenue && (
                    <div className="flex items-start gap-2">
                      <TrendingUp className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-foreground">Monthly Revenue:</span>
                        <span className="text-muted-foreground ml-1">${user.monthlyRevenue.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  
                  {user.leadSources && user.leadSources.length > 0 && (
                    <div className="flex items-start gap-2">
                      <div className="h-3 w-3 bg-blue-500 rounded-full mt-0.5 flex-shrink-0"></div>
                      <div>
                        <span className="font-medium text-foreground">Lead Sources:</span>
                        <span className="text-muted-foreground ml-1">{user.leadSources.join(', ')}</span>
                      </div>
                    </div>
                  )}
                  
                  {user.pricingPackages && user.pricingPackages.length > 0 && (
                    <div className="flex items-start gap-2">
                      <div className="h-3 w-3 bg-yellow-500 rounded-full mt-0.5 flex-shrink-0"></div>
                      <div>
                        <span className="font-medium text-foreground">Pricing Packages:</span>
                        <span className="text-muted-foreground ml-1">{user.pricingPackages.map(p => `${p.name}: ${p.price}`).join(', ')}</span>
                      </div>
                    </div>
                  )}
                  
                  {user.currentOffers && user.currentOffers.length > 0 && (
                    <div className="flex items-start gap-2">
                      <div className="h-3 w-3 bg-indigo-500 rounded-full mt-0.5 flex-shrink-0"></div>
                      <div>
                        <span className="font-medium text-foreground">Current Offers:</span>
                        <span className="text-muted-foreground ml-1">{user.currentOffers.map(o => o.name).join(', ')}</span>
                      </div>
                    </div>
                  )}
                  
                  {user.stepByStepProcess && user.stepByStepProcess.length > 0 && (
                    <div className="flex items-start gap-2">
                      <div className="h-3 w-3 bg-purple-500 rounded-full mt-0.5 flex-shrink-0"></div>
                      <div>
                        <span className="font-medium text-foreground">Process Steps:</span>
                        <span className="text-muted-foreground ml-1">{user.stepByStepProcess.length} package(s) with steps</span>
                      </div>
                    </div>
                  )}
                  
                  {user.timelineToResults && user.timelineToResults.length > 0 && (
                    <div className="flex items-start gap-2">
                      <div className="h-3 w-3 bg-teal-500 rounded-full mt-0.5 flex-shrink-0"></div>
                      <div>
                        <span className="font-medium text-foreground">Timelines:</span>
                        <span className="text-muted-foreground ml-1">{user.timelineToResults.length} package(s) with timelines</span>
                      </div>
                    </div>
                  )}
                  
                  {user.bigBrands && (
                    <div className="flex items-start gap-2">
                      <div className="h-3 w-3 bg-purple-500 rounded-full mt-0.5 flex-shrink-0"></div>
                      <div>
                        <span className="font-medium text-foreground">Big Brands:</span>
                        <span className="text-muted-foreground ml-1">{user.bigBrands.substring(0, 50)}...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        {hasFeatures && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowFeatures(!showFeatures)}
              className="px-2 py-2 text-sm border cursor-pointer border-border text-foreground rounded-full hover:bg-primary-hover transition-colors"
              title="Model Features"
            >
              <Star className="h-4 w-4" />
            </button>
            
            {showFeatures && (
              <div className="absolute top-full right-0 mt-2 bg-background border border-border rounded-lg shadow-lg p-4 w-80 z-50">
                <h3 className="text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Model Features
                </h3>
                <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-thin">
                  {modelFeatures.map((feature) => (
                    <div key={feature._id} className="border-b border-border/30 pb-3 last:border-b-0">
                      <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        {feature.name}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {hasHistory && onShowHistory && (
          <button
            onClick={onShowHistory}
            className="px-2 py-2 text-sm border cursor-pointer border-border text-foreground rounded-full hover:bg-primary-hover transition-colors"
            title="Chat History"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
        )}
        
        <Theme />
      </div>
    </div>
  );
}                                                                                                                                                                                                                                                                                                                                                                                                                                                           