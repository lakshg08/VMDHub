import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import PrintDocument from './PrintDocument';

const API = 'http://localhost:3001/api';

export default function QuotationPrint() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [bank, setBank] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch(`${API}/quotations/${id}`).then(r => r.json()),
      apiFetch(`${API}/settings`).then(r => r.json()),
    ]).then(([q, sett]) => {
      if (q.error) throw new Error(q.error);
      setDoc({
        type: 'quotation',
        number: q.quotationNumber,
        date: q.quotationDate,
        validUntil: q.validUntil || null,
        status: q.status,
        invoiceType: q.invoiceType,
        customerName: q.customerName,
        customerAddress: q.customerAddress,
        customerGST: q.customerGST,
        items: q.items || [],
        totalAmountBeforeTax: q.totalAmountBeforeTax,
        totalIGST: q.totalIGST,
        totalCGST: q.totalCGST,
        totalSGST: q.totalSGST,
        totalTax: q.totalTax,
        totalAmountAfterTax: q.totalAmountAfterTax,
      });
      setBank({
        upiId: sett.upi_id || '',
        name: sett.bank_name || '',
        accountNumber: sett.bank_account_number || '',
        accountType: sett.bank_account_type || '',
        ifsc: sett.bank_ifsc || '',
      });
    }).catch(e => setError(e.message));
  }, [id]);

  if (error) return <div style={{ padding: 40, color: 'red' }}>Error: {error}</div>;
  if (!doc) return <div style={{ padding: 40 }}>Loading…</div>;

  return <PrintDocument doc={doc} bank={bank} />;
}
