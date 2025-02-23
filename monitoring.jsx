import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

const MetricsDashboard = () => {
  const [timeRange, setTimeRange] = useState('1h');

  // 時間範囲オプション
  const timeRanges = [
    { value: '1h', label: '1時間' },
    { value: '3h', label: '3時間' },
    { value: '6h', label: '6時間' },
    { value: '12h', label: '12時間' },
    { value: '24h', label: '24時間' }
  ];

  // 閾値の設定
  const thresholds = {
    cpu: { warning: 70, critical: 85 },
    memory: { warning: 80, critical: 90 },
    latency: { warning: 200, critical: 500 },
    errorRate: { warning: 1, critical: 5 }
  };

  // サンプルデータ（10分間隔）
  const timeSeriesData = [
    { time: '10:00', cpu: 65, memory: 75, latency: 120, errorRate: 0.2 },
    { time: '10:10', cpu: 70, memory: 80, latency: 150, errorRate: 0.5 },
    { time: '10:20', cpu: 75, memory: 85, latency: 180, errorRate: 1.0 },
    { time: '10:30', cpu: 68, memory: 82, latency: 160, errorRate: 0.8 },
    { time: '10:40', cpu: 72, memory: 78, latency: 140, errorRate: 0.6 },
    { time: '10:50', cpu: 77, memory: 83, latency: 170, errorRate: 0.9 }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">システムメトリクス</h2>
        
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

      {/* メトリクスカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(timeSeriesData[timeSeriesData.length - 1])
          .filter(([key]) => key !== 'time')
          .map(([key, value]) => (
            <Card key={key}>
              <CardContent className="p-4">
                <div>
                  <p className="text-sm text-gray-500">
                    {key === 'cpu' && 'CPU使用率'}
                    {key === 'memory' && 'メモリ使用率'}
                    {key === 'latency' && 'レイテンシー'}
                    {key === 'errorRate' && 'エラー率'}
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    {value.toFixed(1)}
                    {key === 'latency' ? 'ms' : '%'}
                  </p>
                  <div className="text-xs text-gray-500 mt-2">
                    <p>警告: {thresholds[key].warning}{key === 'latency' ? 'ms' : '%'}</p>
                    <p>危険: {thresholds[key].critical}{key === 'latency' ? 'ms' : '%'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
        ))}
      </div>

      {/* グラフ */}
      <Card>
        <CardHeader>
          <CardTitle>システムメトリクス推移</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <LineChart data={timeSeriesData} className="w-full">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend 
                formatter={(value) => {
                  switch(value) {
                    case 'cpu': return 'CPU使用率 (%)';
                    case 'memory': return 'メモリ使用率 (%)';
                    case 'latency': return 'レイテンシー (ms)';
                    case 'errorRate': return 'エラー率 (%)';
                    default: return value;
                  }
                }}
              />
              <Line type="monotone" dataKey="cpu" stroke="#8884d8" name="cpu" />
              <Line type="monotone" dataKey="memory" stroke="#82ca9d" name="memory" />
              <Line type="monotone" dataKey="latency" stroke="#ffc658" name="latency" />
              <Line type="monotone" dataKey="errorRate" stroke="#ff8042" name="errorRate" />
              
              {/* 閾値ライン */}
              <ReferenceLine y={thresholds.cpu.warning} stroke="#facc15" strokeDasharray="3 3" />
              <ReferenceLine y={thresholds.cpu.critical} stroke="#ef4444" strokeDasharray="3 3" />
            </LineChart>
          </div>
        </CardContent>
      </Card>

      {/* アラート表示 */}
      {Object.entries(timeSeriesData[timeSeriesData.length - 1])
        .filter(([key, value]) => key !== 'time' && value >= thresholds[key]?.warning)
        .map(([key, value]) => (
          <Alert key={key} variant={value >= thresholds[key].critical ? "destructive" : "warning"}>
            <AlertDescription>
              {value >= thresholds[key].critical ? '危険' : '警告'}: 
              {key === 'cpu' && 'CPU使用率'}
              {key === 'memory' && 'メモリ使用率'}
              {key === 'latency' && 'レイテンシー'}
              {key === 'errorRate' && 'エラー率'}
              が {value.toFixed(1)}{key === 'latency' ? 'ms' : '%'} です
              （閾値: {value >= thresholds[key].critical ? thresholds[key].critical : thresholds[key].warning}
              {key === 'latency' ? 'ms' : '%'}）
            </AlertDescription>
          </Alert>
      ))}
    </div>
  );
};

export default MetricsDashboard;
