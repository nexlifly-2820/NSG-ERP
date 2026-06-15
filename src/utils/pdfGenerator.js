import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Convert image to base64
const getBase64ImageFromUrl = async (imageUrl) => {
  const res = await fetch(imageUrl);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", function () {
      resolve(reader.result);
    }, false);
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(blob);
  });
};

function numberToWords(num) {
  if (num === 0) return 'Zero';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const inWords = (n) => {
      let str = '';
      if (n > 99) { str += a[Math.floor(n / 100)] + ' Hundred '; n %= 100; }
      if (n > 19) { str += b[Math.floor(n / 10)] + ' '; n %= 10; }
      if (n > 0) str += a[n] + ' ';
      return str;
  };
  let words = '';
  if (num >= 10000000) { words += inWords(Math.floor(num / 10000000)) + 'Crore '; num %= 10000000; }
  if (num >= 100000) { words += inWords(Math.floor(num / 100000)) + 'Lakh '; num %= 100000; }
  if (num >= 1000) { words += inWords(Math.floor(num / 1000)) + 'Thousand '; num %= 1000; }
  if (num > 0) words += inWords(num);
  
  // Capitalize first letter only
  let finalStr = words.trim() + ' Rupees only';
  return finalStr.charAt(0).toUpperCase() + finalStr.slice(1).toLowerCase();
}

