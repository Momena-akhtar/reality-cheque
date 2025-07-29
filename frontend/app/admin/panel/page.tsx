'use client';

import { useState, useEffect, useRef } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  CreditCard, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Activity,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

interface Prompt {
  id: string;
  name: string;
  content: string;
  modelId: string;
  isActive: boolean;
  createdAt: string;
}

interface Voucher {
  _id: string;
  code: string;
  voucherType: 'percentage' | 'credits';
  value: number;
  maxUses: number;
  usedCount: number;
  usedBy: string[];
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  description?: string;
  applicablePlans: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: {
    _id: string;
    username: string;
    email: string;
  };
}

interface Stats {
  totalUsers: number;
  totalChats: number;
  totalMessages: number;
  revenue: number;
  activeUsers: number;
  newUsersThisMonth: number;
}

export default function AdminPanel() {
  const { admin, adminLogout, adminLoading } = useAdminAuth();
  const [sessionWarning, setSessionWarning] = useState(false);
  const [showSessionTooltip, setShowSessionTooltip] = useState(false);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'prompts' | 'vouchers'>('stats');
  const [stats, setStats] = useState<Stats | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const router = useRouter();
  
  const [promptForm, setPromptForm] = useState({
    name: '',
    content: '',
    modelId: '',
    isActive: true
  });

  const [voucherForm, setVoucherForm] = useState({
    code: '',
    voucherType: 'percentage' as 'percentage' | 'credits',
    value: 0,
    maxUses: 100,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '',
    description: '',
    applicablePlans: ['pro'] as string[],
    isActive: true
  });

  useEffect(() => {
    if (admin) {
      fetchData();
  
      const adminToken = localStorage.getItem('adminToken');
      if (adminToken) {
        try {
          const tokenData = JSON.parse(atob(adminToken.split('.')[1]));
          const currentTime = Math.floor(Date.now() / 1000);
          const timeUntilExpiry = tokenData.exp - currentTime;
          const warningTime = timeUntilExpiry - 300; // 5 minutes before expiry
          
          if (warningTime > 0) {
            warningTimeoutRef.current = setTimeout(() => {
              setSessionWarning(true);
              toast.warning('Admin session will expire in 5 minutes. Please save your work.');
            }, warningTime * 1000);
          }
        } catch (error) {
          console.error('Error parsing admin token:', error);
        }
      }
    }
    
    return () => {
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [admin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        toast.error('Admin token not found');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      };

      const statsRes = await fetch(`${API_BASE}/admin/stats`, {
        headers
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      const promptsRes = await fetch(`${API_BASE}/admin/prompts`, {
        headers
      });
      if (promptsRes.ok) {
        const promptsData = await promptsRes.json();
        setPrompts(promptsData);
      }

      const vouchersRes = await fetch(`${API_BASE}/admin/vouchers`, {
        headers
      });
      if (vouchersRes.ok) {
        const vouchersData = await vouchersRes.json();
        setVouchers(vouchersData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handlePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        toast.error('Admin token not found');
        return;
      }

      const url = editingPrompt 
        ? `${API_BASE}/admin/prompts/${editingPrompt.id}`
        : `${API_BASE}/admin/prompts`;
      
      const method = editingPrompt ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(promptForm)
      });

      if (res.ok) {
        toast.success(editingPrompt ? 'Prompt updated!' : 'Prompt created!');
        setShowPromptModal(false);
        setEditingPrompt(null);
        setPromptForm({ name: '', content: '', modelId: '', isActive: true });
        fetchData();
      } else {
        toast.error('Failed to save prompt');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const handleVoucherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        toast.error('Admin token not found');
        return;
      }

      const url = editingVoucher 
        ? `${API_BASE}/admin/vouchers/${editingVoucher._id}`
        : `${API_BASE}/admin/vouchers`;
      
      const method = editingVoucher ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(voucherForm)
      });

      if (res.ok) {
        toast.success(editingVoucher ? 'Voucher updated Successfully!' : 'Voucher created Successfully!');
        setShowVoucherModal(false); 
        setEditingVoucher(null);
        setVoucherForm({ 
          code: '', 
          voucherType: 'percentage', 
          value: 0, 
          maxUses: 100, 
          validFrom: new Date().toISOString().split('T')[0],
          validUntil: '',
          description: '',
          applicablePlans: ['pro'],
          isActive: true 
        });
        fetchData();
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || 'Failed to save voucher');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const deletePrompt = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;
    
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        toast.error('Admin token not found');
        return;
      }

      const res = await fetch(`${API_BASE}/admin/prompts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (res.ok) {
        toast.success('Prompt deleted!');
        fetchData();
      } else {
        toast.error('Failed to delete prompt');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const [showDeleteVoucherModal, setShowDeleteVoucherModal] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState<Voucher | null>(null);

  const deleteVoucher = async (id: string) => {
    const voucher = vouchers.find(v => v._id === id);
    if (voucher) {
      setVoucherToDelete(voucher);
      setShowDeleteVoucherModal(true);
    }
  };

  const confirmDeleteVoucher = async () => {
    if (!voucherToDelete) return;
    
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        toast.error('Admin token not found');
        return;
      }

      const res = await fetch(`${API_BASE}/admin/vouchers/${voucherToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (res.ok) {
        toast.success('Voucher deleted!');
        fetchData();
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || 'Failed to delete voucher');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setShowDeleteVoucherModal(false);
      setVoucherToDelete(null);
    }
  };

  const cancelDeleteVoucher = () => {
    setShowDeleteVoucherModal(false);
    setVoucherToDelete(null);
  };

  const editPrompt = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setPromptForm({
      name: prompt.name,
      content: prompt.content,
      modelId: prompt.modelId,
      isActive: prompt.isActive
    });
    setShowPromptModal(true);
  };

  const editVoucher = (voucher: Voucher) => {
    setEditingVoucher(voucher);
    setVoucherForm({
      code: voucher.code,
      voucherType: voucher.voucherType,
      value: voucher.value,
      maxUses: voucher.maxUses,
      validFrom: voucher.validFrom.split('T')[0],
      validUntil: voucher.validUntil.split('T')[0],
      description: voucher.description || '',
      applicablePlans: voucher.applicablePlans,
      isActive: voucher.isActive
    });
    setShowVoucherModal(true);
  };

  useEffect(() => {
    if (!adminLoading && !admin) {
      router.push('/admin');
    }
  }, [admin, adminLoading, router]);

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-primary-text-faded">Loading admin panel...</p>
        </div>
      </div>
    );
  }
  if (!admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Session Warning Banner */}
      {sessionWarning && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <span className="text-yellow-700 dark:text-yellow-300 font-medium">
                Admin session will expire in 5 minutes. Please save your work.
              </span>
            </div>
            <button
              onClick={() => setSessionWarning(false)}
              className="text-yellow-700 dark:text-yellow-300 hover:text-yellow-800 dark:hover:text-yellow-200"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Settings className="w-8 h-8 text-foreground mr-3" />
              <h1 className="text-xl font-semibold text-foreground">Admin Panel</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-primary-text-faded">Welcome, {admin?.email}</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-primary-text-faded">Session Active</span>
                <div 
                  className="relative"
                  onMouseEnter={() => setShowSessionTooltip(true)}
                  onMouseLeave={() => setShowSessionTooltip(false)}
                >
                  <Info className="w-3 h-3 cursor-pointer text-primary-text-faded hover:text-foreground transition-colors" />
                  {showSessionTooltip && (
                    <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-background border border-border rounded-lg shadow-lg text-xs text-primary-text-faded whitespace-nowrap z-10">
                      Admin session expires in 30 minutes for security. Token will auto-refresh when needed.
                      <div className="absolute bottom-full right-2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-border"></div>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={adminLogout}
                className="px-3 py-1 text-sm border border-border rounded-lg text-foreground hover:bg-primary-hover transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'stats', label: 'Dashboard', icon: BarChart3 },
              { id: 'prompts', label: 'Prompts', icon: MessageSquare },
              { id: 'vouchers', label: 'Vouchers', icon: CreditCard }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-foreground text-foreground'
                      : 'border-transparent text-primary-text-faded hover:text-foreground hover:border-border'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-card border border-border rounded-lg p-6 hover:bg-card-hover transition-colors">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Users className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-primary-text-faded">Total Users</p>
                    <p className="text-2xl font-bold text-foreground">{stats?.totalUsers || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6 hover:bg-card-hover transition-colors">
                <div className="flex items-center">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-primary-text-faded">Total Chats</p>
                    <p className="text-2xl font-bold text-foreground">{stats?.totalChats || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6 hover:bg-card-hover transition-colors">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Activity className="w-6 h-6 text-purple-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-primary-text-faded">Active Users</p>
                    <p className="text-2xl font-bold text-foreground">{stats?.activeUsers || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6 hover:bg-card-hover transition-colors">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-500/10 rounded-lg">
                    <DollarSign className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-primary-text-faded">Revenue</p>
                    <p className="text-2xl font-bold text-foreground">${stats?.revenue || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-foreground">New user registered</span>
                    <span className="text-xs text-primary-text-faded ml-auto">2 min ago</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-foreground">Chat session started</span>
                    <span className="text-xs text-primary-text-faded ml-auto">5 min ago</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-foreground">Payment processed</span>
                    <span className="text-xs text-primary-text-faded ml-auto">10 min ago</span>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setActiveTab('prompts')}
                    className="w-full text-left p-3 border border-border rounded-lg hover:bg-primary-hover transition-colors"
                  >
                    <div className="flex items-center space-x-3 cursor-pointer">
                      <MessageSquare className="w-5 h-5 text-foreground" />
                      <span className="text-foreground">Manage Prompts</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('vouchers')}
                    className="w-full text-left p-3 border border-border rounded-lg hover:bg-primary-hover transition-colors"
                  >
                    <div className="flex items-center space-x-3 cursor-pointer">
                      <CreditCard className="w-5 h-5 text-foreground" />
                      <span className="text-foreground">Create Voucher</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'prompts' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">Manage Prompts</h2>
              <button
                onClick={() => {
                  setEditingPrompt(null);
                  setPromptForm({ name: '', content: '', modelId: '', isActive: true });
                  setShowPromptModal(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 border border-border text-foreground cursor-pointer  rounded-lg hover:bg-primary-hover transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Prompt</span>
              </button>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-primary border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-text-faded uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-text-faded uppercase tracking-wider">Model</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-text-faded uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-text-faded uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-text-faded uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {prompts.map((prompt) => (
                      <tr key={prompt.id} className="hover:bg-primary-hover transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-foreground">{prompt.name}</div>
                          <div className="text-sm text-primary-text-faded truncate max-w-xs">{prompt.content}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{prompt.modelId}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {prompt.isActive ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-text-faded">
                          {new Date(prompt.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => editPrompt(prompt)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deletePrompt(prompt.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vouchers' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">Manage Vouchers</h2>
              <button
                onClick={() => {
                  setEditingVoucher(null);
                  setVoucherForm({ 
                    code: '', 
                    voucherType: 'percentage', 
                    value: 0, 
                    maxUses: 100, 
                    validFrom: new Date().toISOString().split('T')[0],
                    validUntil: '',
                    description: '',
                    applicablePlans: ['pro'],
                    isActive: true 
                  });
                  setShowVoucherModal(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 border border-border text-foreground cursor-pointer rounded-lg hover:bg-primary-hover transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Voucher</span>
              </button>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-primary border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-text-faded uppercase tracking-wider">Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-text-faded uppercase tracking-wider">Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-text-faded uppercase tracking-wider">Usage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-text-faded uppercase tracking-wider">Valid Until</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-text-faded uppercase tracking-wider">Plans</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-text-faded uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-text-faded uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {vouchers.map((voucher) => (
                      <tr key={voucher._id} className="hover:bg-primary-hover transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-foreground">{voucher.code}</div>
                          {voucher.description && (
                            <div className="text-xs text-primary-text-faded truncate max-w-xs">{voucher.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          <div>
                            {voucher.voucherType === 'percentage' ? `${voucher.value}%` : `$${voucher.value} credits`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {voucher.usedCount} / {voucher.maxUses}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-text-faded">
                          {new Date(voucher.validUntil).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          <div className="flex flex-wrap gap-1">
                            {voucher.applicablePlans.map((plan) => (
                              <span key={plan} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-700/20 text-foreground border border-green-700">
                                {plan}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {voucher.isActive ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-700/20 border border-green-700 text-foreground">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-700/20 border border-red-700 text-foreground">
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => editVoucher(voucher)}
                              className="text-blue-600 hover:text-blue-900 p-1 cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteVoucher(voucher._id)}
                              className="text-red-600 hover:text-red-900 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Prompt Modal */}
      {showPromptModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-[100]">
          <div className="bg-background border border-border rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-foreground">
                {editingPrompt ? 'Edit Prompt' : 'Add New Prompt'}
              </h3>
              <button
                onClick={() => setShowPromptModal(false)}
                className="text-primary-text-faded hover:text-foreground cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePromptSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Name</label>
                <input
                  type="text"
                  value={promptForm.name}
                  onChange={(e) => setPromptForm({ ...promptForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:border-primary-hover focus:ring-1 focus:ring-primary-hover"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Content</label>
                <textarea
                  value={promptForm.content}
                  onChange={(e) => setPromptForm({ ...promptForm, content: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:border-primary-hover focus:ring-1 focus:ring-primary-hover"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Model ID</label>
                <input
                  type="text"
                  value={promptForm.modelId}
                  onChange={(e) => setPromptForm({ ...promptForm, modelId: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:border-primary-hover focus:ring-1 focus:ring-primary-hover"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={promptForm.isActive}
                  onChange={(e) => setPromptForm({ ...promptForm, isActive: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="isActive" className="text-sm text-foreground">Active</label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPromptModal(false)}
                  className="px-4 py-2 border border-border cursor-pointer rounded-lg text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-foreground border border-border cursor-pointer rounded-lg hover:bg-primary-hover transition-colors"
                >
                  {editingPrompt ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Voucher Modal */}
      {showVoucherModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-[100] p-4">
          <div className="bg-background border border-border rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-foreground">
                {editingVoucher ? 'Edit Voucher' : 'Add New Voucher'}
              </h3>
              <button
                onClick={() => setShowVoucherModal(false)}
                className="text-primary-text-faded hover:text-foreground cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVoucherSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Code (6-8 characters, letters & numbers)</label>
                <input
                  type="text"
                  value={voucherForm.code}
                  onChange={(e) => setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-hover"
                  placeholder="e.g., SAVE20 or WELCOME50"
                  maxLength={8}
                  pattern="[A-Z0-9]*"
                />
              </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                  <input
                    type="text"
                    value={voucherForm.description}
                    onChange={(e) => setVoucherForm({ ...voucherForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-hover"
                    placeholder="Optional description"
                  />
                </div>
              </div>

              {/* Voucher Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Voucher Type</label>
                  <select
                    value={voucherForm.voucherType}
                    onChange={(e) => setVoucherForm({ ...voucherForm, voucherType: e.target.value as 'percentage' | 'credits' })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-hover"
                  >
                    <option value="percentage">Percentage Discount (%)</option>
                    <option value="credits">Dollar Credits ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {voucherForm.voucherType === 'percentage' ? 'Percentage (%)' : 'Credit Amount ($)'}
                  </label>
                  <input
                    type="number"
                    value={voucherForm.value === 0 ? '' : voucherForm.value}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      const numValue = inputValue === '' ? 0 : Number(inputValue);
                      setVoucherForm({ ...voucherForm, value: numValue });
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-hover"
                    required
                    min="0"
                    step="0.01"
                    max={voucherForm.voucherType === 'percentage' ? '100' : undefined}
                    placeholder={voucherForm.voucherType === 'percentage' ? 'e.g., 20 for 20%' : 'e.g., 50 for $50 credits'}
                  />
                </div>
              </div>

              {/* Usage Limits */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Max Uses</label>
                <input
                  type="number"
                  value={voucherForm.maxUses === 0 ? '' : voucherForm.maxUses}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    const numValue = inputValue === '' ? 0 : Number(inputValue);
                    setVoucherForm({ ...voucherForm, maxUses: numValue });
                  }}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-hover"
                  required
                  min="1"
                  placeholder="e.g., 100"
                />
              </div>

              {/* Validity Period */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Valid From</label>
                  <input
                    type="date"
                    value={voucherForm.validFrom}
                    onChange={(e) => setVoucherForm({ ...voucherForm, validFrom: e.target.value })} 
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-hover"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Valid Until</label>
                  <input
                    type="date"
                    value={voucherForm.validUntil}
                    onChange={(e) => setVoucherForm({ ...voucherForm, validUntil: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-hover"
                    required
                  />
                </div>
              </div>

              {/* Plans and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Applicable Plans</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={voucherForm.applicablePlans.includes('pro')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setVoucherForm({ 
                              ...voucherForm, 
                              applicablePlans: [...voucherForm.applicablePlans, 'pro'] 
                            });
                          } else {
                            setVoucherForm({ 
                              ...voucherForm, 
                              applicablePlans: voucherForm.applicablePlans.filter(p => p !== 'pro') 
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      Pro Plan
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={voucherForm.applicablePlans.includes('enterprise')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setVoucherForm({ 
                              ...voucherForm, 
                              applicablePlans: [...voucherForm.applicablePlans, 'enterprise'] 
                            });
                          } else {
                            setVoucherForm({ 
                              ...voucherForm, 
                              applicablePlans: voucherForm.applicablePlans.filter(p => p !== 'enterprise') 
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      Enterprise Plan
                    </label>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="voucherActive"
                    checked={voucherForm.isActive}
                    onChange={(e) => setVoucherForm({ ...voucherForm, isActive: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="voucherActive" className="text-sm text-foreground">Active</label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowVoucherModal(false)}
                  className="px-4 py-2 border border-border cursor-pointer rounded-lg text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-border cursor-pointer rounded-lg text-foreground hover:bg-primary-hover transition-colors"
                >
                  {editingVoucher ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Voucher Confirmation Modal */}
      {showDeleteVoucherModal && voucherToDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-[100]">
          <div className="bg-background border border-border rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Delete Voucher</h3>
                <p className="text-sm text-primary-text-faded">This action cannot be undone.</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-foreground mb-2">
                Are you sure you want to delete the voucher <span className="font-semibold">{voucherToDelete.code}</span>?
              </p>
              <div className="bg-card border border-border rounded-lg p-3">
                <div className="text-xs text-primary-text-faded space-y-1">
                  <p><span className="font-medium">Type:</span> {voucherToDelete.voucherType === 'percentage' ? `${voucherToDelete.value}% discount` : `$${voucherToDelete.value} credits`}</p>
                  <p><span className="font-medium">Usage:</span> {voucherToDelete.usedCount} / {voucherToDelete.maxUses}</p>
                  <p><span className="font-medium">Valid until:</span> {new Date(voucherToDelete.validUntil).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelDeleteVoucher}
                className="flex-1 py-2 px-4 rounded-lg cursor-pointer border border-border text-foreground hover:bg-card-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteVoucher}
                className="flex-1 py-2 px-4 border border-red-600/30 hover:bg-red-600/40 cursor-pointer text-foreground rounded-lg transition-colors"
              >
                Delete Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
