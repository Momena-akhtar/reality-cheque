"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface Admin {
  id: string;
  email: string;
  username: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AdminAuthContextType {
  admin: Admin | null;
  setAdmin: (admin: Admin | null) => void;
  adminLogout: () => Promise<void>;
  refreshAdmin: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  adminLoading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [adminLoading, setAdminLoading] = useState(true);
  const [tokenExpiry, setTokenExpiry] = useState<number | null>(null);

  const fetchAdmin = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        setAdmin(null);
        setAdminLoading(false);
        return;
      }

      // Check if token is expired
      const tokenData = JSON.parse(atob(adminToken.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (tokenData.exp && tokenData.exp < currentTime) {
        // Token is expired, clear it
        setAdmin(null);
        localStorage.removeItem('adminToken');
        setTokenExpiry(null);
        setAdminLoading(false);
        return;
      }

      // Set token expiry for monitoring
      setTokenExpiry(tokenData.exp);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/me`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAdmin(data);
      } else {
        setAdmin(null);
        localStorage.removeItem('adminToken');
        setTokenExpiry(null);
      }
    } catch (error) {
      console.error("Error fetching admin:", error);
      setAdmin(null);
      localStorage.removeItem('adminToken');
      setTokenExpiry(null);
    } finally {
      setAdminLoading(false);
    }
  };

  const refreshAdmin = async () => {
    await fetchAdmin();
  };

  useEffect(() => {
    fetchAdmin();
  }, []);

  // Monitor token expiry and auto-refresh/logout
  useEffect(() => {
    if (!tokenExpiry) return;

    const checkExpiry = async () => {
      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = tokenExpiry - currentTime;
      
      if (timeUntilExpiry <= 0) {
        // Token has expired, logout admin
        setAdmin(null);
        localStorage.removeItem('adminToken');
        setTokenExpiry(null);
        console.log('Admin token expired, logged out automatically');
      } else if (timeUntilExpiry <= 300) { // 5 minutes before expiry
        // Try to refresh token
        const refreshed = await refreshToken();
        if (!refreshed) {
          console.log('Failed to refresh admin token, logging out');
        }
      }
    };

    // Check every 2 minutes
    const interval = setInterval(checkExpiry, 120000);
    
    // Also check immediately
    checkExpiry();

    return () => clearInterval(interval);
  }, [tokenExpiry]);

  const adminLogout = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (adminToken) {
        await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/logout`, {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });
      }
    } catch (error) {
      console.error("Error during admin logout:", error);
    } finally {
      setAdmin(null);
      localStorage.removeItem('adminToken');
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) return false;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/refresh`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('adminToken', data.token);
        setAdmin(data.admin);
        return true;
      } else {
        // Token refresh failed, logout
        setAdmin(null);
        localStorage.removeItem('adminToken');
        return false;
      }
    } catch (error) {
      console.error("Error refreshing admin token:", error);
      setAdmin(null);
      localStorage.removeItem('adminToken');
      return false;
    }
  };

  return (
    <AdminAuthContext.Provider value={{ 
      admin, 
      setAdmin, 
      adminLogout, 
      refreshAdmin, 
      refreshToken,
      adminLoading 
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
} 