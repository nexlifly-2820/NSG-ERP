import os, re
urls = set()
for root, dirs, files in os.walk(r'c:\Users\vivek chamanthula\Desktop\Nsg Erp\NSG-ERP\src\components'):
    for f in files:
        if f.endswith('.jsx') or f.endswith('.js'):
            with open(os.path.join(root, f), 'r', encoding='utf-8') as file:
                content = file.read()
                matches = re.findall(r'fetch\([\'\"`]([^\'\"`]+)[\'\"`]', content)
                for m in matches:
                    if m.startswith('/api') or m.startswith('http'):
                        urls.add(m)
for url in sorted(urls):
    print(url)
