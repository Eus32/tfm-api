#!/usr/bin/env python3

import json
import pandas as pd

log_file = "../logs/other-computer.log"

rows = []
with open(log_file, "r", encoding="utf-8") as f:
    for line in f:
        try:
            if "[error]:" in line:
                log_json_str = line.split("[error]:", 1)[1].strip()
            elif "[info]:" in line:
                log_json_str = line.split("[info]:", 1)[1].strip()
            else:
                continue  # Ignora líneas sin etiqueta reconocida
            data = json.loads(log_json_str)
            row = {
                "timestamp": data.get("timestamp"),
                "http_method": data.get("request", {}).get("http_method"),
                "endpoint": data.get("request", {}).get("endpoint"),
                "query_params_count": data.get("request", {}).get("query_params_count"),
                "user_agent": data.get("request", {}).get("headers", {}).get("user_agent"),
                "authorization_present": data.get("request", {}).get("headers", {}).get("authorization_present"),
                "ip_hash": data.get("request", {}).get("client", {}).get("ip_hash"),
                "content_length_bytes": data.get("request", {}).get("payload_metadata", {}).get("content_length_bytes"),
                "num_fields": data.get("request", {}).get("payload_metadata", {}).get("num_fields"),
                "avg_field_length": data.get("request", {}).get("payload_metadata", {}).get("avg_field_length"),
                "failed_auth_attempts_last_10min": data.get("security", {}).get("failed_auth_attempts_last_10min", 0),
                "suspicious_patterns_detected": ",".join(data.get("security", {}).get("suspicious_patterns_detected", [])),
                "statusCode": data.get("response", {}).get("statusCode"),
                "duration_ms": float(str(data.get("response", {}).get("duration", "0")).replace(" ms", "")),
                "responseSize": int(str(data.get("response", {}).get("responseSize", "0")).replace('"', '').strip()),
                # Si suspicious_patterns_detected contiene 'authorization' y el statusCode es 2xx o 3xx, no marcar como vulnerabilidad
                "label_attack": 0 if (
                    "authorization" in ",".join(data.get("security", {}).get("suspicious_patterns_detected", [])) and 200 <= int(data.get("response", {}).get("statusCode", 200)) < 400
                ) else (
                    1 if data.get("security", {}).get("suspicious_patterns_detected") else 0
                )
            }
            rows.append(row)
        except Exception:
            continue

df = pd.DataFrame(rows)
out_csv = "api_logs_ml_ready.csv"
df.to_csv(out_csv, index=False)

