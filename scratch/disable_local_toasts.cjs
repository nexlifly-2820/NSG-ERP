const fs = require('fs');
const path = require('path');

const targetDir = path.resolve('c:/Users/vivek chamanthula/Desktop/Nsg Erp/NSG-ERP/src');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
      walkDir(dirPath, callback);
    } else if (dirPath.endsWith('.js') || dirPath.endsWith('.jsx')) {
      callback(dirPath);
    }
  });
}

walkDir(targetDir, function(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let newContent = content.replace(/\{toastMsg\s*&&\s*\(/g, '{false && (').replace(/\{toast\s*&&\s*\(/g, '{false && (');
  
  // Let's also check if they call setToast or setToastMsg inline
  // and replace them with window.toast.success or something if they aren't showToast
  newContent = newContent.replace(/\bsetToast(?:Msg)?\s*\(\s*(['"`][^'"`]+['"`])\s*\)/g, "window.showToast($1, 'success')");
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log(`Removed local rendering from: ${filePath}`);
  }
});
