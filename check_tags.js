const fs = require('fs');
const content = fs.readFileSync('src/components/hr/modules/messaging/HrMessagingView.jsx', 'utf8');

const regex = /<div|<\/div>/g;
let match;
const stack = [];
let errorCount = 0;

const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineNum = i + 1;
  
  let pos = 0;
  // Match manually to get exact line numbers
  while (true) {
    const openIdx = line.indexOf('<div', pos);
    const closeIdx = line.indexOf('</div>', pos);
    
    if (openIdx === -1 && closeIdx === -1) {
      break;
    }
    
    if (openIdx !== -1 && (closeIdx === -1 || openIdx < closeIdx)) {
      stack.push({ type: 'Open', line: lineNum });
      pos = openIdx + 4;
    } else {
      if (stack.length > 0) {
        stack.pop();
      } else {
        console.log(`UNMATCHED CLOSE </div> AT LINE ${lineNum}`);
        errorCount++;
      }
      pos = closeIdx + 6;
    }
  }
}

if (stack.length > 0) {
  for (const item of stack) {
    console.log(`UNMATCHED OPEN <div> AT LINE ${item.line}`);
    errorCount++;
  }
}

if (errorCount === 0) {
  console.log('Success: All <div> and </div> tags are perfectly balanced!');
} else {
  console.log(`Total tag errors found: ${errorCount}`);
}
