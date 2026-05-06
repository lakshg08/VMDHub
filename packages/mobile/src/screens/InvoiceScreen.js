import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { query } from '../database/db';

export default function InvoiceScreen() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadInvoices(); }, []);

  async function loadInvoices() {
    try {
      const rows = await query('SELECT * FROM invoices ORDER BY invoice_date DESC LIMIT 50');
      setInvoices(rows);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const statusColor = { paid: '#27ae60', sent: '#3498db', draft: '#999', cancelled: '#e74c3c' };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#3498db" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Invoices ({invoices.length})</Text>
      {invoices.length === 0 ? (
        <View style={styles.empty}><Text style={styles.emptyText}>No invoices yet</Text></View>
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.invoiceNum}>{item.invoice_number}</Text>
                <View style={[styles.badge, { backgroundColor: statusColor[item.status] + '22' }]}>
                  <Text style={[styles.badgeText, { color: statusColor[item.status] }]}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.customer}>{item.customer_name}</Text>
              <View style={styles.row}>
                <Text style={styles.date}>{item.invoice_date}</Text>
                <Text style={styles.amount}>₹{(item.total_amount_after_tax || 0).toLocaleString('en-IN')}</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 18, fontWeight: '600', color: '#2c3e50', padding: 16 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 16 },
  card: { backgroundColor: 'white', margin: 8, marginTop: 0, borderRadius: 8, padding: 16, elevation: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  invoiceNum: { fontWeight: '700', fontSize: 16, color: '#2c3e50' },
  customer: { color: '#444', marginBottom: 8 },
  date: { color: '#999', fontSize: 12 },
  amount: { fontWeight: '700', color: '#2c3e50', fontSize: 16 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
});
