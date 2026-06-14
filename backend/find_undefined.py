import re
import os

routers_dir = r"c:\Users\vivek chamanthula\Desktop\Nsg Erp\NSG-ERP\backend\app\routers"
models_file = r"c:\Users\vivek chamanthula\Desktop\Nsg Erp\NSG-ERP\backend\app\models.py"

with open(models_file, 'r', encoding='utf-8') as f:
    models_content = f.read()

defined_models = set(re.findall(r'class\s+([A-Za-z0-9_]+)\(', models_content))

for file in os.listdir(routers_dir):
    if file.endswith('.py'):
        with open(os.path.join(routers_dir, file), 'r', encoding='utf-8') as f:
            content = f.read()
        used_models = set(re.findall(r'models\.([A-Za-z0-9_]+)', content))
        undefined = used_models - defined_models
        if undefined:
            print(f"File {file} uses undefined models: {undefined}")
