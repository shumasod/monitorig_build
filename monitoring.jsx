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