export const generatePayslipPDF = async (record) => {
  const doc = new jsPDF();
  
  try {
    // 1. Logo
    try {
      const base64Logo = await getBase64ImageFromUrl('/hmns-logo.png');
      doc.addImage(base64Logo, 'PNG', 14, 10, 180, 25);
    } catch(e) {
      console.warn("Logo could not be loaded", e);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text("HMNS SOFTWARE SOLUTIONS (OPC) PVT LTD", 105, 20, { align: 'center' });
    }

    // Green line under logo
    doc.setDrawColor(76, 175, 80); // Green
    doc.setLineWidth(0.5);
    doc.line(14, 38, 196, 38);

    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const monthLabel = `${monthNames[(record.month||1)-1]} ${record.year || 2026}`;

    // Reset styles for text
    doc.setTextColor(0, 0, 0);
    doc.setFont('times', 'normal');
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);

    // --- MAIN OUTER RECTANGLE ---
    // Start Y around 45, down to roughly 230
    const startY = 45;
    doc.rect(14, startY, 182, 185);

    // Title Section
    doc.setFontSize(14);
    doc.text(`Pay slip for the month of ${monthLabel}`, 105, startY + 15, { align: 'center' });
    doc.line(14, startY + 22, 196, startY + 22);

    // --- EMPLOYEE DETAILS (Top Grid) ---
    const gridY1 = startY + 22;
    doc.setFontSize(10);
    
    // Left column labels
    doc.text("Employee Code:", 16, gridY1 + 6);
    doc.text("Employee Name:", 16, gridY1 + 14);
    doc.text("Designation:", 16, gridY1 + 22);
    doc.text("Location:", 16, gridY1 + 30);

    // Left column values
    doc.text(String(record.id || 'N/A'), 55, gridY1 + 6);
    doc.text(record.employee_name || 'N/A', 55, gridY1 + 14);
    doc.text(record.designation || 'N/A', 55, gridY1 + 22);
    doc.text(record.location || 'N/A', 55, gridY1 + 30);

    // Vertical line separating columns
    doc.line(105, gridY1, 105, gridY1 + 34);

    // Right column labels
    doc.text("PF Number:", 107, gridY1 + 6);
    doc.text("UAN:", 107, gridY1 + 14);
    doc.text("ESI Number:", 107, gridY1 + 22);
    doc.text("PAN:", 107, gridY1 + 30);

    // Right column values
    doc.text(record.pf_number || '', 150, gridY1 + 6);
    doc.text(record.uan || '', 150, gridY1 + 14);
    doc.text(record.esi_number || '', 150, gridY1 + 22);
    doc.text(record.pan_number || '', 150, gridY1 + 30);

    // Horizontal line
    doc.line(14, gridY1 + 34, 196, gridY1 + 34);

    // --- ATTENDANCE DETAILS ---
    const gridY2 = gridY1 + 34;
    
    // Left
    doc.text("DOJ:", 16, gridY2 + 6);
    doc.text("Days In Month:", 16, gridY2 + 14);
    doc.text("Worked Days:", 16, gridY2 + 22);
    
    doc.text(record.doj || 'N/A', 55, gridY2 + 6);
    doc.text("22", 55, gridY2 + 14);
    doc.text(String(record.worked_days != null ? record.worked_days : '22'), 55, gridY2 + 22);

    // Vertical line
    doc.line(105, gridY2, 105, gridY2 + 25);

    // Right
    doc.text("Arrear Days:", 107, gridY2 + 6);
    doc.text("LOP Days:", 107, gridY2 + 14);
    doc.text("LOP Days Reversed:", 107, gridY2 + 22);

    doc.text(Number(record.arrear_days||0).toFixed(2), 160, gridY2 + 6);
    doc.text(Number(record.lop_days||0).toFixed(2), 160, gridY2 + 14);
    doc.text(Number(record.lop_days_reversed||0).toFixed(2), 160, gridY2 + 22);

    // Horizontal line
    doc.line(14, gridY2 + 25, 196, gridY2 + 25);

    // --- EARNINGS & DEDUCTIONS HEADER ---
    const gridY3 = gridY2 + 25;
    doc.setFont('times', 'bold');
    doc.text("Earnings", 16, gridY3 + 5);
    doc.text("Actual", 65, gridY3 + 5);
    doc.text("Earned", 85, gridY3 + 5);
    doc.text("Deductions", 107, gridY3 + 5);

    // Vertical Lines for Earnings grid
    doc.line(62, gridY3, 62, gridY3 + 22);
    doc.line(82, gridY3, 82, gridY3 + 22);
    doc.line(105, gridY3, 105, gridY3 + 22);

    // Horizontal line under header
    doc.line(14, gridY3 + 7, 196, gridY3 + 7);

    // --- EARNINGS & DEDUCTIONS VALUES ---
    doc.setFont('times', 'normal');
    
    const basic = Number(record.basic || 0);
    const hra = Number(record.hra || 0);
    const allowances = Number(record.allowances || 0);
    
    // In user's PDF, they use 'Stipend' for everything if it's an intern, or maybe they just combine it.
    // Let's print Basic, HRA, Allowances if > 0. For matching the PDF exact "Stipend" text if that's what they had, 
    // we'll just print Basic if others are 0, or sum them. Let's use the DB fields.
    const hasBasic = basic > 0;
    const hasHra = hra > 0;
    const hasAllowances = allowances > 0;

    let yOffset = gridY3 + 12;
    if (hasBasic) {
      doc.text("Basic Salary", 16, yOffset);
      doc.text(basic.toFixed(2), 65, yOffset);
      doc.text(basic.toFixed(2), 85, yOffset);
      yOffset += 5;
    }
    if (hasHra) {
      doc.text("HRA", 16, yOffset);
      doc.text(hra.toFixed(2), 65, yOffset);
      doc.text(hra.toFixed(2), 85, yOffset);
      yOffset += 5;
    }
    if (hasAllowances) {
      doc.text("Allowances", 16, yOffset);
      doc.text(allowances.toFixed(2), 65, yOffset);
      doc.text(allowances.toFixed(2), 85, yOffset);
      yOffset += 5;
    }
    // If all are zero, just put Stipend like the screenshot to be safe or Basic 0.00
    if (!hasBasic && !hasHra && !hasAllowances) {
      const grossAmt = Number(record.net || 0);
      doc.text("Stipend / Basic", 16, yOffset);
      doc.text(grossAmt.toFixed(2), 65, yOffset);
      doc.text(grossAmt.toFixed(2), 85, yOffset);
      yOffset += 5;
    }

    // Deductions on the right
    const epf = Number(record.epf || 0);
    const tds = Number(record.tds || 0);
    const lop = Number(record.lop || 0);

    let dYOffset = gridY3 + 12;
    if (epf > 0) { doc.text("EPF", 107, dYOffset); doc.text(epf.toFixed(2), 170, dYOffset); dYOffset += 5; }
    if (tds > 0) { doc.text("TDS", 107, dYOffset); doc.text(tds.toFixed(2), 170, dYOffset); dYOffset += 5; }
    if (lop > 0) { doc.text("LOP", 107, dYOffset); doc.text(lop.toFixed(2), 170, dYOffset); dYOffset += 5; }

    // Horizontal line before Totals
    doc.line(14, gridY3 + 22, 196, gridY3 + 22);

    // --- TOTALS ---
    const gridY4 = gridY3 + 22;
    const grossTotal = basic + hra + allowances || Number(record.net || 0);
    const dedTotal = epf + tds + lop;

    doc.setFont('times', 'bold');
    doc.text("Totals:", 16, gridY4 + 5);
    doc.text(grossTotal.toFixed(2), 65, gridY4 + 5);
    doc.text(grossTotal.toFixed(2), 85, gridY4 + 5);
    
    // Deduction total at the far right
    doc.text(dedTotal.toFixed(2), 175, gridY4 + 5);

    // Vertical Lines extending to Totals
    doc.line(62, gridY4, 62, gridY4 + 7);
    doc.line(82, gridY4, 82, gridY4 + 7);
    doc.line(105, gridY4, 105, gridY4 + 7);

    // Horizontal line after Totals
    doc.line(14, gridY4 + 7, 196, gridY4 + 7);

    // --- NET PAY & WORDS ---
    const gridY5 = gridY4 + 7;
    const netPay = Number(record.net || 0);
    
    doc.text(`Net Pay: ${netPay.toFixed(2)}`, 16, gridY5 + 7);
    doc.setFont('times', 'normal');
    doc.text(`NET PAY IN Words: ${numberToWords(Math.round(netPay))}`, 16, gridY5 + 16);

    // Horizontal line
    doc.line(14, gridY5 + 20, 196, gridY5 + 20);

    // --- BANK DETAILS ---
    const gridY6 = gridY5 + 20;
    doc.text("Payment Mode:", 16, gridY6 + 6);
    doc.text("Bank Name:", 16, gridY6 + 14);
    doc.text("IFSC:", 16, gridY6 + 22);

    doc.text(record.payment_method || "Fund Transfer", 55, gridY6 + 6);
    doc.text(record.bank_name || "N/A", 55, gridY6 + 14);
    doc.text("HDFC0004219", 55, gridY6 + 22); // Dummy or from DB if exists

    doc.text("Payment Date:", 107, gridY6 + 6);
    doc.text("Account Number:", 107, gridY6 + 14);

    const payDate = record.payment_date ? new Date(record.payment_date).toLocaleDateString() : '';
    doc.text(payDate, 140, gridY6 + 6);
    doc.text(record.account_number || "N/A", 140, gridY6 + 14);

    // --- UTR BOX ---
    const utrY = gridY6 + 32;
    doc.text("UTR:", 120, utrY);
    // Draw an empty green box next to UTR like the screenshot
    doc.setDrawColor(76, 175, 80);
    doc.rect(14, utrY + 2, 178, 6);
    doc.setDrawColor(0,0,0);
    
    // Add UTR value if exists
    if(record.transaction_ref) {
      doc.text(record.transaction_ref, 20, utrY + 6);
    }

    // --- FOOTER ---
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text("workzone, 5th Floor, Cabin#1&4, PlotNo.63, Phase-1, Kavurihills, Madhapur-500033", 105, 270, { align: 'center' });
    doc.setTextColor(0, 0, 255);
    doc.text("www.hmnssoftware.com     hr@hmnssoftware.in", 105, 275, { align: 'center' });

    doc.save(`Payslip_${(record.employee_name || 'Employee').toString().replace(/ /g, '_')}_${record.month}_${record.year}.pdf`);
    return { success: true };
  } catch(err) {
    console.error("PDF Generator Error:", err);
    throw err;
  }
};
