import urllib.request
import json

endpoints = [
    '/api/ceo-portal/finance/kpis',
    '/api/ceo-portal/finance/trends',
    '/api/ceo-portal/finance/budgets-list',
    '/api/ceo-portal/finance/ar',
    '/api/ceo-portal/finance/ap',
    '/api/ceo-portal/finance/statutory-list',
    '/api/ceo-portal/finance/salary-components',
    '/api/ceo-portal/finance/payroll-register',
    '/api/ceo-portal/finance/approvals-list',
    '/api/ceo-portal/dashboard/summary'
]

for ep in endpoints:
    url = f"http://localhost:8000{ep.replace('/api', '')}"
    try:
        req = urllib.request.Request(url)
        res = urllib.request.urlopen(req)
        print(f"OK: {ep}")
    except Exception as e:
        print(f"ERROR: {ep} - {e}")
