import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';

const API = 'http://localhost:3001/api';

const COMPANY = {
  name: 'VASTUMANDALAA',
  address: 'H No 14, New Gopal Vihar, Bajrang Nagar, Kota\nKota, Rajasthan, 324006',
  gstin: '08FVDPS8354A1ZD',
  state: 'Rajasthan, Code : 08',
};

const UPI_ID = '9057247550m@pnb';

function fmt(n) {
  return Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function r2(n) { return Math.round(Number(n || 0) * 100) / 100; }

function numToWords(amount) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function convert(n) {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  }
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let words = convert(rupees) + ' Rupees';
  if (paise > 0) words += ' and ' + convert(paise) + ' Paise';
  return 'INR ' + words + ' Only';
}

// Columns: Sl | Description | HSN | Quantity | Rate Incl. GST | per | Amount (incl. GST)
// Total cells = 7. All total/GST rows must also have 7 cells.

export default function InvoicePrint() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch(`${API}/invoices/${id}`)
      .then(r => r.json())
      .then(data => { if (data.error) throw new Error(data.error); setInvoice(data); })
      .catch(e => setError(e.message));
  }, [id]);

  if (error) return <div style={{ padding: 40, color: 'red' }}>Error: {error}</div>;
  if (!invoice) return <div style={{ padding: 40 }}>Loading…</div>;

  const items = invoice.items || [];
  const isInterstate = invoice.invoiceType === 'interstate';

  // Rate incl. GST per unit
  function rateInclGst(item) {
    const rate = r2(item.unitPrice || item.unit_price || 0);
    const gst = r2(item.gstRate || item.gst_rate || 0);
    return r2(rate * (1 + gst / 100));
  }

  // Build GST summary rows grouped by rate for the bottom of the items table
  const gstByRate = {};
  items.forEach(item => {
    const rate = r2(item.gstRate || item.gst_rate || 0);
    if (!gstByRate[rate]) gstByRate[rate] = { igst: 0, cgst: 0, sgst: 0 };
    gstByRate[rate].igst = r2(gstByRate[rate].igst + r2(item.igst || 0));
    gstByRate[rate].cgst = r2(gstByRate[rate].cgst + r2(item.cgst || 0));
    gstByRate[rate].sgst = r2(gstByRate[rate].sgst + r2(item.sgst || 0));
  });

  const grandTotal = r2(invoice.totalAmountAfterTax);
  const subtotal = r2(invoice.totalAmountBeforeTax);
  const totalTax = r2(invoice.totalTax);
  const rounded = Math.round(grandTotal);
  const roundOff = r2(rounded - grandTotal);

  const PAD_ROWS = Math.max(0, 8 - items.length);

  // 7-column cell = td with no content
  const empty7 = () => <><td/><td/><td/><td/><td/><td/><td/></>;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          .invoice-page { box-shadow: none !important; margin: 0 !important; }
          * { print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important; }
        }
        body { background: #f0f0f0; font-family: Arial, sans-serif; }
        .invoice-page {
          background: white;
          width: 210mm;
          min-height: 297mm;
          margin: 20px auto;
          padding: 12mm 14mm;
          box-shadow: 0 2px 10px rgba(0,0,0,0.15);
          box-sizing: border-box;
          font-size: 11px;
          color: #000;
        }
        table { border-collapse: collapse; width: 100%; }
        td, th { border: 1px solid #000; padding: 4px 6px; }
      `}</style>

      <div className="no-print" style={{ textAlign: 'center', padding: '12px 0' }}>
        <button onClick={() => window.print()}
          style={{ padding: '8px 24px', background: '#2c3e50', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14, marginRight: 8 }}>
          Print / Save PDF
        </button>
        <button onClick={() => window.close()}
          style={{ padding: '8px 16px', background: '#666', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 }}>
          Close
        </button>
      </div>

      <div className="invoice-page">
        {/* ── Title ── */}
        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Tax Invoice</div>

        {/* ── Company + Invoice meta ── */}
        <table>
          <tbody>
            <tr>
              <td rowSpan={4} style={{ width: '50%', verticalAlign: 'top' }}>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{COMPANY.name}</div>
                <div style={{ whiteSpace: 'pre-line', marginTop: 2 }}>{COMPANY.address}</div>
                <div style={{ marginTop: 2 }}>GSTIN/UIN: {COMPANY.gstin}</div>
                <div>State Name : {COMPANY.state}</div>
              </td>
              <td style={{ width: '25%' }}>
                <div style={{ fontSize: 9, color: '#555' }}>Invoice No.</div>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{invoice.invoiceNumber}</div>
              </td>
              <td style={{ width: '25%' }}>
                <div style={{ fontSize: 9, color: '#555' }}>Dated</div>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{invoice.invoiceDate}</div>
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <div style={{ fontSize: 9, color: '#555' }}>Delivery Note</div>
                <div style={{ fontSize: 9, color: '#555', marginTop: 4 }}>Mode/Terms of Payment</div>
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <div style={{ fontSize: 9, color: '#555' }}>Reference No. &amp; Date.</div>
                <div style={{ fontWeight: 600 }}>{invoice.invoiceNumber} &nbsp; dt. {invoice.invoiceDate}</div>
              </td>
            </tr>
            <tr>
              <td colSpan={2}><div style={{ fontSize: 9, color: '#555' }}>Other References</div></td>
            </tr>
          </tbody>
        </table>

        {/* ── Consignee / Buyer ── */}
        <table style={{ marginTop: -1 }}>
          <tbody>
            <tr>
              <td style={{ width: '50%', verticalAlign: 'top' }}>
                <div style={{ fontSize: 9, color: '#555' }}>Consignee (Ship to)</div>
                <div style={{ fontWeight: 700, marginTop: 2 }}>{invoice.customerName}</div>
                {invoice.customerAddress && <div style={{ whiteSpace: 'pre-line', marginTop: 2 }}>{invoice.customerAddress}</div>}
                {invoice.customerGST && <div style={{ marginTop: 2 }}>GSTIN/UIN : {invoice.customerGST}</div>}
              </td>
              <td style={{ width: '25%', verticalAlign: 'top' }}><div style={{ fontSize: 9, color: '#555' }}>Buyer's Order No.</div></td>
              <td style={{ width: '25%', verticalAlign: 'top' }}><div style={{ fontSize: 9, color: '#555' }}>Dated</div></td>
            </tr>
            <tr>
              <td style={{ verticalAlign: 'top' }}>
                <div style={{ fontSize: 9, color: '#555' }}>Buyer (Bill to)</div>
                <div style={{ fontWeight: 700, marginTop: 2 }}>{invoice.customerName}</div>
                {invoice.customerAddress && <div style={{ whiteSpace: 'pre-line', marginTop: 2 }}>{invoice.customerAddress}</div>}
                {invoice.customerGST && <div style={{ marginTop: 2 }}>GSTIN/UIN : {invoice.customerGST}</div>}
              </td>
              <td colSpan={2} style={{ verticalAlign: 'top' }}>
                <div style={{ fontSize: 9, color: '#555' }}>Dispatch Doc No.</div>
                <div style={{ fontSize: 9, color: '#555', marginTop: 8 }}>Dispatched through</div>
                <div style={{ fontSize: 9, color: '#555', marginTop: 8 }}>Terms of Delivery</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── Items table (7 columns) ── */}
        <table style={{ marginTop: -1 }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ width: '4%',  textAlign: 'center' }}>Sl<br/>No.</th>
              <th style={{ textAlign: 'left' }}>Description of Goods</th>
              <th style={{ width: '10%', textAlign: 'center' }}>HSN/SAC</th>
              <th style={{ width: '12%', textAlign: 'center' }}>Quantity</th>
              <th style={{ width: '12%', textAlign: 'right' }}>Rate<br/><span style={{ fontSize: 9, fontWeight: 400 }}>(Incl. GST)</span></th>
              <th style={{ width: '6%',  textAlign: 'center' }}>per</th>
              <th style={{ width: '12%', textAlign: 'right' }}>Amount<br/><span style={{ fontSize: 9, fontWeight: 400 }}>(Incl. GST)</span></th>
            </tr>
          </thead>
          <tbody>
            {/* Item rows */}
            {items.map((item, i) => (
              <tr key={i}>
                <td style={{ textAlign: 'center' }}>{i + 1}</td>
                <td style={{ fontWeight: 600 }}>{item.itemName || item.item_name}</td>
                <td style={{ textAlign: 'center' }}>{item.hsnCode || item.hsn_code || ''}</td>
                <td style={{ textAlign: 'center', fontWeight: 600 }}>
                  {item.quantity} {item.unit || 'PCS'}
                </td>
                <td style={{ textAlign: 'right' }}>{fmt(rateInclGst(item))}</td>
                <td style={{ textAlign: 'center' }}>{item.unit || 'PCS'}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(r2(item.totalWithTax || item.total_with_tax || 0))}</td>
              </tr>
            ))}

            {/* Padding rows */}
            {Array.from({ length: PAD_ROWS }).map((_, i) => (
              <tr key={`pad-${i}`} style={{ height: 22 }}>
                <td/><td/><td/><td/><td/><td/><td/>
              </tr>
            ))}

            {/* Subtotal row (amount before tax, right-aligned in Amount col) */}
            <tr>
              <td colSpan={6} style={{ textAlign: 'right', border: '1px solid #000', borderRight: 'none', color: '#555', fontSize: 10 }}>
                Sub-total (before tax)
              </td>
              <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(subtotal)}</td>
            </tr>

            {/* GST rows — one line per rate per tax type */}
            {Object.entries(gstByRate).sort((a, b) => a[0] - b[0]).map(([rate, gst]) => {
              const rateNum = parseFloat(rate);
              if (isInterstate) {
                return gst.igst > 0 ? (
                  <tr key={`igst-${rate}`}>
                    <td colSpan={5} style={{ textAlign: 'right', fontStyle: 'italic' }}>IGST @ {rateNum}%</td>
                    <td style={{ textAlign: 'center', fontStyle: 'italic' }}>{rateNum}%</td>
                    <td style={{ textAlign: 'right' }}>{fmt(gst.igst)}</td>
                  </tr>
                ) : null;
              }
              return [
                gst.cgst > 0 && (
                  <tr key={`cgst-${rate}`}>
                    <td colSpan={5} style={{ textAlign: 'right', fontStyle: 'italic' }}>CGST @ {rateNum / 2}%</td>
                    <td style={{ textAlign: 'center', fontStyle: 'italic' }}>{rateNum / 2}%</td>
                    <td style={{ textAlign: 'right' }}>{fmt(gst.cgst)}</td>
                  </tr>
                ),
                gst.sgst > 0 && (
                  <tr key={`sgst-${rate}`}>
                    <td colSpan={5} style={{ textAlign: 'right', fontStyle: 'italic' }}>SGST @ {rateNum / 2}%</td>
                    <td style={{ textAlign: 'center', fontStyle: 'italic' }}>{rateNum / 2}%</td>
                    <td style={{ textAlign: 'right' }}>{fmt(gst.sgst)}</td>
                  </tr>
                ),
              ];
            })}

            {/* Round off */}
            {Math.abs(roundOff) > 0.001 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'right', fontStyle: 'italic' }}>Round Off</td>
                <td style={{ textAlign: 'right' }}>{fmt(roundOff)}</td>
              </tr>
            )}

            {/* Grand Total */}
            <tr style={{ background: '#f5f5f5' }}>
              <td colSpan={6} style={{ textAlign: 'right', fontWeight: 700, fontSize: 12 }}>Total</td>
              <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 12 }}>₹{fmt(rounded)}</td>
            </tr>
          </tbody>
        </table>

        {/* ── Amount in words ── */}
        <table style={{ marginTop: -1 }}>
          <tbody>
            <tr>
              <td style={{ width: '80%' }}>
                <div style={{ fontSize: 9, color: '#555' }}>Amount Chargeable (in words)</div>
                <div style={{ fontWeight: 700, marginTop: 2 }}>{numToWords(rounded)}</div>
              </td>
              <td style={{ textAlign: 'right', verticalAlign: 'top' }}>
                <span style={{ fontSize: 9, color: '#555' }}>E. &amp; O.E</span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── GST breakdown (HSN-wise) ── */}
        <table style={{ marginTop: -1 }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th>HSN/SAC</th>
              <th>Taxable Value</th>
              {isInterstate ? (
                <><th colSpan={2}>Integrated Tax</th></>
              ) : (
                <><th colSpan={2}>Central Tax</th><th colSpan={2}>State Tax</th></>
              )}
              <th>Total Tax</th>
            </tr>
            <tr style={{ background: '#f5f5f5' }}>
              <th/><th/>
              {isInterstate
                ? <><th>Rate</th><th>Amount</th></>
                : <><th>Rate</th><th>Amount</th><th>Rate</th><th>Amount</th></>}
              <th/>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td style={{ textAlign: 'center' }}>{item.hsnCode || item.hsn_code || ''}</td>
                <td style={{ textAlign: 'right' }}>{fmt(r2(item.amount || 0))}</td>
                {isInterstate ? (
                  <>
                    <td style={{ textAlign: 'center' }}>{item.gstRate || item.gst_rate}%</td>
                    <td style={{ textAlign: 'right' }}>{fmt(r2(item.igst || 0))}</td>
                  </>
                ) : (
                  <>
                    <td style={{ textAlign: 'center' }}>{r2((item.gstRate || item.gst_rate || 0) / 2)}%</td>
                    <td style={{ textAlign: 'right' }}>{fmt(r2(item.cgst || 0))}</td>
                    <td style={{ textAlign: 'center' }}>{r2((item.gstRate || item.gst_rate || 0) / 2)}%</td>
                    <td style={{ textAlign: 'right' }}>{fmt(r2(item.sgst || 0))}</td>
                  </>
                )}
                <td style={{ textAlign: 'right' }}>{fmt(r2((item.igst || 0) + (item.cgst || 0) + (item.sgst || 0)))}</td>
              </tr>
            ))}
            <tr style={{ fontWeight: 700, background: '#f5f5f5' }}>
              <td>Total</td>
              <td style={{ textAlign: 'right' }}>{fmt(subtotal)}</td>
              {isInterstate ? (
                <><td/><td style={{ textAlign: 'right' }}>{fmt(r2(invoice.totalIGST))}</td></>
              ) : (
                <><td/><td style={{ textAlign: 'right' }}>{fmt(r2(invoice.totalCGST))}</td>
                  <td/><td style={{ textAlign: 'right' }}>{fmt(r2(invoice.totalSGST))}</td></>
              )}
              <td style={{ textAlign: 'right' }}>{fmt(totalTax)}</td>
            </tr>
          </tbody>
        </table>

        {/* ── Tax amount in words ── */}
        <table style={{ marginTop: -1 }}>
          <tbody>
            <tr>
              <td>
                <span style={{ fontSize: 9, color: '#555' }}>Tax Amount (in words) : </span>
                <span style={{ fontWeight: 600 }}>{numToWords(totalTax)}</span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── Footer: QR + signature ── */}
        <table style={{ marginTop: -1 }}>
          <tbody>
            <tr>
              <td style={{ width: '40%', verticalAlign: 'top', padding: 10 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Payment via UPI</div>
                <img
                  src="/payment-qr.png"
                  alt="Payment QR Code"
                  style={{ width: 120, height: 120, display: 'block', border: '1px solid #ccc' }}
                />
                <div style={{ marginTop: 6, fontSize: 11 }}>
                  <strong>UPI ID:</strong> {UPI_ID}
                </div>
                <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>Scan to pay</div>
              </td>
              <td style={{ width: '35%', verticalAlign: 'top', padding: 10 }}>
                <div style={{ fontSize: 9, color: '#555', marginBottom: 4 }}>Declaration</div>
                <div style={{ fontSize: 9 }}>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</div>
                <div style={{ fontSize: 9, marginTop: 10 }}>
                  <strong>Company's Bank Details</strong><br />
                  Bank Name : PNB Bank<br />
                  A/c No. : 2379002100016245<br />
                  IFS Code : PUNB0237900
                </div>
              </td>
              <td style={{ width: '25%', verticalAlign: 'bottom', textAlign: 'right', padding: 10 }}>
                <div style={{ fontWeight: 600, marginBottom: 50 }}>for {COMPANY.name}</div>
                <div style={{ borderTop: '1px solid #000', paddingTop: 4, fontSize: 10 }}>Authorised Signatory</div>
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ textAlign: 'center', fontSize: 9, color: '#555', marginTop: 8, borderTop: '1px solid #ddd', paddingTop: 6 }}>
          This is a Computer Generated Invoice
        </div>
      </div>
    </>
  );
}
