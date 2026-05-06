class Importers {
  static fromJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data.version) throw new Error('Invalid backup format: missing version');
      return {
        vendors: data.vendors || [],
        products: data.products || [],
        invoices: data.invoices || [],
        monthlyGST: data.monthlyGST || [],
        settings: data.settings || null,
        exportedAt: data.exportedAt,
        version: data.version,
      };
    } catch (err) {
      throw new Error(`Failed to parse backup: ${err.message}`);
    }
  }

  static validateBackup(data) {
    const errors = [];
    if (!data.version) errors.push('Missing version field');
    if (!Array.isArray(data.vendors)) errors.push('Invalid vendors data');
    if (!Array.isArray(data.products)) errors.push('Invalid products data');
    if (!Array.isArray(data.invoices)) errors.push('Invalid invoices data');
    return errors;
  }

  static parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  }

  static invoicesFromCSV(csvString) {
    const lines = csvString.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = this.parseCSVLine(lines[0]);
    return lines.slice(1).map(line => {
      const values = this.parseCSVLine(line);
      const obj = {};
      headers.forEach((h, i) => {
        obj[h.trim().toLowerCase().replace(/ /g, '_')] = (values[i] || '').trim();
      });
      return obj;
    });
  }

  static vendorsFromCSV(csvString) {
    const lines = csvString.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = this.parseCSVLine(lines[0]);
    return lines.slice(1).map(line => {
      const values = this.parseCSVLine(line);
      const obj = {};
      headers.forEach((h, i) => {
        obj[h.trim().toLowerCase().replace(/ /g, '_')] = (values[i] || '').trim();
      });
      return obj;
    });
  }
}

module.exports = Importers;
