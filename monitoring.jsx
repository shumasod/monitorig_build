import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertTriangle, Bell, Clock, Server, HardDrive, Activity } from 'lucide-react';

// ゲージチャートコンポーネント - 改良版
const GaugeChart = ({ value, title, thresholds, unit = '%' }) => {
  const radius = 80;
  const strokeWidth = 15;
  const normalizedValue = Math.min(Math.max(value, 0), 100);
  const circumference = 2 * Math.PI * radius;
  const progress = ((100 - normalizedValue) / 100) * circumference;
  
  const getColor = (value) => {
    if (value < thresholds.warning) return '#22c55e';
    if (value < thresholds.critical) return '#eab308';
    return '#ef4444';
  };

  const getStatusText = (value) => {
    if (value < thresholds.warning) return '正常';
    if (value < thresholds.critical) return '警告';
    return '危険';
  };

  return (
    <div className="relative w-full flex flex-col items-center">
      <svg className="w-48 h-48" viewBox="0 0 200 200">
        <defs>
          <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="60%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#1f2937"
          strokeWidth={strokeWidth}
          className="opacity-25"
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={getColor(normalizedValue)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          transform="rotate(-90 100 100)"
          strokeLinecap="round"
        />
        <text
          x="100"
          y="85"
          textAnchor="middle"
          className="fill-white text-2xl font-bold"
        >
          {normalizedValue.toFixed(1)}{unit}
        </text>
        <text
          x="100"
          y="110"
          textAnchor="middle"
          className="fill-white text-sm font-medium"
        >
          {title}
        </text>
        <text
          x="100"
          y="130"
          textAnchor="middle"
          className="fill-white text-sm"
        >
          <tspan className={`
            ${normalizedValue < thresholds.warning ? 'fill-green-500' : 
              normalizedValue < thresholds.critical ? 'fill-yellow-500' : 'fill-red-500'}
          `}>
            {getStatusText(normalizedValue)}
          </tspan>
        </text>
      </svg>
      <div className="flex justify-between w-full text-xs text-gray-400 mt-2">
        <span>0{unit}</span>
        <span className="text-yellow-500">{thresholds.warning}{unit}</span>
        <span className="text-red-500">{thresholds.critical}{unit}</span>
        <span>100{unit}</span>
      </div>
    </div>
  );
};

// ヒストリカルデータチャートコンポーネント
const MetricHistoryChart = ({ data, metric, threshold, timeRange }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const getMetricLabel = (metricKey) => {
    const labels = {
      cpu: 'CPU使用率',
      memory: 'メモリ使用率',
      disk: 'ディスク使用率',
      network: 'ネットワーク使用率',
      latency: 'レイテンシ'
    };
    return labels[metricKey] || metricKey;
  };

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis 
          dataKey="timestamp" 
          tickFormatter={formatTime} 
          stroke="#aaa"
        />
        <YAxis stroke="#aaa" domain={[0, 100]} />
        <Tooltip 
          formatter={(value) => [`${value.toFixed(1)}%`, getMetricLabel(metric)]}
          labelFormatter={(label) => new Date(label).toLocaleString()}
          contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
        />
        <ReferenceLine y={threshold.warning} stroke="#eab308" strokeDasharray="3 3" />
        <ReferenceLine y={threshold.critical} stroke="#ef4444" strokeDasharray="3 3" />
        <Area 
          type="monotone" 
          dataKey={metric} 
          stroke="#3b82f6" 
          fill="#3b82f6" 
          fillOpacity={0.3} 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// アラート履歴コンポーネント
const AlertHistory = ({ alerts }) => {
  if (alerts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <AlertTriangle className="mx-auto mb-2 opacity-30" size={24} />
        <p>アラート履歴がありません</p>
      </div>
    );
  }

  const getMetricLabel = (metricKey) => {
    const labels = {
      cpu: 'CPU使用率',
      memory: 'メモリ使用率',
      disk: 'ディスク使用率',
      network: 'ネットワーク使用率',
      latency: 'レイテンシ'
    };
    return labels[metricKey] || metricKey;
  };

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
      {alerts.map((alert, index) => (
        <div 
          key={index} 
          className={`
            p-3 rounded-md flex items-start gap-3
            ${alert.type === 'critical' ? 'bg-red-950/50 border-l-4 border-red-600' : 
              'bg-yellow-950/50 border-l-4 border-yellow-600'}
          `}
        >
          <AlertTriangle className={alert.type === 'critical' ? 'text-red-500' : 'text-yellow-500'} size={20} />
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium">
                {alert.type === 'critical' ? '危険' : '警告'}: {getMetricLabel(alert.metric)}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-sm text-gray-300">
              値: {alert.value.toFixed(1)}% (閾値: {alert.threshold}%)
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

// メインダッシュボードコンポーネント
const KubernetesDashboard = () => {
  const [timeRange, setTimeRange] = useState('1h');
  const [refreshRate, setRefreshRate] = useState('30s');
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState([]);
  const [currentMetrics, setCurrentMetrics] = useState({
    cpu: 43.2,
    memory: 28.3,
    disk: 5.9,
    network: 18.7,
    latency: 32.5,
    pods: 24,
    nodes: 3,
    deployments: 12,
    services: 15,
    lastUpdated: new Date().toISOString()
  });
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 閾値設定
  const thresholds = {
    cpu: { warning: 70, critical: 85 },
    memory: { warning: 80, critical: 90 },
    disk: { warning: 75, critical: 85 },
    network: { warning: 60, critical: 80 },
    latency: { warning: 40, critical: 60 }
  };

  // 時間範囲オプション
  const timeRanges = [
    { value: '1h', label: '1時間' },
    { value: '3h', label: '3時間' },
    { value: '6h', label: '6時間' },
    { value: '12h', label: '12時間' },
    { value: '24h', label: '24時間' }
  ];

  // 更新頻度オプション
  const refreshRates = [
    { value: '10s', label: '10秒' },
    { value: '30s', label: '30秒' },
    { value: '1m', label: '1分' },
    { value: '5m', label: '5分' },
    { value: '10m', label: '10分' }
  ];

  // 擬似データ生成関数
  const generateFakeData = () => {
    const now = new Date();
    
    // 現在のメトリクスを更新（変動あり）
    const newCurrentMetrics = {
      cpu: Math.min(100, Math.max(0, currentMetrics.cpu + (Math.random() * 10 - 5))),
      memory: Math.min(100, Math.max(0, currentMetrics.memory + (Math.random() * 8 - 4))),
      disk: Math.min(100, Math.max(0, currentMetrics.disk + (Math.random() * 2 - 0.5))),
      network: Math.min(100, Math.max(0, currentMetrics.network + (Math.random() * 15 - 7.5))),
      latency: Math.min(100, Math.max(0, currentMetrics.latency + (Math.random() * 12 - 6))),
      pods: Math.round(Math.max(10, currentMetrics.pods + (Math.random() > 0.5 ? 1 : -1))),
      nodes: currentMetrics.nodes,
      deployments: currentMetrics.deployments,
      services: currentMetrics.services,
      lastUpdated: now.toISOString()
    };
    
    setCurrentMetrics(newCurrentMetrics);
    
    // 履歴メトリクスにデータを追加
    setMetrics(prevMetrics => {
      // 時間範囲による制限（データ量削減）
      const timeLimit = new Date();
      const hours = parseInt(timeRange.replace('h', ''));
      timeLimit.setHours(timeLimit.getHours() - hours);
      
      const filteredMetrics = prevMetrics.filter(m => new Date(m.timestamp) > timeLimit);
      
      return [...filteredMetrics, {
        timestamp: now.toISOString(),
        ...newCurrentMetrics
      }];
    });
    
    // アラートチェック
    checkAlerts(newCurrentMetrics);
  };

  // データ更新のためのタイマー設定
  useEffect(() => {
    const getRefreshInterval = () => {
      const value = refreshRate.replace('s', '').replace('m', '');
      const unit = refreshRate.includes('s') ? 1000 : 60000;
      return parseInt(value) * unit;
    };
    
    // 初回データ生成
    generateFakeData();
    
    const interval = setInterval(() => {
      setIsLoading(true);
      setTimeout(() => {
        generateFakeData();
        setIsLoading(false);
      }, 500);
    }, getRefreshInterval());
    
    return () => clearInterval(interval);
  }, [refreshRate, timeRange]);

  // アラートチェック関数
  const checkAlerts = (data) => {
    const now = new Date();
    const newAlerts = [];
    
    Object.entries(data).forEach(([key, value]) => {
      // スキップするキー
      if (['pods', 'nodes', 'deployments', 'services', 'lastUpdated'].includes(key)) return;
      
      if (thresholds[key] && value >= thresholds[key].critical) {
        newAlerts.push({
          type: 'critical',
          metric: key,
          value: value,
          threshold: thresholds[key].critical,
          timestamp: now.toISOString()
        });
      } else if (thresholds[key] && value >= thresholds[key].warning) {
        newAlerts.push({
          type: 'warning',
          metric: key,
          value: value,
          threshold: thresholds[key].warning,
          timestamp: now.toISOString()
        });
      }
    });
    
    if (newAlerts.length > 0) {
      setAlerts(prevAlerts => [...newAlerts, ...prevAlerts].slice(0, 50)); // 最大50件まで保存
    }
  };

  // 現在のアラート数をカウント
  const criticalAlertCount = useMemo(() => 
    alerts.filter(a => a.type === 'critical').length, [alerts]);
    
  const warningAlertCount = useMemo(() => 
    alerts.filter(a => a.type === 'warning').length, [alerts]);

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      {/* ヘッダー部分 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Server className="text-blue-500" />
            Kubernetes SREモニタリング
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            最終更新: {new Date(currentMetrics.lastUpdated).toLocaleString()}
            {isLoading && <span className="ml-2 inline-block animate-spin"><RefreshCw size={14} /></span>}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-gray-400" />
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32 bg-gray-800 border-gray-700">
                <SelectValue placeholder="時間範囲" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {timeRanges.map(range => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <RefreshCw size={16} className="text-gray-400" />
            <Select value={refreshRate} onValueChange={setRefreshRate}>
              <SelectTrigger className="w-32 bg-gray-800 border-gray-700">
                <SelectValue placeholder="更新頻度" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {refreshRates.map(rate => (
                  <SelectItem key={rate.value} value={rate.value}>
                    {rate.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            {criticalAlertCount > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle size={14} />
                危険 {criticalAlertCount}
              </Badge>
            )}
            {warningAlertCount > 0 && (
              <Badge variant="warning" className="flex items-center gap-1 bg-yellow-600">
                <Bell size={14} />
                警告 {warningAlertCount}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* タブナビゲーション */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">
            概要
          </TabsTrigger>
          <TabsTrigger value="metrics" className="data-[state=active]:bg-blue-600">
            詳細メトリクス
          </TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-blue-600">
            アラート履歴
          </TabsTrigger>
        </TabsList>
        
        {/* タブコンテンツ：概要 */}
        <TabsContent value="overview" className="mt-4">
          {/* メトリクスゲージセクション */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Activity className="mr-2 text-blue-500" size={18} />
                  CPU使用率
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center p-4">
                <GaugeChart 
                  value={currentMetrics.cpu} 
                  title="CPU使用率" 
                  thresholds={thresholds.cpu}
                />
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Server className="mr-2 text-blue-500" size={18} />
                  メモリ使用率
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center p-4">
                <GaugeChart 
                  value={currentMetrics.memory} 
                  title="メモリ使用率" 
                  thresholds={thresholds.memory}
                />
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <HardDrive className="mr-2 text-blue-500" size={18} />
                  ディスク使用率
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center p-4">
                <GaugeChart 
                  value={currentMetrics.disk} 
                  title="ディスク使用率" 
                  thresholds={thresholds.disk}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* クラスター状態サマリー */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">クラスターステータス</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-sm">Pods</span>
                    <span className="text-2xl font-bold">{currentMetrics.pods}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-sm">Nodes</span>
                    <span className="text-2xl font-bold">{currentMetrics.nodes}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-sm">Deployments</span>
                    <span className="text-2xl font-bold">{currentMetrics.deployments}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-sm">Services</span>
                    <span className="text-2xl font-bold">{currentMetrics.services}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">最新アラート</CardTitle>
              </CardHeader>
              <CardContent>
                {alerts.length > 0 ? (
                  <AlertHistory alerts={alerts.slice(0, 3)} />
                ) : (
                  <div className="text-center py-4 text-gray-400">
                    <p>現在アクティブなアラートはありません</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* CPU使用率履歴グラフ */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg">CPU使用率履歴</CardTitle>
            </CardHeader>
            <CardContent>
              <MetricHistoryChart 
                data={metrics} 
                metric="cpu" 
                threshold={thresholds.cpu}
                timeRange={timeRange}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* タブコンテンツ：詳細メトリクス */}
        <TabsContent value="metrics" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">CPU使用率履歴</CardTitle>
              </CardHeader>
              <CardContent>
                <MetricHistoryChart 
                  data={metrics} 
                  metric="cpu" 
                  threshold={thresholds.cpu}
                  timeRange={timeRange}
                />
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">メモリ使用率履歴</CardTitle>
              </CardHeader>
              <CardContent>
                <MetricHistoryChart 
                  data={metrics} 
                  metric="memory" 
                  threshold={thresholds.memory}
                  timeRange={timeRange}
                />
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">ディスク使用率履歴</CardTitle>
              </CardHeader>
              <CardContent>
                <MetricHistoryChart 
                  data={metrics} 
                  metric="disk" 
                  threshold={thresholds.disk}
                  timeRange={timeRange}
                />
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">ネットワーク使用率履歴</CardTitle>
              </CardHeader>
              <CardContent>
                <MetricHistoryChart 
                  data={metrics} 
                  metric="network" 
                  threshold={thresholds.network}
                  timeRange={timeRange}
                />
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">レイテンシ履歴</CardTitle>
              </CardHeader>
              <CardContent>
                <MetricHistoryChart 
                  data={metrics} 
                  metric="latency" 
                  threshold={thresholds.latency}
                  timeRange={timeRange}
                />
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">その他メトリクス</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col p-4 bg-gray-700 rounded-lg">
                    <span className="text-gray-400 text-sm mb-1">ネットワーク使用率</span>
                    <GaugeChart 
                      value={currentMetrics.network} 
                      title="ネットワーク" 
                      thresholds={thresholds.network}
                    />
                  </div>
                  
                  <div className="flex flex-col p-4 bg-gray-700 rounded-lg">
                    <span className="text-gray-400 text-sm mb-1">レイテンシ</span>
                    <GaugeChart 
                      value={currentMetrics.latency} 
                      title="レイテンシ" 
                      thresholds={thresholds.latency}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* タブコンテンツ：アラート履歴 */}
        <TabsContent value="alerts" className="mt-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg">アラート履歴</CardTitle>
            </CardHeader>
            <CardContent>
              <AlertHistory alerts={alerts} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KubernetesDashboard;