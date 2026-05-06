import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { query } from '../database/db';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function ReportScreen() {
  const [yearData, setYearData] = useState([]);
  const [totals, setTotals] = useState({});
  const [loading, setLoading] = useState(true);
  const [year] = useState(new Date().getFullYear());

  useEffect(() => { loadReport(); }, [year]);

  async function loadReport() {
    try {
      const months = [];
      let totalRevenue = 0, totalTax = 0;

      for (let m = 1; m <= 12; m++) {
        const ym = `${year}-${String(m).padStart(2, '0')}`;
        const rows = await query(
          "SELECT COUNT(*) as count, COALESCE(SUM(total_amount_after_tax), 0) as revenue, COALESCE(SUM(total_tax), 0) as tax FROM invoices WHERE invoice_date LIKE ? AND status != 'cancelled'",
          [`${ym}%`]
        );
        const row = rows[0] || { count: 0, revenue: 0, tax: 0 };
        months.push({ month: MONTHS[m - 1], ...row });
        totalRevenue += row.revenue;
        totalTax += row.tax;
      }

      setYearData(months);
      setTotals({ revenue: totalRevenue, tax: totalTax });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#3498db" /></View>;

  const maxRevenue = Math.max(...yearData.map(m => m.revenue), 1);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Reports - {year}</Text>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Revenue</Text>
          <Text style={[styles.summaryValue, { color: '#3498db' }]}>₹{(totals.revenue || 0).toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Tax</Text>
          <Text style={[styles.summaryValue, { color: '#e74c3c' }]}>₹{(totals.tax || 0).toLocaleString('en-IN')}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Monthly Revenue</Text>
      {yearData.map((m, i) => (
        <View key={i} style={styles.barRow}>
          <Text style={styles.barLabel}>{m.month}</Text>
          <View style={styles.barTrack}>
            <View style={[styles.bar, { width: `${(m.revenue / maxRevenue) * 100}%` }]} />
          </View>
          <Text style={styles.barValue}>₹{(m.revenue / 1000).toFixed(1)}k</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Monthly Breakdown</Text>
      {yearData.map((m, i) => (
        <View key={i} style={styles.tableRow}>
          <Text style={styles.col1}>{m.month}</Text>
          <Text style={styles.col2}>{m.count} invoices</Text>
          <Text style={styles.col3}>₹{(m.revenue || 0).toLocaleString('en-IN')}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: '#2c3e50', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  summaryCard: { flex: 1, backgroundColor: 'white', borderRadius: 8, padding: 16, elevation: 1 },
  summaryLabel: { fontSize: 11, color: '#666', textTransform: 'uppercase' },
  summaryValue: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 12, marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  barLabel: { width: 32, fontSize: 11, color: '#666' },
  barTrack: { flex: 1, height: 12, backgroundColor: '#e0e0e0', borderRadius: 6, marginHorizontal: 8 },
  bar: { height: 12, backgroundColor: '#3498db', borderRadius: 6, minWidth: 4 },
  barValue: { width: 50, fontSize: 11, color: '#666', textAlign: 'right' },
  tableRow: { flexDirection: 'row', backgroundColor: 'white', padding: 10, marginBottom: 4, borderRadius: 6 },
  col1: { width: 40, fontWeight: '600', color: '#444' },
  col2: { flex: 1, color: '#666', fontSize: 12 },
  col3: { fontWeight: '600', color: '#2c3e50' },
});
