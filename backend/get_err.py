import urllib.request
import urllib.error
try:
    urllib.request.urlopen('http://localhost:8000/ceo-portal/finance/ap')
except urllib.error.HTTPError as e:
    print("AP Error:", e.read().decode())

try:
    urllib.request.urlopen('http://localhost:8000/ceo-portal/finance/approvals-list')
except urllib.error.HTTPError as e:
    print("Approvals Error:", e.read().decode())
    
try:
    urllib.request.urlopen('http://localhost:8000/ceo-portal/finance/payroll-register')
except urllib.error.HTTPError as e:
    print("Payroll Error:", e.read().decode())
