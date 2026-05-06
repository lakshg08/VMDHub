import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { query } from '../database/db';

export default function VendorScreen() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { loadVendors(); }, []);

  async function loadVendors() {
    try {
      const rows = await query('SELECT * FROM vendors ORDER BY name');
      setVendors(rows);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = vendors.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#3498db" /></View>;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search vendors..."
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            {item.contact_person ? <Text style={styles.sub}>{item.contact_person}</Text> : null}
            {item.email ? <Text style={styles.sub}>{item.email}</Text> : null}
            {item.gst_number ? <Text style={styles.gst}>GST: {item.gst_number}</Text> : null}
          </View>
        )}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No vendors found</Text></View>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  search: { margin: 12, padding: 10, backgroundColor: 'white', borderRadius: 8, fontSize: 14, borderWidth: 1, borderColor: '#e0e0e0' },
  card: { backgroundColor: 'white', margin: 8, marginTop: 0, borderRadius: 8, padding: 14, elevation: 1 },
  name: { fontWeight: '700', fontSize: 16, color: '#2c3e50', marginBottom: 4 },
  sub: { color: '#666', fontSize: 13, marginBottom: 2 },
  gst: { color: '#999', fontSize: 11, fontFamily: 'monospace', marginTop: 4 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#999' },
});
