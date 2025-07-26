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
  Eye,
  TrendingUp,
  Activity,
  Calendar,
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
  id: string;
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
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
    discount: 0,
    type: 'percentage' as 'percentage' | 'fixed',
    maxUses: 100,
    expiresAt: '',
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
      const statsRes = await fetch(`${API_BASE}/admin/stats`, {
        credentials: 'include'
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      const promptsRes = await fetch(`${API_BASE}/admin/prompts`, {
        credentials: 'include'
      });
      if (promptsRes.ok) {
        const promptsData = await promptsRes.json();
        setPrompts(promptsData);
      }

      const vouchersRes = await fetch(`${API_BASE}/admin/vouchers`, {
        credentials: 'include'
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
      const url = editingPrompt 
        ? `${API_BASE}/admin/prompts/${editingPrompt.id}`
        : `${API_BASE}/admin/prompts`;
      
      const method = editingPrompt ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
      const url = editingVoucher 
        ? `${API_BASE}/admin/vouchers/${editingVoucher.id}`
        : `${API_BASE}/admin/vouchers`;
      
      const method = editingVoucher ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(voucherForm)
      });

      if (res.ok) {
        toast.success(editingVoucher ? 'Voucher updated!' : 'Voucher created!');
        setShowVoucherModal(false); 
        setEditingVoucher(null);
        setVoucherForm({ code: '', discount: 0, type: 'percentage', maxUses: 100, expiresAt: '', isActive: true });
        fetchData();
      } else {
        toast.error('Failed to save voucher');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const deletePrompt = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;
    
    try {
      const res = await fetch(`${API_BASE}/admin/prompts/${id}`, {
        method: 'DELETE',
        credentials: 'include'
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

  const deleteVoucher = async (id: string) => {
    if (!confirm('Are you sure you want to delete this voucher?')) return;
    
    try {
      const res = await fetch(`${API_BASE}/admin/vouchers/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (res.ok) {
        toast.success('Voucher deleted!');
        fetchData();
      } else {
        toast.error('Failed to delete voucher');
      }
    } catch (error) {
      toast.error('Network error');
    }
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
      discount: voucher.discount,
      type: voucher.type,
      maxUses: voucher.maxUses,
      expiresAt: voucher.expiresAt.split('T')[0],
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
                  setVoucherForm({ code: '', discount: 0, type: 'percentage', maxUses: 100, expiresAt: '', isActive: true });
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-text-faded uppercase tracking-wider">Discount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-text-faded uppercase tracking-wider">Usage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-text-faded uppercase tracking-wider">Expires</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-text-faded uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-text-faded uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {vouchers.map((voucher) => (
                      <tr key={voucher.id} className="hover:bg-primary-hover transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-foreground">{voucher.code}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {voucher.type === 'percentage' ? `${voucher.discount}%` : `$${voucher.discount}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {voucher.usedCount} / {voucher.maxUses}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-text-faded">
                          {new Date(voucher.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {voucher.isActive ? (
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => editVoucher(voucher)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteVoucher(voucher.id)}
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
        <div className="fixed inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-[100]">
          <div className="bg-background border border-border rounded-lg p-6 w-full max-w-md mx-4">
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

            <form onSubmit={handleVoucherSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Code</label>
                <input
                  type="text"
                  value={voucherForm.code}
                  onChange={(e) => setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:border-primary-hover focus:ring-1 focus:ring-primary-hover"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Discount</label>
                  <input
                    type="number"
                    value={voucherForm.discount}
                    onChange={(e) => setVoucherForm({ ...voucherForm, discount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:border-primary-hover focus:ring-1 focus:ring-primary-hover"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Type</label>
                  <select
                    value={voucherForm.type}
                    onChange={(e) => setVoucherForm({ ...voucherForm, type: e.target.value as 'percentage' | 'fixed' })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:border-primary-hover focus:ring-1 focus:ring-primary-hover"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Max Uses</label>
                  <input
                    type="number"
                    value={voucherForm.maxUses}
                    onChange={(e) => setVoucherForm({ ...voucherForm, maxUses: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:border-primary-hover focus:ring-1 focus:ring-primary-hover"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Expires At</label>
                  <input
                    type="date"
                    value={voucherForm.expiresAt}
                    onChange={(e) => setVoucherForm({ ...voucherForm, expiresAt: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:border-primary-hover focus:ring-1 focus:ring-primary-hover"
                    required
                  />
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
    </div>
  );
}
