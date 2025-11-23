python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000




local-ssl-proxy --source 8443 --target 8000




local-ssl-proxy --source 443 --target 3000