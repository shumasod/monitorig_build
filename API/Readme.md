

# 1. 言語/フレームワーク別のロギング実装

## Node.js
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console()
  ]
});

// ミドルウェアとして使用
const errorLogger = (err, req, res, next) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId: req.id
  });
  next(err);
};
```

## Java (Spring Boot)
```java
@ControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleException(Exception ex, WebRequest request) {
        Map<String, Object> errorDetails = new HashMap<>();
        errorDetails.put("timestamp", new Date());
        errorDetails.put("message", ex.getMessage());
        errorDetails.put("path", request.getDescription(false));
        
        logger.error("API Error: {}", errorDetails);
        return new ResponseEntity<>(errorDetails, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
```

## Go
```go
type ErrorLog struct {
    Timestamp   time.Time `json:"timestamp"`
    RequestID   string    `json:"request_id"`
    Error       string    `json:"error"`
    StatusCode  int       `json:"status_code"`
    Path        string    `json:"path"`
}

func errorMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if err := recover(); err != nil {
                log := ErrorLog{
                    Timestamp:   time.Now(),
                    RequestID:   r.Header.Get("X-Request-ID"),
                    Error:       fmt.Sprint(err),
                    StatusCode:  http.StatusInternalServerError,
                    Path:        r.URL.Path,
                }
                logJSON, _ := json.Marshal(log)
                fmt.Println(string(logJSON))
            }
        }()
        next.ServeHTTP(w, r)
    })
}
```

# 2. モニタリングツール比較

## オープンソース
- **Grafana + Prometheus**
  - メトリクス可視化
  - カスタムダッシュボード作成
  - アラート設定

- **Jaeger**
  - 分散トレーシング
  - リクエストフロー分析
  - パフォーマンスボトルネック特定

## クラウドサービス
- **New Relic**
  - APMツール
  - エラートラッキング
  - トランザクション監視

- **Sentry**
  - リアルタイムエラー追跡
  - スタックトレース解析
  - エラーグループ化

# 3. ログ集約システム

## Fluentd/Fluent Bit
```yaml
# fluent.conf
<source>
  @type tail
  path /var/log/api/error.log
  tag api.errors
  <parse>
    @type json
  </parse>
</source>

<match api.errors>
  @type elasticsearch
  host elasticsearch
  port 9200
  index_name api-logs
</match>
```

## Vector
```toml
# vector.toml
[sources.api_logs]
type = "file"
include = ["/var/log/api/*.log"]
ignore_older_secs = 600

[transforms.parse_logs]
type = "remap"
inputs = ["api_logs"]
source = '''
. = parse_json!(.message)
.timestamp = parse_timestamp!(.timestamp, format: "%Y-%m-%dT%H:%M:%S%.fZ")
'''

[sinks.elasticsearch]
type = "elasticsearch"
inputs = ["parse_logs"]
endpoint = "http://elasticsearch:9200"
index = "api-logs-%Y-%m-%d"
```

# 4. クラウドプラットフォーム別のソリューション

## AWS
- CloudWatch Logs
- X-Ray
- CloudTrail

## Google Cloud
- Cloud Logging
- Cloud Trace
- Error Reporting

## Azure
- Application Insights
- Log Analytics
- Azure Monitor

# 5. 可視化のベストプラクティス

1. **標準化されたログフォーマット**
   - タイムスタンプ
   - リクエストID
   - エラーコード
   - スタックトレース

2. **メトリクスの定義**
   - エラーレート
   - レイテンシー
   - リクエスト数
   - ステータスコード分布

3. **アラート設定**
   - 重要度別の通知設定
   - エスカレーションポリシー
   - インシデント管理との連携

この多層的なアプローチにより、APIの健全性を総合的に監視し、問題の早期発見と解決が可能になります。
