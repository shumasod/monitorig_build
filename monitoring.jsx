import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

const GaugeChart = ({ value, title, thresholds }) => {
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

  return (
    <div className="relative w-48 h-48">
      <svg className="w-full h-full" viewBox="0 0 200 200">
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
          y="90"
          textAnchor="middle"
          className="fill-white text-2xl font-bold"
        >
          {normalizedValue.toFixed(1)}%
        </text>
        <text
          x="100"
          y="115"
          textAnchor="middle"
          className="fill-gray-400 text-sm"
        >
          {title}
        </text>
        <text
          x="100"
          y="135"
          textAnchor="middle"
          className="fill-gray-500 text-xs"
        >
          警告: {thresholds.warning}% / 危険: {thresholds.critical}%
        </text>
      </svg>
    </div>
  );
};

const KubernetesDashboard = () => {
  const [timeRange, setTimeRange] = useState('1h');
  const [metrics, setMetrics] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // 閾値設定
  const thresholds = {
    cpu: { warning: 70, critical: 85 },
    memory: { warning: 80, critical: 90 },
    disk: { warning: 75, critical: 85 }
  };

  // 時間範囲オプション
  const timeRanges = [
    { value: '1h', label: '1時間' },
    { value: '3h', label: '3時間' },
    { value: '6h', label: '6時間' },
    { value: '12h', label: '12時間' },
    { value: '24h', label: '24時間' }
  ];

  // 10分間隔でのデータ更新
  useEffect(() => {
    const fetchData = async () => {
      // 実際の実装ではAPIからデータを取得
      const newData = {
        cpu: 43.2,
        memory: 28.3,
        disk: 5.937,
        // ... その他のメトリクス
      };
      
      setMetrics(prevMetrics => [...prevMetrics, {
        timestamp: new Date().toISOString(),
        ...newData
      }]);

      // アラートの確認
      checkAlerts(newData);
    };

    const interval = setInterval(fetchData, 600000); // 10分
    return () => clearInterval(interval);
  }, []);

  // アラートチェック
  const checkAlerts = (data) => {
    const newAlerts = [];
    
    Object.entries(data).forEach(([key, value]) => {
      if (value >= thresholds[key]?.critical) {
        newAlerts.push({
          type: 'critical',
          metric: key,
          value: value,
          threshold: thresholds[key].critical
        });
      } else if (value >= thresholds[key]?.warning) {
        newAlerts.push({
          type: 'warning',
          metric: key,
          value: value,
          threshold: thresholds[key].warning
        });
      }
    });

    setAlerts(newAlerts);
  };

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Kubernetes キャパシティ監視</h1>
        
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="時間範囲" />
          </SelectTrigger>
          <SelectContent>
            {timeRanges.map(range => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* アラート表示 */}
      {alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {alerts.map((alert, index) => (
            <Alert
              key={index}
              variant={alert.type === 'critical' ? 'destructive' : 'warning'}
            >
              <AlertDescription>
                {alert.type === 'critical' ? '危険' : '警告'}: 
                {alert.metric === 'cpu' && 'CPU使用率'}
                {alert.metric === 'memory' && 'メモリ使用率'}
                {alert.metric === 'disk' && 'ディスク使用率'}
                が {alert.value.toFixed(1)}% です
                （閾値: {alert.threshold}%）
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* メトリクスゲージ */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex justify-center p-4">
            <GaugeChart 
              value={43.2} 
              title="CPU使用率" 
              thresholds={thresholds.cpu}
            />
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex justify-center p-4">
            <GaugeChart 
              value={28.3} 
              title="メモリ使用率" 
              thresholds={thresholds.memory}
            />
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex justify-center p-4">
            <GaugeChart 
              value={5.937} 
              title="ディスク使用率" 
              thresholds={thresholds.disk}
            />
          </CardContent>
        </Card>

        {/* 以下、グラフコンポーネント（前回と同様） */}
        {/* ... */}
      </div>
    </div>
  );
};

export default KubernetesDashboard;
