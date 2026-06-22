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
  
  // If the file defines a local showToast
  if (content.includes('const showToast = (msg) => {') || content.includes('const showToast = (msg, type')) {
    
    // 1. Rename all invocations of showToast( to window.showToast(
    // We use negative lookbehind to avoid renaming the declaration `const showToast` or `window.showToast`
    // but JS doesn't support it in all node versions easily, so let's just do a manual replace
    let lines = content.split('\n');
    let insideShowToastDef = false;
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // If we are entering the local showToast definition
      if (line.includes('const showToast = (msg) => {') || line.includes('const showToast = (msg, type =')) {
        // Only if it's not the App.jsx or ToastProvider.jsx where it SHOULD be defined globally
        if (!filePath.includes('App.jsx') && !filePath.includes('ToastProvider.jsx') && !filePath.includes('Settings.jsx')) {
             insideShowToastDef = true;
             lines[i] = '// ' + line;
             continue;
        } else if (filePath.includes('Settings.jsx')) {
             // Settings.jsx has a local one, we should comment it out too
             insideShowToastDef = true;
             lines[i] = '// ' + line;
             continue;
        }
      }
      
      if (insideShowToastDef) {
        lines[i] = '// ' + line;
        if (line.includes('};')) {
          insideShowToastDef = false;
        }
        continue;
      }
      
      // Replace invocations: showToast('...') -> window.showToast('...')
      // Make sure we don't double replace `window.window.showToast`
      if (line.includes('showToast(') && !line.includes('window.showToast(')) {
          // Replace calls but handle context
          lines[i] = line.replace(/\bshowToast\s*\(/g, 'window.showToast(');
      }
    }
    
    let newContent = lines.join('\n');
    
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      console.log(`Refactored local toast in: ${filePath}`);
    }
  }
});
