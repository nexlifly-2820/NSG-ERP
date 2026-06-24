import React, { useState, useEffect } from 'react';

const PayrollEntryRow = ({ record, onEdit, onProcess }) => {
  // Local state for strings to differentiate between '0' and '' (empty string)
  const [values, setValues] = useState({
    basic: record.basic === 0 ? '' : record.basic.toString(),
    hra: record.hra === 0 ? '' : record.hra.toString(),
    bonus: record.bonus === 0 ? '' : record.bonus.toString(),
    lop: record.lop === 0 ? '' : record.lop.toString(),
    epf: record.epf === 0 ? '' : record.epf.toString(),
    tds: record.tds === 0 ? '' : record.tds.toString()
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    // If the parent record changes externally (e.g. initial load), keep values synced
    // only if the field is empty, to avoid overwriting user's active typing
    setValues(prev => ({
      basic: prev.basic !== '' ? prev.basic : (record.basic === 0 ? '' : record.basic.toString()),
      hra: prev.hra !== '' ? prev.hra : (record.hra === 0 ? '' : record.hra.toString()),
      bonus: prev.bonus !== '' ? prev.bonus : (record.bonus === 0 ? '' : record.bonus.toString()),
      lop: prev.lop !== '' ? prev.lop : (record.lop === 0 ? '' : record.lop.toString()),
      epf: prev.epf !== '' ? prev.epf : (record.epf === 0 ? '' : record.epf.toString()),
      tds: prev.tds !== '' ? prev.tds : (record.tds === 0 ? '' : record.tds.toString())
    }));
  }, [record.basic, record.hra, record.bonus, record.lop, record.epf, record.tds]);

  const validateField = (field, value) => {
    let errorMsg = '';
    if (value === '' || value === null || value === undefined) {
      switch (field) {
        case 'basic': errorMsg = "Please add Basic Salary amount."; break;
        case 'hra': errorMsg = "Please add HRA amount."; break;
        case 'bonus': errorMsg = "Please add Bonus amount."; break;
        case 'lop': errorMsg = "Please add LOP amount."; break;
        case 'epf': errorMsg = "Please add EPF amount."; break;
        case 'tds': errorMsg = "Please add TDS amount."; break;
        default: break;
      }
    }
    setErrors(prev => ({ ...prev, [field]: errorMsg }));
    return errorMsg === '';
  };

  const handleBlur = (field) => {
    validateField(field, values[field]);
  };

  const handleChange = (field, e) => {
    const val = e.target.value;
    setValues(prev => ({ ...prev, [field]: val }));
    onEdit(record.employee_id, field, val);
    if (val !== '') {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleProcess = () => {
    let isValid = true;
    const newErrors = {};
    ['basic', 'hra', 'bonus', 'lop', 'epf', 'tds'].forEach(field => {
      const val = values[field];
      if (val === '' || val === null || val === undefined) {
        isValid = false;
        switch (field) {
          case 'basic': newErrors.basic = "Please add Basic Salary amount."; break;
          case 'hra': newErrors.hra = "Please add HRA amount."; break;
          case 'bonus': newErrors.bonus = "Please add Bonus amount."; break;
          case 'lop': newErrors.lop = "Please add LOP amount."; break;
          case 'epf': newErrors.epf = "Please add EPF amount."; break;
          case 'tds': newErrors.tds = "Please add TDS amount."; break;
          default: break;
        }
      }
    });

    if (!isValid) {
      setErrors(newErrors);
      return;
    }
    
    // Pass validation, trigger parent's process payment
    onProcess(record);
  };

  return (
    <tr>
      <td style={{ verticalAlign: 'top', paddingTop: '16px' }}>
        <div className="emp-name" style={{ fontWeight: 'bold', color: '#1e293b' }}>{record.employee_name}</div>
        <div className="emp-role" style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{record.role.toUpperCase()}</div>
      </td>
      
      {/* Basic */}
      <td style={{ verticalAlign: 'top', paddingTop: '16px' }}>
        <input 
          type="number" 
          className="edit-input basic" 
          value={values.basic}
          onChange={(e) => handleChange('basic', e)}
          onClick={() => handleBlur('basic')}
          style={{ width: '100%', borderColor: errors.basic ? '#ef4444' : undefined, outline: errors.basic ? 'none' : undefined }}
        />
        {errors.basic && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', whiteSpace: 'nowrap' }}>{errors.basic}</div>}
      </td>
      
      {/* HRA */}
      <td style={{ verticalAlign: 'top', paddingTop: '16px' }}>
        <input 
          type="number" 
          className="edit-input hra" 
          value={values.hra}
          onChange={(e) => handleChange('hra', e)}
          onClick={() => handleBlur('hra')}
          style={{ width: '100%', borderColor: errors.hra ? '#ef4444' : undefined, outline: errors.hra ? 'none' : undefined }}
        />
        {errors.hra && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', whiteSpace: 'nowrap' }}>{errors.hra}</div>}
      </td>
      
      {/* Bonus */}
      <td style={{ verticalAlign: 'top', paddingTop: '16px' }}>
        <input 
          type="number" 
          className="edit-input bonus" 
          value={values.bonus}
          onChange={(e) => handleChange('bonus', e)}
          onClick={() => handleBlur('bonus')}
          style={{ width: '100%', borderColor: errors.bonus ? '#ef4444' : undefined, outline: errors.bonus ? 'none' : undefined }}
        />
        {errors.bonus && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', whiteSpace: 'nowrap' }}>{errors.bonus}</div>}
      </td>
      
      {/* LOP */}
      <td style={{ verticalAlign: 'top', paddingTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span className="text-red font-semibold">-₹</span>
          <input 
            type="number" 
            className="edit-input lop" 
            value={values.lop}
            onChange={(e) => handleChange('lop', e)}
            onClick={() => handleBlur('lop')}
            style={{ width: '100%', borderColor: errors.lop ? '#ef4444' : undefined, outline: errors.lop ? 'none' : undefined }}
          />
        </div>
        {errors.lop && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', whiteSpace: 'nowrap' }}>{errors.lop}</div>}
      </td>
      
      {/* EPF */}
      <td style={{ verticalAlign: 'top', paddingTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span className="text-red font-semibold">-₹</span>
          <input 
            type="number" 
            className="edit-input epf" 
            value={values.epf}
            onChange={(e) => handleChange('epf', e)}
            onClick={() => handleBlur('epf')}
            style={{ width: '100%', borderColor: errors.epf ? '#ef4444' : undefined, outline: errors.epf ? 'none' : undefined }}
          />
        </div>
        {errors.epf && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', whiteSpace: 'nowrap' }}>{errors.epf}</div>}
      </td>
      
      {/* TDS */}
      <td style={{ verticalAlign: 'top', paddingTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span className="text-red font-semibold">-₹</span>
          <input 
            type="number" 
            className="edit-input tds" 
            value={values.tds}
            onChange={(e) => handleChange('tds', e)}
            onClick={() => handleBlur('tds')}
            style={{ width: '100%', borderColor: errors.tds ? '#ef4444' : undefined, outline: errors.tds ? 'none' : undefined }}
          />
        </div>
        {errors.tds && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', whiteSpace: 'nowrap' }}>{errors.tds}</div>}
      </td>

      <td className="amount-col text-red" style={{ verticalAlign: 'top', paddingTop: '22px' }}>
        -₹{Math.round(record.epf + record.tds + record.lop).toLocaleString()}
      </td>
      <td className="amount-col net-pay" style={{ verticalAlign: 'top', paddingTop: '22px' }}>
        ₹{Math.round(record.net).toLocaleString()}
      </td>
      <td style={{ verticalAlign: 'top', paddingTop: '16px' }}>
        <button className="btn-process" onClick={handleProcess}>
          Process & Pay
        </button>
      </td>
    </tr>
  );
};

export default PayrollEntryRow;
