fpath = 'src/components/hr/modules/leave/LeaveManagementView.jsx'
with open(fpath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('Maternity: parseFloat(editingBalance.Maternity) || 0,\n          Paternity: parseFloat(editingBalance.Paternity) || 0', 'Maternity: parseFloat(editingBalance.Maternity) || 0')
content = content.replace('<th style={{ padding: \'16px 24px\', textAlign: \'left\', backgroundColor: \'var(--bg-primary)\', color: \'#64748b\', fontSize: \'11px\', fontWeight: \'600\', textTransform: \'uppercase\', letterSpacing: \'0.05em\', borderBottom: \'1px solid var(--border-color)\' }}>Paternity</th>\n', '')
content = content.replace('                  <td style={{ padding: \'16px 24px\', borderBottom: \'1px solid #f1f5f9\', color: \'#475569\', fontSize: \'14px\', fontWeight: \'500\' }}>{b.Paternity}</td>\n', '')
content = content.replace('                    <option value="Paternity">Paternity Leave</option>\n', '')
content = content.replace('                    <option value="Paternity">Paternity</option>\n', '')

paternity_block = '''                  <div style={{ flex: '1' }}>
                    <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Paternity</label>
                    <input 
                      type="number" step="1" min="0" value={editingBalance.Paternity} 
                      onChange={(e) => setEditingBalance({ ...editingBalance, Paternity: e.target.value })} required 
                      style={{ width: '100%', padding: '10px 12px', marginTop: '6px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', outline: 'none', transition: 'border-color 0.2s' }} />
                  </div>'''

content = content.replace(paternity_block, '')

with open(fpath, 'w', encoding='utf-8') as f:
    f.write(content)
print('Replaced')
