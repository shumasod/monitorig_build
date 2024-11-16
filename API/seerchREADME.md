APIエラーログの可視化のための効果的な方法をご紹介します。

# 1. 構造化ログの実装

```python
import logging
import json
from datetime import datetime

def structured_logging(error, request_data=None):
    log_data = {
        "timestamp": datetime.now().isoformat(),
        "error_type": type(error).__name__,
        "error_message": str(error),
        "status_code": getattr(error, 'status_code', None),
        "endpoint": request_data.get('endpoint') if request_data else None,
        "request_id": request_data.get('request_id') if request_data else None
    }
    
    logging.error(json.dumps(log_data))
```

# 2. ログ分析ツールの活用

- **ELK Stack**
  - Elasticsearch: ログの保存と検索
  - Logstash: ログの収集と変換
  - Kibana: ビジュアライゼーション

- **Datadog**
  - APIメトリクスの監視
  - エラーの追跡
  - アラート設定

# 3. エラーモニタリングの実装例

```python
from functools import wraps

def api_monitor(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            log_data = {
                "function": func.__name__,
                "args": str(args),
                "kwargs": str(kwargs),
                "error": str(e)
            }
            structured_logging(e, log_data)
            raise
    return wrapper

@api_monitor
def api_call():
    # API呼び出しの処理
    pass
```

# 4. 重要なモニタリングポイント

- レスポンスタイム
- エラーレート
- ステータスコードの分布
- エンドポイントごとの成功/失敗率
- リクエスト数の推移

# 5. アラート設定のベストプラクティス

- エラー率が一定threshold（例：5%）を超えた場合
- レスポンスタイムが基準値を超えた場合
- 特定のステータスコード（5xx）の急増
- リクエスト数の異常な増減

このような実装により、以下のメリットが得られます：
- エラーの早期発見と対応
- トレンド分析による予防的対応
- システムの健全性の継続的モニタリング
- チーム間での問題共有の効率化
