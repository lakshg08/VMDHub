import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { query, execute } from '../database/db';

export default function SettingsScreen() {
  const [settings, setSettings] = useState({ company_name: '', company_gst: '', currency: 'INR' });
  const [saved, setSaved] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    const rows = await query('SELECT * FROM settings LIMIT 1');
    if (rows[0]) setSettings(rows[0]);
  }

  async function handleSave() {
    try {
      const existing = await query('SELECT id FROM settings LIMIT 1');
      if (existing[0]) {
        await execute(
          'UPDATE settings SET company_name=?, company_gst=?, currency=? WHERE id=?',
          [settings.company_name, settings.company_gst, settings.currency, existing[0].id]
        );
      } else {
        await execute(
          'INSERT INTO settings (company_name, company_gst, currency) VALUES (?, ?, ?)',
          [settings.company_name, settings.company_gst, settings.currency]
        );
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      Alert.alert('Error', 'Failed to save settings');
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Company Information</Text>
        <View style={styles.field}>
          <Text style={styles.label}>Company Name</Text>
          <TextInput
            style={styles.input}
            value={settings.company_name}
            onChangeText={v => setSettings({ ...settings, company_name: v })}
            placeholder="Your Company Pvt. Ltd."
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>GST Number</Text>
          <TextInput
            style={styles.input}
            value={settings.company_gst}
            onChangeText={v => setSettings({ ...settings, company_gst: v.toUpperCase() })}
            placeholder="22AAAAA0000A1Z5"
            autoCapitalize="characters"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Currency</Text>
          <TextInput
            style={styles.input}
            value={settings.currency}
            onChangeText={v => setSettings({ ...settings, currency: v })}
            placeholder="INR"
          />
        </View>
      </View>

      <TouchableOpacity style={[styles.saveBtn, saved && styles.saveBtnSaved]} onPress={handleSave}>
        <Text style={styles.saveBtnText}>{saved ? '✓ Saved!' : 'Save Settings'}</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>VMDHub v1.0.0</Text>
        <Text style={styles.aboutText}>Vendor Management & Invoice Hub</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9', padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#2c3e50', marginBottom: 16 },
  card: { backgroundColor: 'white', borderRadius: 8, padding: 16, marginBottom: 16, elevation: 1 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#666', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5 },
  field: { marginBottom: 14 },
  label: { fontSize: 11, color: '#666', textTransform: 'uppercase', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 10, fontSize: 14 },
  saveBtn: { backgroundColor: '#3498db', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 16 },
  saveBtnSaved: { backgroundColor: '#27ae60' },
  saveBtnText: { color: 'white', fontWeight: '600', fontSize: 16 },
  aboutText: { color: '#666', marginBottom: 4 },
});
