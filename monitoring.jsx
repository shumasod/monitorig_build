import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertTriangle, Bell, Clock, Server, HardDrive, Activity, Layers, Zap, Database, Wifi, FileText, Search, BarChart2, Cpu } from 'lucide-react';

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
const MetricHistoryChart = ({ data, metric, threshold, timeRange, anomalyPoints = [] }) => {
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
      latency: 'レイテンシ',
      errors: 'エラー率',
      saturation: '飽和度'
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
        
        {/* 異常値のマーカー表示 */}
        {anomalyPoints.map((point, index) => (
          <ReferenceLine
            key={index}
            x={point.timestamp}
            stroke="#ef4444"
            strokeWidth={2}
          />
        ))}
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
      latency: 'レイテンシ',
      errors: 'エラー率',
      saturation: '飽和度'
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
              alert.type === 'anomaly' ? 'bg-purple-950/50 border-l-4 border-purple-600' :
              'bg-yellow-950/50 border-l-4 border-yellow-600'}
          `}
        >
          <AlertTriangle className={
            alert.type === 'critical' ? 'text-red-500' : 
            alert.type === 'anomaly' ? 'text-purple-500' :
            'text-yellow-500'
          } size={20} />
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium">
                {alert.type === 'critical' ? '危険' : 
                 alert.type === 'anomaly' ? '異常検知' : '警告'}: {getMetricLabel(alert.metric)}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-sm text-gray-300">
              {alert.type === 'anomaly' 
                ? `検出された異常値: ${alert.value.toFixed(1)}% (通常予測: ${alert.expected.toFixed(1)}%)`
                : `値: ${alert.value.toFixed(1)}% (閾値: ${alert.threshold}%)`
              }
            </p>
            {alert.service && (
              <p className="text-xs text-gray-400 mt-1">
                影響サービス: {alert.service}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// トレース詳細コンポーネント
const TraceDetail = ({ trace }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!trace) return null;
  
  return (
    <div className="border border-gray-700 rounded-md mb-4">
      <div className="p-3 bg-gray-800 flex justify-between items-center cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${trace.status === 'error' ? 'bg-red-500' : 'bg-green-500'}`}></span>
          <span className="font-medium">{trace.name}</span>
          <Badge variant="outline" className="ml-2">{trace.duration}ms</Badge>
        </div>
        <div className="text-gray-400 text-sm">
          {trace.timestamp}
        </div>
      </div>
      
      {expanded && (
        <div className="p-4 border-t border-gray-700">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-gray-400 text-xs mb-1">トレースID</p>
              <p className="font-mono text-sm">{trace.id}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">サービス</p>
              <p className="text-sm">{trace.service}</p>
            </div>
          </div>
          
          <p className="text-gray-400 text-xs mb-1">スパン</p>
          <div className="relative ml-4 mt-2">
            {trace.spans.map((span, index) => (
              <div key={index} className="border-l-2 border-gray-600 pl-4 pb-4 relative">
                <div className="absolute left-0 top-0 w-3 h-3 rounded-full bg-gray-600 -translate-x-1.5"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{span.name}</p>
                    <p className="text-gray-400 text-xs">{span.service}</p>
                  </div>
                  <Badge variant="outline">{span.duration}ms</Badge>
                </div>
                {span.error && (
                  <div className="mt-2 text-xs text-red-400 bg-red-950/30 p-2 rounded-md">
                    {span.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 四分位数計算関数
const calculateQuantiles = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const len = sorted.length;
  
  return {
    min: sorted[0],
    q1: sorted[Math.floor(len * 0.25)],
    median: sorted[Math.floor(len * 0.5)],
    q3: sorted[Math.floor(len * 0.75)],
    max: sorted[len - 1]
  };
};

// 異常検知（簡易版）
const detectAnomalies = (data, metric, windowSize = 5, threshold = 2.5) => {
  if (data.length < windowSize * 2) return [];
  
  const anomalies = [];
  
  for (let i = windowSize; i < data.length; i++) {
    // 直近のウィンドウでの値を取得
    const window = data.slice(i - windowSize, i).map(d => d[metric]);
    
    // 平均と標準偏差を計算
    const mean = window.reduce((sum, val) => sum + val, 0) / window.length;
    const stdDev = Math.sqrt(
      window.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / window.length
    );
    
    // 現在の値と予測値の差がしきい値を超えるかチェック
    const currentValue = data[i][metric];
    const zScore = Math.abs((currentValue - mean) / (stdDev || 1));
    
    if (zScore > threshold) {
      anomalies.push({
        timestamp: data[i].timestamp,
        value: currentValue,
        expected: mean,
        zScore: zScore
      });
    }
  }
  
  return anomalies;
};

// ログ検索コンポーネント
const LogSearch = ({ logs, onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severity, setSeverity] = useState('all');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch({ term: searchTerm, severity });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="ログを検索..."
            className="w-full p-2 pl-8 bg-gray-700 border border-gray-600 rounded-md"
          />
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
        </div>
        <Select value={severity} onValueChange={setSeverity}>
          <SelectTrigger className="w-32 bg-gray-700 border-gray-600">
            <SelectValue placeholder="重要度" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="error">エラー</SelectItem>
            <SelectItem value="warning">警告</SelectItem>
            <SelectItem value="info">情報</SelectItem>
            <SelectItem value="debug">デバッグ</SelectItem>
          </SelectContent>
        </Select>
        <button 
          type="submit" 
          className="p-2 bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-1"
        >
          <Search size={16} />
          検索
        </button>
      </div>
    </form>
  );
};

// ログエントリコンポーネント
const LogEntry = ({ log }) => {
  const [expanded, setExpanded] = useState(false);
  
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'error': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      case 'info': return 'text-blue-500';
      case 'debug': return 'text-gray-400';
      default: return 'text-gray-200';
    }
  };
  
  const getSeverityBg = (severity) => {
    switch (severity) {
      case 'error': return 'bg-red-950/40';
      case 'warning': return 'bg-yellow-950/40';
      case 'info': return 'bg-blue-950/40';
      case 'debug': return 'bg-gray-800/40';
      default: return 'bg-gray-800';
    }
  };

  return (
    <div 
      className={`border border-gray-700 rounded-md mb-2 ${getSeverityBg(log.severity)}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-2 flex items-start justify-between cursor-pointer">
        <div className="flex items-start gap-2">
          <span className={`font-mono inline-block rounded px-1 text-xs ${getSeverityColor(log.severity)}`}>
            [{log.severity.toUpperCase()}]
          </span>
          <span className="text-sm">
            {expanded ? log.message : log.message.substring(0, 100) + (log.message.length > 100 ? '...' : '')}
          </span>
        </div>
        <div className="text-xs text-gray-400 whitespace-nowrap ml-2">
          {new Date(log.timestamp).toLocaleTimeString()}
        </div>
      </div>
      
      {expanded && log.details && (
        <div className="p-2 pt-0 text-xs font-mono border-t border-gray-700 overflow-x-auto">
          <pre className="whitespace-pre-wrap">{JSON.stringify(log.details, null, 2)}</pre>
        </div>
      )}
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
    errors: 2.1,
    saturation: 45.3,
    pods: 24,
    nodes: 3,
    deployments: 12,
    services: 15,
    lastUpdated: new Date().toISOString()
  });
  const [alerts, setAlerts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [traces, setTraces] = useState([]);
  const [anomalies, setAnomalies] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedService, setSelectedService] = useState('all');
  const [selectedNode, setSelectedNode] = useState('all');

  // 閾値設定
  const thresholds = {
    cpu: { warning: 70, critical: 85 },
    memory: { warning: 80, critical: 90 },
    disk: { warning: 75, critical: 85 },
    network: { warning: 60, critical: 80 },
    latency: { warning: 40, critical: 60 },
    errors: { warning: 5, critical: 10 },
    saturation: { warning: 70, critical: 90 }
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

  // 利用可能なサービス
  const services = [
    { id: 'all', name: 'すべてのサービス' },
    { id: 'api-gateway', name: 'APIゲートウェイ' },
    { id: 'auth-service', name: '認証サービス' },
    { id: 'user-service', name: 'ユーザーサービス' },
    { id: 'product-service', name: '商品サービス' },
    { id: 'order-service', name: '注文サービス' },
    { id: 'payment-service', name: '決済サービス' },
    { id: 'notification-service', name: '通知サービス' }
  ];

  // 利用可能なノード
  const nodes = [
    { id: 'all', name: 'すべてのノード' },
    { id: 'node-1', name: 'Node-1' },
    { id: 'node-2', name: 'Node-2' },
    { id: 'node-3', name: 'Node-3' }
  ];

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
          timestamp: now.toISOString(),
          service: services[Math.floor(Math.random() * (services.length - 1)) + 1].name
        });
      } else if (thresholds[key] && value >= thresholds[key].warning) {
        newAlerts.push({
          type: 'warning',
          metric: key,
          value: value,
          threshold: thresholds[key].warning,
          timestamp: now.toISOString(),
          service: services[Math.floor(Math.random() * (services.length - 1)) + 1].name
        });
      }
    });
    
    if (newAlerts.length > 0) {
      setAlerts(prevAlerts => [...newAlerts, ...prevAlerts].slice(0, 50)); // 最大50件まで保存
    }
  };

  // 異常検知の実行
  const runAnomalyDetection = () => {
    const metricsToCheck = ['cpu', 'memory', 'latency', 'errors'];
    const newAnomalies = {};
    
    metricsToCheck.forEach(metric => {
      const anomalies = detectAnomalies(metrics, metric);
      newAnomalies[metric] = anomalies;
      
      // 新しい異常があれば、アラートに追加
      const latestAnomalies = anomalies
        .filter(a => {
          const anomalyTime = new Date(a.timestamp).getTime();
          const fiveMinutesAgo = new Date().getTime() - 5 * 60 * 1000;
          return anomalyTime > fiveMinutesAgo;
        })
        .map(a => ({
          type: 'anomaly',
          metric,
          value: a.value,
          expected: a.expected,
          timestamp: a.timestamp,
          service: services[Math.floor(Math.random() * (services.length - 1)) + 1].name
        }));
      
      if (latestAnomalies.length > 0) {
        setAlerts(prev => [...latestAnomalies, ...prev].slice(0, 50));
      }
    });
    
    setAnomalies(newAnomalies);
  };

  // ランダムログ生成
  const generateRandomLogs = () => {
    const severities = ['info', 'debug', 'warning', 'error'];
    const serviceIds = services.slice(1).map(s => s.id);
    const messageTemplates = [
      'コンテナが開始されました',
      'ポッドが再起動されました',
      'メモリ使用量が上昇しています',
      'API呼び出しに失敗しました',
      'データベース接続エラーが発生しました',
      'ノードがダウンしました',
      'スケーリングイベントが開始されました',
      'バックアップ操作が完了しました'
    ];
    
    // 25%の確率で新しいログを追加
    if (Math.random() < 0.25) {
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const serviceId = serviceIds[Math.floor(Math.random() * serviceIds.length)];
      const message = messageTemplates[Math.floor(Math.random() * messageTemplates.length)];
      
      const newLog = {
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        severity,
        service: serviceId,
        message: `[${serviceId}] ${message}`,
        details: severity === 'error' ? {
          stackTrace: 'Error: Connection refused at /app/service.js:127:23',
          errorCode: `ERR${Math.floor(Math.random() * 1000)}`,
          context: { attempt: Math.floor(Math.random() * 5) + 1 }
        } : null
      };
      
      setLogs(prev => [newLog, ...prev].slice(0, 100));
      setFilteredLogs(prev => [newLog, ...prev].slice(0, 100));
    }
  };

  // ランダムトレース生成
  const generateRandomTraces = () => {
    // 10%の確率で新しいトレースを追加
    if (Math.random() < 0.1) {
      const serviceIds = services.slice(1).map(s => s.id);
      const hasError = Math.random() < 0.2;
      const traceId = `trace-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const mainService = serviceIds[Math.floor(Math.random() * serviceIds.length)];
      const duration = Math.floor(Math.random() * 500) + 50;
      
      // スパンの生成
      const spans = [];
      const spanCount = Math.floor(Math.random() * 5) + 2;
      let accumulatedTime = 0;
      
      for (let i = 0; i < spanCount; i++) {
        const spanService = serviceIds[Math.floor(Math.random() * serviceIds.length)];
        const spanDuration = Math.floor((duration / spanCount) * (Math.random() * 0.6 + 0.7));
        accumulatedTime += spanDuration;
        
        spans.push({
          name: `${spanService}.process`,
          service: spanService,
          duration: spanDuration,
          error: hasError && i === spanCount - 1 ? 'HTTP 500: Internal Server Error' : null
        });
      }
      
      const newTrace = {
        id: traceId,
        name: `${mainService}.request`,
        service: mainService,
        duration: duration,
        timestamp: new Date().toLocaleTimeString(),
        status: hasError ? 'error' : 'success',
        spans: spans
      };
      
      setTraces(prev => [newTrace, ...prev].slice(0, 20));
    }
  };
  
  // 擬似データ生成関数
  const generateFakeData = useCallback(() => {
    const now = new Date();
    
    // 現在のメトリクスを更新（変動あり）
    const newCurrentMetrics = {
      cpu: Math.min(100, Math.max(0, currentMetrics.cpu + (Math.random() * 10 - 5))),
      memory: Math.min(100, Math.max(0, currentMetrics.memory + (Math.random() * 8 - 4))),
      disk: Math.min(100, Math.max(0, currentMetrics.disk + (Math.random() * 2 - 0.5))),
      network: Math.min(100,
// データ更新のためのタイマー設定
  useEffect(() => {
    const getRefreshInterval = () => {
      const value = refreshRate.replace('s', '').replace('m', '');
      const unit = refreshRate.includes('s') ? 1000 : 60000;
      return parseInt(value, 10) * unit;
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
  }, [refreshRate, timeRange, generateFakeData]);

  // ログ検索処理
  const handleLogSearch = useCallback(({ term, severity }) => {
    const filtered = logs.filter(log => {
      const matchesSeverity = severity === 'all' || log.severity === severity;
      const matchesTerm = !term || 
        log.message.toLowerCase().includes(term.toLowerCase()) ||
        (log.details && JSON.stringify(log.details).toLowerCase().includes(term.toLowerCase()));
      
      return matchesSeverity && matchesTerm;
    });
    
    setFilteredLogs(filtered);
  }, [logs]);

  // サービスフィルタリング
  const filteredTraces = useMemo(() => {
    if (selectedService === 'all') return traces;
    return traces.filter(trace => trace.service === selectedService);
  }, [traces, selectedService]);

  // 現在のアラート数をカウント
  const criticalAlertCount = useMemo(() => 
    alerts.filter(a => a.type === 'critical').length, [alerts]);
    
  const warningAlertCount = useMemo(() => 
    alerts.filter(a => a.type === 'warning').length, [alerts]);
    
  const anomalyAlertCount = useMemo(() => 
    alerts.filter(a => a.type === 'anomaly').length, [alerts]);

  // メトリクスサマリー統計
  const metricsSummary = useMemo(() => {
    if (metrics.length === 0) return null;
    
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);
    
    const recentMetrics = metrics.filter(m => new Date(m.timestamp) > last24Hours);
    
    const summary = {};
    ['cpu', 'memory', 'disk', 'network', 'latency', 'errors'].forEach(metric => {
      const values = recentMetrics.map(m => m[metric]);
      summary[metric] = calculateQuantiles(values);
    });
    
    return summary;
  }, [metrics]);

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
            {anomalyAlertCount > 0 && (
              <Badge variant="outline" className="flex items-center gap-1 bg-purple-800 text-white">
                <Activity size={14} />
                異常検知 {anomalyAlertCount}
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
          <TabsTrigger value="logs" className="data-[state=active]:bg-blue-600">
            ログ
          </TabsTrigger>
          <TabsTrigger value="traces" className="data-[state=active]:bg-blue-600">
            トレース
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
          
          {/* SLIセクション（追加機能） */}
          <div className="mb-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">SLI (サービスレベル指標)</CardTitle>
                <CardDescription className="text-gray-400">
                  過去24時間のパフォーマンス指標
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-700 p-3 rounded-md">
                    <div className="text-gray-400 text-xs mb-1">可用性</div>
                    <div className="text-xl font-bold">99.92%</div>
                    <div className="text-green-400 text-xs mt-1 flex items-center">
                      <span>SLO: 99.9%</span>
                      <Badge className="ml-2 bg-green-700 text-xs">達成中</Badge>
                    </div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-md">
                    <div className="text-gray-400 text-xs mb-1">レイテンシ（p99）</div>
                    <div className="text-xl font-bold">210ms</div>
                    <div className="text-yellow-400 text-xs mt-1 flex items-center">
                      <span>SLO: 200ms</span>
                      <Badge className="ml-2 bg-yellow-700 text-xs">警告</Badge>
                    </div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-md">
                    <div className="text-gray-400 text-xs mb-1">エラー率</div>
                    <div className="text-xl font-bold">{currentMetrics.errors.toFixed(2)}%</div>
                    <div className="text-green-400 text-xs mt-1 flex items-center">
                      <span>SLO: 0.5%</span>
                      <Badge className="ml-2 bg-green-700 text-xs">達成中</Badge>
                    </div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-md">
                    <div className="text-gray-400 text-xs mb-1">飽和度</div>
                    <div className="text-xl font-bold">{currentMetrics.saturation.toFixed(1)}%</div>
                    <div className="text-green-400 text-xs mt-1 flex items-center">
                      <span>SLO: 80%</span>
                      <Badge className="ml-2 bg-green-700 text-xs">達成中</Badge>
                    </div>
                  </div>
                </div>
                
                {/* エラーバジェット表示 */}
                <div className="bg-gray-700 p-4 rounded-md">
                  <div className="mb-2 flex justify-between items-center">
                    <div>
                      <span className="font-medium">エラーバジェット消費</span>
                      <span className="text-xs text-gray-400 ml-2">（直近30日間）</span>
                    </div>
                    <Badge className="bg-blue-600">残り76.3%</Badge>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2.5">
                    <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '76.3%' }}></div>
                  </div>
                  <div className="mt-2 text-xs text-gray-400 flex justify-between">
                    <span>消費: 23.7%</span>
                    <span>目標: 月間99.9%の稼働時間 = 43分以内のダウンタイム</span>
                  </div>
                </div>
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
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <h4 className="font-medium mb-2">サービス健全性</h4>
                  <div className="space-y-2">
                    {services.slice(1).map((service, index) => (
                      <div key={service.id} className="flex items-center">
                        <span className={`w-2 h-2 rounded-full ${index % 3 === 0 ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                        <span className="ml-2">{service.name}</span>
                        <div className="ml-auto text-xs text-gray-400">
                          {index % 3 === 0 ? '警告' : '正常'}
                        </div>
                      </div>
                    ))}
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
          
          {/* CPU使用率履歴グラフ（異常検知付き） */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">CPU使用率履歴</CardTitle>
              <Badge variant="outline" className="bg-purple-900/50">
                <Activity size={14} className="mr-1" />
                異常検知有効
              </Badge>
            </CardHeader>
            <CardContent>
              <MetricHistoryChart 
                data={metrics} 
                metric="cpu" 
                threshold={thresholds.cpu}
                timeRange={timeRange}
                anomalyPoints={anomalies.cpu || []}
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
                  anomalyPoints={anomalies.cpu || []}
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
                  anomalyPoints={anomalies.memory || []}
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
                  anomalyPoints={anomalies.latency || []}
                />
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">エラー率履歴</CardTitle>
              </CardHeader>
              <CardContent>
                <MetricHistoryChart 
                  data={metrics} 
                  metric="errors" 
                  threshold={thresholds.errors}
                  timeRange={timeRange}
                  anomalyPoints={anomalies.errors || []}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* メトリクス統計サマリー */}
          {metricsSummary && (
            <Card className="bg-gray-800 border-gray-700 mt-6">
              <CardHeader>
                <CardTitle className="text-lg">メトリクス統計サマリー（24時間）</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left text-gray-400 py-2">メトリクス</th>
                        <th className="text-right text-gray-400 py-2">最小</th>
                        <th className="text-right text-gray-400 py-2">第1四分位</th>
                        <th className="text-right text-gray-400 py-2">中央値</th>
                        <th className="text-right text-gray-400 py-2">第3四分位</th>
                        <th className="text-right text-gray-400 py-2">最大</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(metricsSummary).map(([metric, stats]) => (
                        <tr key={metric} className="border-t border-gray-700">
                          <td className="py-2 font-medium">
                            {metric === 'cpu' ? 'CPU使用率' :
                             metric === 'memory' ? 'メモリ使用率' :
                             metric === 'disk' ? 'ディスク使用率' :
                             metric === 'network' ? 'ネットワーク使用率' :
                             metric === 'latency' ? 'レイテンシ' : 
                             metric === 'errors' ? 'エラー率' : metric}
                          </td>
                          <td className="py-2 text-right">{stats.min.toFixed(1)}%</td>
                          <td className="py-2 text-right">{stats.q1.toFixed(1)}%</td>
                          <td className="py-2 text-right">{stats.median.toFixed(1)}%</td>
                          <td className="py-2 text-right">{stats.q3.toFixed(1)}%</td>
                          <td className="py-2 text-right">{stats.max.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* タブコンテンツ：ログ */}
        <TabsContent value="logs" className="mt-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg">ログ分析</CardTitle>
            </CardHeader>
            <CardContent>
              <LogSearch logs={logs} onSearch={handleLogSearch} />
              
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  表示中: {filteredLogs.length} / {logs.length} 件
                </div>
                <div className="flex gap-2">
                  <Badge className="bg-red-600">エラー: {logs.filter(l => l.severity === 'error').length}</Badge>
                  <Badge className="bg-yellow-600">警告: {logs.filter(l => l.severity === 'warning').length}</Badge>
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto pr-2">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map(log => <LogEntry key={log.id} log={log} />)
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <FileText className="mx-auto mb-2 opacity-30" size={24} />
                    <p>ログがありません</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* タブコンテンツ：トレース */}
        <TabsContent value="traces" className="mt-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg">分散トレース</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center justify-between">
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger className="w-64 bg-gray-700 border-gray-600">
                    <SelectValue placeholder="サービスを選択" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {services.map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-sm text-gray-400">
                  表示中: {filteredTraces.length} / {traces.length} トレース
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto pr-1">
                {filteredTraces.length > 0 ? (
                  filteredTraces.map(trace => <TraceDetail key={trace.id} trace={trace} />)
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Layers className="mx-auto mb-2 opacity-30" size={24} />
                    <p>トレースデータがありません</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* タブコンテンツ：アラート履歴 */}
        <TabsContent value="alerts" className="mt-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg">アラート履歴</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-red-900/30 p-3 rounded-md text-center">
                    <div className="text-gray-300 text-xs mb-1">危険</div>
                    <div className="text-xl font-bold text-red-400">{criticalAlertCount}</div>
                  </div>
                  <div className="bg-yellow-900/30 p-3 rounded-md text-center">
                    <div className="text-gray-300 text-xs mb-1">警告</div>
                    <div className="text-xl font-bold text-yellow-400">{warningAlertCount}</div>
                  </div>
                  <div className="bg-purple-900/30 p-3 rounded-md text-center">
                    <div className="text-gray-300 text-xs mb-1">異常検知</div>
                    <div className="text-xl font-bold text-purple-400">{anomalyAlert
// データ更新のためのタイマー設定
  useEffect(() => {
    const getRefreshInterval = () => {
      const value = refreshRate.replace('s', '').replace('m', '');
      const unit = refreshRate.includes('s') ? 1000 : 60000;
      return parseInt(value, 10) * unit;
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
  }, [refreshRate, timeRange, generateFakeData]);

  // ログ検索処理
  const handleLogSearch = useCallback(({ term, severity }) => {
    const filtered = logs.filter(log => {
      const matchesSeverity = severity === 'all' || log.severity === severity;
      const matchesTerm = !term || 
        log.message.toLowerCase().includes(term.toLowerCase()) ||
        (log.details && JSON.stringify(log.details).toLowerCase().includes(term.toLowerCase()));
      
      return matchesSeverity && matchesTerm;
    });
    
    setFilteredLogs(filtered);
  }, [logs]);

  // サービスフィルタリング
  const filteredTraces = useMemo(() => {
    if (selectedService === 'all') return traces;
    return traces.filter(trace => trace.service === selectedService);
  }, [traces, selectedService]);

  // 現在のアラート数をカウント
  const criticalAlertCount = useMemo(() => 
    alerts.filter(a => a.type === 'critical').length, [alerts]);
    
  const warningAlertCount = useMemo(() => 
    alerts.filter(a => a.type === 'warning').length, [alerts]);
    
  const anomalyAlertCount = useMemo(() => 
    alerts.filter(a => a.type === 'anomaly').length, [alerts]);

  // メトリクスサマリー統計
  const metricsSummary = useMemo(() => {
    if (metrics.length === 0) return null;
    
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);
    
    const recentMetrics = metrics.filter(m => new Date(m.timestamp) > last24Hours);
    
    const summary = {};
    ['cpu', 'memory', 'disk', 'network', 'latency', 'errors'].forEach(metric => {
      const values = recentMetrics.map(m => m[metric]);
      summary[metric] = calculateQuantiles(values);
    });
    
    return summary;
  }, [metrics]);

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
            {anomalyAlertCount > 0 && (
              <Badge variant="outline" className="flex items-center gap-1 bg-purple-800 text-white">
                <Activity size={14} />
                異常検知 {anomalyAlertCount}
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
          <TabsTrigger value="logs" className="data-[state=active]:bg-blue-600">
            ログ
          </TabsTrigger>
          <TabsTrigger value="traces" className="data-[state=active]:bg-blue-600">
            トレース
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
          
          {/* SLIセクション（追加機能） */}
          <div className="mb-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">SLI (サービスレベル指標)</CardTitle>
                <CardDescription className="text-gray-400">
                  過去24時間のパフォーマンス指標
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-700 p-3 rounded-md">
                    <div className="text-gray-400 text-xs mb-1">可用性</div>
                    <div className="text-xl font-bold">99.92%</div>
                    <div className="text-green-400 text-xs mt-1 flex items-center">
                      <span>SLO: 99.9%</span>
                      <Badge className="ml-2 bg-green-700 text-xs">達成中</Badge>
                    </div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-md">
                    <div className="text-gray-400 text-xs mb-1">レイテンシ（p99）</div>
                    <div className="text-xl font-bold">210ms</div>
                    <div className="text-yellow-400 text-xs mt-1 flex items-center">
                      <span>SLO: 200ms</span>
                      <Badge className="ml-2 bg-yellow-700 text-xs">警告</Badge>
                    </div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-md">
                    <div className="text-gray-400 text-xs mb-1">エラー率</div>
                    <div className="text-xl font-bold">{currentMetrics.errors.toFixed(2)}%</div>
                    <div className="text-green-400 text-xs mt-1 flex items-center">
                      <span>SLO: 0.5%</span>
                      <Badge className="ml-2 bg-green-700 text-xs">達成中</Badge>
                    </div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-md">
                    <div className="text-gray-400 text-xs mb-1">飽和度</div>
                    <div className="text-xl font-bold">{currentMetrics.saturation.toFixed(1)}%</div>
                    <div className="text-green-400 text-xs mt-1 flex items-center">
                      <span>SLO: 80%</span>
                      <Badge className="ml-2 bg-green-700 text-xs">達成中</Badge>
                    </div>
                  </div>
                </div>
                
                {/* エラーバジェット表示 */}
                <div className="bg-gray-700 p-4 rounded-md">
                  <div className="mb-2 flex justify-between items-center">
                    <div>
                      <span className="font-medium">エラーバジェット消費</span>
                      <span className="text-xs text-gray-400 ml-2">（直近30日間）</span>
                    </div>
                    <Badge className="bg-blue-600">残り76.3%</Badge>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2.5">
                    <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '76.3%' }}></div>
                  </div>
                  <div className="mt-2 text-xs text-gray-400 flex justify-between">
                    <span>消費: 23.7%</span>
                    <span>目標: 月間99.9%の稼働時間 = 43分以内のダウンタイム</span>
                  </div>
                </div>
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
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <h4 className="font-medium mb-2">サービス健全性</h4>
                  <div className="space-y-2">
                    {services.slice(1).map((service, index) => (
                      <div key={service.id} className="flex items-center">
                        <span className={`w-2 h-2 rounded-full ${index % 3 === 0 ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                        <span className="ml-2">{service.name}</span>
                        <div className="ml-auto text-xs text-gray-400">
                          {index % 3 === 0 ? '警告' : '正常'}
                        </div>
                      </div>
                    ))}
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
          
          {/* CPU使用率履歴グラフ（異常検知付き） */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">CPU使用率履歴</CardTitle>
              <Badge variant="outline" className="bg-purple-900/50">
                <Activity size={14} className="mr-1" />
                異常検知有効
              </Badge>
            </CardHeader>
            <CardContent>
              <MetricHistoryChart 
                data={metrics} 
                metric="cpu" 
                threshold={thresholds.cpu}
                timeRange={timeRange}
                anomalyPoints={anomalies.cpu || []}
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
                  anomalyPoints={anomalies.cpu || []}
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
                  anomalyPoints={anomalies.memory || []}
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
                  anomalyPoints={anomalies.latency || []}
                />
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">エラー率履歴</CardTitle>
              </CardHeader>
              <CardContent>
                <MetricHistoryChart 
                  data={metrics} 
                  metric="errors" 
                  threshold={thresholds.errors}
                  timeRange={timeRange}
                  anomalyPoints={anomalies.errors || []}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* メトリクス統計サマリー */}
          {metricsSummary && (
            <Card className="bg-gray-800 border-gray-700 mt-6">
              <CardHeader>
                <CardTitle className="text-lg">メトリクス統計サマリー（24時間）</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left text-gray-400 py-2">メトリクス</th>
                        <th className="text-right text-gray-400 py-2">最小</th>
                        <th className="text-right text-gray-400 py-2">第1四分位</th>
                        <th className="text-right text-gray-400 py-2">中央値</th>
                        <th className="text-right text-gray-400 py-2">第3四分位</th>
                        <th className="text-right text-gray-400 py-2">最大</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(metricsSummary).map(([metric, stats]) => (
                        <tr key={metric} className="border-t border-gray-700">
                          <td className="py-2 font-medium">
                            {metric === 'cpu' ? 'CPU使用率' :
                             metric === 'memory' ? 'メモリ使用率' :
                             metric === 'disk' ? 'ディスク使用率' :
                             metric === 'network' ? 'ネットワーク使用率' :
                             metric === 'latency' ? 'レイテンシ' : 
                             metric === 'errors' ? 'エラー率' : metric}
                          </td>
                          <td className="py-2 text-right">{stats.min.toFixed(1)}%</td>
                          <td className="py-2 text-right">{stats.q1.toFixed(1)}%</td>
                          <td className="py-2 text-right">{stats.median.toFixed(1)}%</td>
                          <td className="py-2 text-right">{stats.q3.toFixed(1)}%</td>
                          <td className="py-2 text-right">{stats.max.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* タブコンテンツ：ログ */}
        <TabsContent value="logs" className="mt-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg">ログ分析</CardTitle>
            </CardHeader>
            <CardContent>
              <LogSearch logs={logs} onSearch={handleLogSearch} />
              
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  表示中: {filteredLogs.length} / {logs.length} 件
                </div>
                <div className="flex gap-2">
                  <Badge className="bg-red-600">エラー: {logs.filter(l => l.severity === 'error').length}</Badge>
                  <Badge className="bg-yellow-600">警告: {logs.filter(l => l.severity === 'warning').length}</Badge>
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto pr-2">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map(log => <LogEntry key={log.id} log={log} />)
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <FileText className="mx-auto mb-2 opacity-30" size={24} />
                    <p>ログがありません</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* タブコンテンツ：トレース */}
        <TabsContent value="traces" className="mt-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg">分散トレース</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center justify-between">
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger className="w-64 bg-gray-700 border-gray-600">
                    <SelectValue placeholder="サービスを選択" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {services.map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-sm text-gray-400">
                  表示中: {filteredTraces.length} / {traces.length} トレース
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto pr-1">
                {filteredTraces.length > 0 ? (
                  filteredTraces.map(trace => <TraceDetail key={trace.id} trace={trace} />)
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Layers className="mx-auto mb-2 opacity-30" size={24} />
                    <p>トレースデータがありません</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* タブコンテンツ：アラート履歴 */}
        <TabsContent value="alerts" className="mt-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg">アラート履歴</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-red-900/30 p-3 rounded-md text-center">
                    <div className="text-gray-300 text-xs mb-1">危険</div>
                    <div className="text-xl font-bold text-red-400">{criticalAlertCount}</div>
                  </div>
                  <div className="bg-yellow-900/30 p-3 rounded-md text-center">
                    <div className="text-gray-300 text-xs mb-1">警告</div>
                    <div className="text-xl font-bold text-yellow-400">{warningAlertCount}</div>
                  </div>
                  <div className="bg-purple-900/30 p-3 rounded-md text-center">
                    <div className="text-gray-300 text-xs mb-1">異常検知</div>
                    <div className="text-xl font-bold text-purple-400">{anomalyAlertCount
                      
