const fs = require('fs');
const path = require('path');

const targetDir = path.resolve('c:/Users/vivek chamanthula/Desktop/Nsg Erp/NSG-ERP/src');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else if (dirPath.endsWith('.js') || dirPath.endsWith('.jsx')) {
      callback(dirPath);
    }
  });
}

let modifiedFiles = 0;
let totalAlertsReplaced = 0;

walkDir(targetDir, function(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  if (content.includes('alert(') || content.includes('window.alert(')) {
    let newContent = content.replace(/\b(?:window\.)?alert\s*\(([\s\S]*?)\)/g, (match, arg) => {
      // Determine toast type
      const lowerArg = arg.toLowerCase();
      let type = 'info';
      
      if (lowerArg.includes('success') || lowerArg.includes('approved') || lowerArg.includes('complete')) {
        type = 'success';
      } else if (lowerArg.includes('error') || lowerArg.includes('fail') || lowerArg.includes('reject') || lowerArg.includes('offline') || lowerArg.includes('cannot') || lowerArg.includes('missing')) {
        type = 'error';
      } else if (lowerArg.includes('please') || lowerArg.includes('warning') || lowerArg.includes('must') || lowerArg.includes('maximum')) {
        type = 'warning';
      }

      totalAlertsReplaced++;
      return `window.toast.${type}(${arg})`;
    });

    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      modifiedFiles++;
      console.log(`Modified: ${filePath}`);
    }
  }
});

console.log(`Replaced ${totalAlertsReplaced} alerts in ${modifiedFiles} files.`);
