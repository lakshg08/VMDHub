import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { query } from '../database/db';

export default function HomeScreen() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const now = new Date();
      const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const [vendors] = await query('SELECT COUNT(*) as count FROM vendors');
      const [products] = await query('SELECT COUNT(*) as count FROM products');
      const [invoices] = await query("SELECT COUNT(*) as count FROM invoices WHERE status != 'cancelled'");
      const monthRows = await query(
        "SELECT COALESCE(SUM(total_amount_after_tax), 0) as revenue FROM invoices WHERE invoice_date LIKE ? AND status != 'cancelled'",
        [`${ym}%`]
      );

      setStats({
        vendors: vendors.count,
        products: products.count,
        invoices: invoices.count,
        monthlyRevenue: monthRows[0]?.revenue || 0,
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>VMDHub</Text>
      <Text style={styles.subtitle}>{new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</Text>

      <View style={styles.grid}>
        <StatCard label="Monthly Revenue" value={`₹${(stats?.monthlyRevenue || 0).toLocaleString('en-IN')}`} color="#3498db" />
        <StatCard label="Vendors" value={stats?.vendors || 0} color="#27ae60" />
        <StatCard label="Products" value={stats?.products || 0} color="#f39c12" />
        <StatCard label="Invoices" value={stats?.invoices || 0} color="#9b59b6" />
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value, color }) {
  return (
    <View style={[styles.card, { borderTopColor: color }]}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={[styles.cardValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: '#2c3e50', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    backgroundColor: 'white', borderRadius: 8, padding: 16,
    width: '47%', borderTopWidth: 3,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  cardLabel: { fontSize: 11, color: '#666', textTransform: 'uppercase', marginBottom: 6 },
  cardValue: { fontSize: 24, fontWeight: '700' },
});
