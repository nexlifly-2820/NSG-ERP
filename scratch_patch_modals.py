import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern to find div with style position: 'fixed'
    # It must not already have an onClick
    pattern = re.compile(r'(<div\s+[^>]*style={{[^}]*position:\s*\'fixed\'[^}]*}})([^>]*>)')
    
    matches = list(pattern.finditer(content))
    if not matches:
        return

    new_content = content
    offset = 0

    for m in matches:
        start, end = m.span()
        start += offset
        end += offset
        
        div_opening = new_content[start:end]
        
        if 'onClick=' in div_opening:
            continue
            
        # Extract the content inside the modal to find the closer
        # We'll just look ahead 3000 chars
        lookahead = new_content[end:end+3000]
        
        # Look for a button that contains Cancel, Close, X, ✕, or <X 
        button_pattern = re.compile(r'<button[^>]*onClick={([^}]+)}[^>]*>(?:[^<]*?(?:Cancel|Close|✕|X)|.*?<X(?:Circle)?\s*/>.*?)</button>', re.IGNORECASE | re.DOTALL)
        closer_match = button_pattern.search(lookahead)
        
        if closer_match:
            closer_logic = closer_match.group(1).strip()
            
            # If the logic is something like () => setModal(false), we can use it directly
            # If it's a direct function reference like `handleClose`, we can call it `handleClose(e)` or just `handleClose()`
            if '=>' in closer_logic:
                # e.g., () => setModal(false) -> (e) => { if(e.target === e.currentTarget) { setModal(false); } }
                body = closer_logic.split('=>', 1)[1].strip()
                injected_onclick = f' onClick={{(e) => {{ if (e.target === e.currentTarget) {{ {body} }} }}}}'
            else:
                # e.g., handleClose
                injected_onclick = f' onClick={{(e) => {{ if (e.target === e.currentTarget) {closer_logic}(); }}}}'
                
            # Inject it into the div
            # div_opening is like <div style={{...}} className="...">
            # we'll insert before the closing >
            # note group 1 is up to style={{...}}, group 2 is the rest
            
            patched_div = m.group(1) + injected_onclick + m.group(2)
            
            new_content = new_content[:start] + patched_div + new_content[end:]
            offset += len(patched_div) - len(div_opening)
        else:
            print(f"Could not find closer for modal at offset {start} in {filepath}")

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Patched: {filepath}")

if __name__ == '__main__':
    for root, dirs, files in os.walk('src/components'):
        for file in files:
            if file.endswith('.jsx'):
                process_file(os.path.join(root, file))
