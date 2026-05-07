import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import PrintDocument from './PrintDocument';

const API = 'http://localhost:3001/api';

export default function InvoicePrint() {
  const { id } = useParams();
  const mode = new URLSearchParams(window.location.search).get('mode') || 'invoice';
  const [doc, setDoc] = useState(null);
  const [bank, setBank] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch(`${API}/invoices/${id}`).then(r => r.json()),
      apiFetch(`${API}/settings`).then(r => r.json()),
    ]).then(([inv, sett]) => {
      if (inv.error) throw new Error(inv.error);
      setDoc({
        type: mode === 'quotation' ? 'quotation' : 'invoice',
        number: inv.invoiceNumber,
        date: inv.invoiceDate,
        validUntil: null,
        status: inv.status,
        invoiceType: inv.invoiceType,
        customerName: inv.customerName,
        customerAddress: inv.customerAddress,
        shipToAddress: inv.shipToAddress,
        customerGST: inv.customerGST,
        notes: inv.notes,
        transactionReference: inv.transactionReference,
        items: inv.items || [],
        totalAmountBeforeTax: inv.totalAmountBeforeTax,
        totalIGST: inv.totalIGST,
        totalCGST: inv.totalCGST,
        totalSGST: inv.totalSGST,
        totalTax: inv.totalTax,
        totalAmountAfterTax: inv.totalAmountAfterTax,
      });
      setBank({
        upiId: inv.bankUpiId || sett.upi_id || '',
        name: inv.bankName || sett.bank_name || '',
        accountNumber: inv.bankAccountNumber || sett.bank_account_number || '',
        accountType: inv.bankAccountType || sett.bank_account_type || '',
        ifsc: inv.bankIfsc || sett.bank_ifsc || '',
      });
    }).catch(e => setError(e.message));
  }, [id, mode]);

  if (error) return <div style={{ padding: 40, color: 'red' }}>Error: {error}</div>;
  if (!doc) return <div style={{ padding: 40 }}>Loading…</div>;

  return <PrintDocument doc={doc} bank={bank} />;
}
