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
  return Number(n || 0).toFixed(2);
}

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
  return words + ' Only';
}

export default function InvoicePrint() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch(`${API}/invoices/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setInvoice(data);
      })
      .catch(e => setError(e.message));
  }, [id]);

  if (error) return <div style={{ padding: 40, color: 'red' }}>Error: {error}</div>;
  if (!invoice) return <div style={{ padding: 40 }}>Loading…</div>;

  const items = invoice.items || [];
  const isInterstate = invoice.invoiceType === 'interstate';

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          .invoice-page { box-shadow: none !important; margin: 0 !important; }
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
        .no-border td, .no-border th { border: none; }
      `}</style>

      <div className="no-print" style={{ textAlign: 'center', padding: '12px 0' }}>
        <button
          onClick={() => window.print()}
          style={{ padding: '8px 24px', background: '#2c3e50', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14, marginRight: 8 }}
        >
          Print / Save PDF
        </button>
        <button
          onClick={() => window.close()}
          style={{ padding: '8px 16px', background: '#666', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 }}
        >
          Close
        </button>
      </div>

      <div className="invoice-page">
        {/* Title */}
        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Tax Invoice</div>

        {/* Top section: company + invoice meta */}
        <table style={{ marginBottom: 0 }}>
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
              <td colSpan={2}>
                <div style={{ fontSize: 9, color: '#555' }}>Other References</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Consignee / Buyer */}
        <table style={{ marginTop: -1 }}>
          <tbody>
            <tr>
              <td style={{ width: '50%', verticalAlign: 'top' }}>
                <div style={{ fontSize: 9, color: '#555' }}>Consignee (Ship to)</div>
                <div style={{ fontWeight: 700, marginTop: 2 }}>{invoice.customerName}</div>
                {invoice.customerAddress && (
                  <div style={{ whiteSpace: 'pre-line', marginTop: 2 }}>{invoice.customerAddress}</div>
                )}
                {invoice.customerGST && <div style={{ marginTop: 2 }}>GSTIN/UIN &nbsp;: {invoice.customerGST}</div>}
              </td>
              <td style={{ width: '25%', verticalAlign: 'top' }}>
                <div style={{ fontSize: 9, color: '#555' }}>Buyer's Order No.</div>
              </td>
              <td style={{ width: '25%', verticalAlign: 'top' }}>
                <div style={{ fontSize: 9, color: '#555' }}>Dated</div>
              </td>
            </tr>
            <tr>
              <td style={{ verticalAlign: 'top' }}>
                <div style={{ fontSize: 9, color: '#555' }}>Buyer (Bill to)</div>
                <div style={{ fontWeight: 700, marginTop: 2 }}>{invoice.customerName}</div>
                {invoice.customerAddress && (
                  <div style={{ whiteSpace: 'pre-line', marginTop: 2 }}>{invoice.customerAddress}</div>
                )}
                {invoice.customerGST && <div style={{ marginTop: 2 }}>GSTIN/UIN &nbsp;: {invoice.customerGST}</div>}
              </td>
              <td colSpan={2} style={{ verticalAlign: 'top' }}>
                <div style={{ fontSize: 9, color: '#555' }}>Dispatch Doc No.</div>
                <div style={{ fontSize: 9, color: '#555', marginTop: 8 }}>Dispatched through</div>
                <div style={{ fontSize: 9, color: '#555', marginTop: 8 }}>Terms of Delivery</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Items table */}
        <table style={{ marginTop: -1 }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ width: '4%', textAlign: 'center' }}>Sl No.</th>
              <th style={{ textAlign: 'left' }}>Description of Goods</th>
              <th style={{ width: '10%', textAlign: 'center' }}>HSN/SAC</th>
              <th style={{ width: '10%', textAlign: 'center' }}>Quantity</th>
              <th style={{ width: '9%', textAlign: 'right' }}>Rate</th>
              <th style={{ width: '6%', textAlign: 'center' }}>per</th>
              {isInterstate ? (
                <th style={{ width: '9%', textAlign: 'right' }}>IGST</th>
              ) : (
                <>
                  <th style={{ width: '9%', textAlign: 'right' }}>CGST</th>
                  <th style={{ width: '9%', textAlign: 'right' }}>SGST</th>
                </>
              )}
              <th style={{ width: '10%', textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td style={{ textAlign: 'center' }}>{i + 1}</td>
                <td style={{ fontWeight: 600 }}>{item.itemName || item.item_name}</td>
                <td style={{ textAlign: 'center' }}>{item.hsnCode || item.hsn_code || ''}</td>
                <td style={{ textAlign: 'center' }}>
                  {item.quantity} {item.unit || 'PCS'}
                </td>
                <td style={{ textAlign: 'right' }}>{fmt(item.unitPrice || item.unit_price)}</td>
                <td style={{ textAlign: 'center' }}>PCS</td>
                {isInterstate ? (
                  <td style={{ textAlign: 'right' }}>{fmt(item.igst)}</td>
                ) : (
                  <>
                    <td style={{ textAlign: 'right' }}>{fmt(item.cgst)}</td>
                    <td style={{ textAlign: 'right' }}>{fmt(item.sgst)}</td>
                  </>
                )}
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(item.amount)}</td>
              </tr>
            ))}
            {/* Padding rows for short invoices */}
            {items.length < 8 && Array.from({ length: 8 - items.length }).map((_, i) => (
              <tr key={`pad-${i}`} style={{ height: 22 }}>
                <td /><td /><td /><td /><td /><td />
                {isInterstate ? <td /> : <><td /><td /></>}
                <td />
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#f5f5f5' }}>
              <td colSpan={2} style={{ textAlign: 'right', fontWeight: 700 }}>Total</td>
              <td /><td />
              <td />
              <td />
              {isInterstate ? (
                <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{fmt(invoice.totalIGST)}</td>
              ) : (
                <>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{fmt(invoice.totalCGST)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{fmt(invoice.totalSGST)}</td>
                </>
              )}
              <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{fmt(invoice.totalAmountAfterTax)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Amount in words + tax summary */}
        <table style={{ marginTop: -1 }}>
          <tbody>
            <tr>
              <td style={{ width: '65%' }}>
                <span style={{ fontSize: 9, color: '#555' }}>Amount Chargeable (in words)</span>
                <div style={{ fontWeight: 700, marginTop: 2 }}>
                  INR {numToWords(invoice.totalAmountAfterTax)}
                </div>
              </td>
              <td style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 9, color: '#555' }}>E. &amp; O.E</span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* GST breakdown */}
        <table style={{ marginTop: -1 }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th>HSN/SAC</th>
              <th>Taxable Value</th>
              {isInterstate ? (
                <>
                  <th colSpan={2}>Integrated Tax</th>
                </>
              ) : (
                <>
                  <th colSpan={2}>Central Tax</th>
                  <th colSpan={2}>State Tax</th>
                </>
              )}
              <th>Total Tax Amount</th>
            </tr>
            <tr style={{ background: '#f5f5f5' }}>
              <th /><th />
              {isInterstate ? (
                <><th>Rate</th><th>Amount</th></>
              ) : (
                <><th>Rate</th><th>Amount</th><th>Rate</th><th>Amount</th></>
              )}
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td style={{ textAlign: 'center' }}>{item.hsnCode || item.hsn_code || ''}</td>
                <td style={{ textAlign: 'right' }}>{fmt(item.amount)}</td>
                {isInterstate ? (
                  <>
                    <td style={{ textAlign: 'center' }}>{item.gstRate || item.gst_rate}%</td>
                    <td style={{ textAlign: 'right' }}>{fmt(item.igst)}</td>
                  </>
                ) : (
                  <>
                    <td style={{ textAlign: 'center' }}>{(item.gstRate || item.gst_rate) / 2}%</td>
                    <td style={{ textAlign: 'right' }}>{fmt(item.cgst)}</td>
                    <td style={{ textAlign: 'center' }}>{(item.gstRate || item.gst_rate) / 2}%</td>
                    <td style={{ textAlign: 'right' }}>{fmt(item.sgst)}</td>
                  </>
                )}
                <td style={{ textAlign: 'right' }}>
                  {fmt((item.igst || 0) + (item.cgst || 0) + (item.sgst || 0))}
                </td>
              </tr>
            ))}
            <tr style={{ fontWeight: 700, background: '#f5f5f5' }}>
              <td>Total</td>
              <td style={{ textAlign: 'right' }}>{fmt(invoice.totalAmountBeforeTax)}</td>
              {isInterstate ? (
                <>
                  <td />
                  <td style={{ textAlign: 'right' }}>{fmt(invoice.totalIGST)}</td>
                </>
              ) : (
                <>
                  <td />
                  <td style={{ textAlign: 'right' }}>{fmt(invoice.totalCGST)}</td>
                  <td />
                  <td style={{ textAlign: 'right' }}>{fmt(invoice.totalSGST)}</td>
                </>
              )}
              <td style={{ textAlign: 'right' }}>{fmt(invoice.totalTax)}</td>
            </tr>
          </tbody>
        </table>

        {/* Tax amount in words */}
        <table style={{ marginTop: -1 }}>
          <tbody>
            <tr>
              <td>
                <span style={{ fontSize: 9, color: '#555' }}>Tax Amount (in words) : </span>
                <span style={{ fontWeight: 600 }}>INR {numToWords(invoice.totalTax)}</span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer: QR code + signature */}
        <table style={{ marginTop: -1 }}>
          <tbody>
            <tr>
              <td style={{ width: '40%', verticalAlign: 'top', padding: '8px' }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Payment via UPI</div>
                <img
                  src="/payment-qr.png"
                  alt="Payment QR Code"
                  style={{ width: 120, height: 120, display: 'block', border: '1px solid #ddd' }}
                />
                <div style={{ marginTop: 6, fontSize: 11 }}>
                  <strong>UPI ID:</strong> {UPI_ID}
                </div>
                <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>Scan to pay</div>
              </td>
              <td style={{ width: '60%', verticalAlign: 'bottom', textAlign: 'right', padding: '8px' }}>
                <div style={{ marginBottom: 40 }}>
                  <span style={{ fontWeight: 600 }}>For {COMPANY.name}</span>
                </div>
                <div style={{ borderTop: '1px solid #000', display: 'inline-block', minWidth: 160, paddingTop: 4 }}>
                  Authorised Signatory
                </div>
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
