"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface User {
  id: string;
  email: string;
  username: string;
  tier?: "tier1" | "tier2" | "tier3";
  totalCredits?: number;
  usedCredits?: number;
  // New user type fields
  userType?: "agency" | "freelancer";
  usageType?: "personal" | "clients";
  // Updated agency/freelancer fields
  agencyName?: string;
  services?: Array<{
    name: string;
    description?: string;
  }>;
  website?: string;
  pricingPackages?: Array<{
    name: string;
    price: string;
    description?: string;
  }>;
  currentOffers?: Array<{
    name: string;
    description?: string;
    packageId?: string;
  }>;
  caseStudies?: string;
  clientsServed?: number;
  targetAudience?: string;
  idealClientProfile?: string;
  bigBrands?: string;
  stepByStepProcess?: Array<{
    packageId: string;
    steps: Array<{
      order: number;
      description: string;
    }>;
  }>;
  timelineToResults?: Array<{
    packageId: string;
    timeline: string;
  }>;
  leadSources?: Array<string>;
  monthlyRevenue?: number;
  fiverrGigs?: Array<{
    title: string;
    description?: string;
    tags: Array<string>;
    price: string;
    status: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  updateUser: (userId: string, updateData: Partial<User>) => Promise<boolean>;
  updateUserTier: (userId: string, tier: "tier1" | "tier2" | "tier3") => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  // Gig management functions
  addGig: (userId: string, gigData: any) => Promise<boolean>;
  updateGig: (userId: string, gigIndex: number, gigData: any) => Promise<boolean>;
  removeGig: (userId: string, gigIndex: number) => Promise<boolean>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/me`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const logout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setUser(null);
    }
  };

  const updateUser = async (userId: string, updateData: Partial<User>): Promise<boolean> => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        return true;
      } else {
        console.error("Failed to update user:", await res.text());
        return false;
      }
    } catch (error) {
      console.error("Error updating user:", error);
      return false;
    }
  };

  const updateUserTier = async (userId: string, tier: "tier1" | "tier2" | "tier3"): Promise<boolean> => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/${userId}/tier`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ tier }),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        return true;
      } else {
        console.error("Failed to update user tier:", await res.text());
        return false;
      }
    } catch (error) {
      console.error("Error updating user tier:", error);
      return false;
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        setUser(null);
        return true;
      } else {
        console.error("Failed to delete user:", await res.text());
        return false;
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  };

  // Gig management functions
  const addGig = async (userId: string, gigData: any): Promise<boolean> => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/${userId}/gigs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(gigData),
      });

      if (res.ok) {
        const updatedGigs = await res.json();
        setUser(prev => prev ? { ...prev, fiverrGigs: updatedGigs } : null);
        return true;
      } else {
        console.error("Failed to add gig:", await res.text());
        return false;
      }
    } catch (error) {
      console.error("Error adding gig:", error);
      return false;
    }
  };

  const updateGig = async (userId: string, gigIndex: number, gigData: any): Promise<boolean> => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/${userId}/gigs/${gigIndex}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(gigData),
      });

      if (res.ok) {
        const updatedGigs = await res.json();
        setUser(prev => prev ? { ...prev, fiverrGigs: updatedGigs } : null);
        return true;
      } else {
        console.error("Failed to update gig:", await res.text());
        return false;
      }
    } catch (error) {
      console.error("Error updating gig:", error);
      return false;
    }
  };

  const removeGig = async (userId: string, gigIndex: number): Promise<boolean> => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/${userId}/gigs/${gigIndex}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        const updatedGigs = await res.json();
        setUser(prev => prev ? { ...prev, fiverrGigs: updatedGigs } : null);
        return true;
      } else {
        console.error("Failed to remove gig:", await res.text());
        return false;
      }
    } catch (error) {
      console.error("Error removing gig:", error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser, 
      logout, 
      updateUser, 
      updateUserTier,
      deleteUser, 
      refreshUser,
      addGig,
      updateGig,
      removeGig,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
} 