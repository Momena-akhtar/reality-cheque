'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Calendar, Activity, X } from 'lucide-react';
import { toast } from 'sonner';

interface UsageData {
  date: string;
  creditsUsed: number;
  apiCalls: number;
  cost: number;
}

interface UsageStats {
  totalCreditsUsed: number;
  totalApiCalls: number;
  totalCost: number;
  averageDailyUsage: number;
  trend: 'up' | 'down' | 'stable';
  remainingCredits: number;
}

const UsageHistoryPopup = ({ onClose }: { onClose: () => void }) => {
  const { user } = useAuth();
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [stats, setStats] = useState<UsageStats>({
    totalCreditsUsed: 0,
    totalApiCalls: 0,
    totalCost: 0,
    averageDailyUsage: 0,
    trend: 'stable',
    remainingCredits: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Mock data - replace with actual API call
  useEffect(() => {
    const generateMockData = () => {
      const data: UsageData[] = [];
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        data.push({
          date: date.toISOString().split('T')[0],
          creditsUsed: Math.floor(Math.random() * 50) + 10,
          apiCalls: Math.floor(Math.random() * 200) + 50,
          cost: Math.floor(Math.random() * 5) + 1
        });
      }
      
      return data;
    };

    const mockData = generateMockData();
    setUsageData(mockData);
    
    // Calculate stats
    const totalCreditsUsed = mockData.reduce((sum, day) => sum + day.creditsUsed, 0);
    const totalApiCalls = mockData.reduce((sum, day) => sum + day.apiCalls, 0);
    const totalCost = mockData.reduce((sum, day) => sum + day.cost, 0);
    const averageDailyUsage = totalCreditsUsed / mockData.length;
    
    // Determine trend (simple logic - compare first and last week)
    const firstWeek = mockData.slice(0, 7).reduce((sum, day) => sum + day.creditsUsed, 0);
    const lastWeek = mockData.slice(-7).reduce((sum, day) => sum + day.creditsUsed, 0);
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (lastWeek > firstWeek * 1.1) trend = 'up';
    else if (lastWeek < firstWeek * 0.9) trend = 'down';
    
    setStats({
      totalCreditsUsed,
      totalApiCalls,
      totalCost,
      averageDailyUsage: Math.round(averageDailyUsage * 100) / 100,
      trend,
      remainingCredits: user?.creditsPerMonth || 10
    });
    
    setLoading(false);
  }, [timeRange, user?.creditsPerMonth]);

  const getTrendIcon = () => {
    switch (stats.trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  const getTrendText = () => {
    switch (stats.trend) {
      case 'up':
        return 'Usage increasing';
      case 'down':
        return 'Usage decreasing';
      default:
        return 'Usage stable';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getMaxValue = (data: UsageData[], key: keyof UsageData) => {
    return Math.max(...data.map(item => item[key] as number));
  };

  const renderBarChart = () => {
    const maxCredits = getMaxValue(usageData, 'creditsUsed');
    
    return (
      <div className="flex items-end justify-between h-32 space-x-1">
        {usageData.slice(-10).map((day, index) => {
          const height = (day.creditsUsed / maxCredits) * 100;
          return (
            <div 
              key={day.date}
              className="bg-primary-hover rounded-t-sm transition-all duration-300 hover:bg-green-700 flex-1"
              style={{ 
                height: `${Math.max(height, 8)}px` 
              }}
              title={`${day.date}: ${day.creditsUsed} credits`}
            />
          );
        })}
      </div>
    );
  };

  if (!user) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-[100]">
      <div className="bg-background text-foreground border border-border rounded-lg p-8 w-[700px] max-h-[90vh] overflow-y-auto shadow-lg [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-primary-text-faded">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Usage History & Analytics
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 mb-6">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                timeRange === range
                  ? 'bg-primary-hover text-foreground'
                  : 'bg-background border border-border text-primary-text-faded hover:text-foreground'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-primary-text-faded">Total Credits Used</p>
                    <p className="text-xl font-semibold">{stats.totalCreditsUsed}</p>
                  </div>
                  <DollarSign className="w-5 h-5 text-primary-text-faded" />
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-primary-text-faded">API Calls</p>
                    <p className="text-xl font-semibold">{stats.totalApiCalls.toLocaleString()}</p>
                  </div>
                  <Activity className="w-5 h-5 text-primary-text-faded" />
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-primary-text-faded">Total Cost</p>
                    <p className="text-xl font-semibold">{formatCurrency(stats.totalCost)}</p>
                  </div>
                  <DollarSign className="w-5 h-5 text-primary-text-faded" />
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-primary-text-faded">Daily Average</p>
                    <p className="text-xl font-semibold">{stats.averageDailyUsage}</p>
                  </div>
                  <Calendar className="w-5 h-5 text-primary-text-faded" />
                </div>
              </div>
            </div>

            {/* Trend and Remaining Credits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-primary-text-faded">Usage Trend</p>
                  {getTrendIcon()}
                </div>
                <p className="text-lg font-semibold">{getTrendText()}</p>
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-primary-text-faded">Remaining Credits</p>
                  <DollarSign className="w-5 h-5 text-primary-text-faded" />
                </div>
                <p className="text-lg font-semibold">${stats.remainingCredits}/mo</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-primary rounded-full h-2 transition-all duration-300"
                    style={{ 
                      width: `${Math.min((stats.remainingCredits / 10) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Usage Chart */}
            <div className="bg-card border border-border rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-4">Daily Usage (Last 10 Days)</h3>
              {renderBarChart()}
              <div className="flex justify-between text-xs text-primary-text-faded mt-2">
                <span>{usageData[usageData.length - 10]?.date}</span>
                <span>{usageData[usageData.length - 1]?.date}</span>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3 max-h-48 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-primary-text-faded">
                {usageData.slice(-5).reverse().map((day) => (
                  <div key={day.date} className="flex justify-between items-center py-2 border-b border-border/50 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium">{new Date(day.date).toLocaleDateString()}</p>
                      <p className="text-xs text-primary-text-faded">{day.apiCalls} API calls</p>
                    </div>
                    <div className="text-right mr-2">
                      <p className="text-sm font-medium">{day.creditsUsed} credits</p>
                      <p className="text-xs text-primary-text-faded">{formatCurrency(day.cost)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UsageHistoryPopup;