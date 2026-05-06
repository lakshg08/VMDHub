class MonthlyGST {
  constructor(data = {}) {
    this.id = data.id || null;
    this.yearMonth = data.year_month || data.yearMonth || '';
    this.inputIGST = parseFloat(data.input_igst || data.inputIGST || 0);
    this.inputCGST = parseFloat(data.input_cgst || data.inputCGST || 0);
    this.inputSGST = parseFloat(data.input_sgst || data.inputSGST || 0);
    this.inputNotes = data.input_notes || data.inputNotes || '';
    this.outputIGST = parseFloat(data.output_igst || data.outputIGST || 0);
    this.outputCGST = parseFloat(data.output_cgst || data.outputCGST || 0);
    this.outputSGST = parseFloat(data.output_sgst || data.outputSGST || 0);
    this.createdAt = data.created_at || data.createdAt || new Date().toISOString();
    this.updatedAt = data.updated_at || data.updatedAt || new Date().toISOString();
  }

  get totalInput() {
    return this.inputIGST + this.inputCGST + this.inputSGST;
  }

  get totalOutput() {
    return this.outputIGST + this.outputCGST + this.outputSGST;
  }

  get netPayable() {
    return Math.max(0, this.totalOutput - this.totalInput);
  }

  get payableIGST() {
    return Math.max(0, this.outputIGST - this.inputIGST);
  }

  get payableCGST() {
    return Math.max(0, this.outputCGST - this.inputCGST);
  }

  get payableSGST() {
    return Math.max(0, this.outputSGST - this.inputSGST);
  }

  toDBObject() {
    return {
      year_month: this.yearMonth,
      input_igst: this.inputIGST,
      input_cgst: this.inputCGST,
      input_sgst: this.inputSGST,
      input_notes: this.inputNotes,
      output_igst: this.outputIGST,
      output_cgst: this.outputCGST,
      output_sgst: this.outputSGST,
    };
  }

  toJSON() {
    return {
      id: this.id,
      yearMonth: this.yearMonth,
      inputIGST: this.inputIGST,
      inputCGST: this.inputCGST,
      inputSGST: this.inputSGST,
      inputNotes: this.inputNotes,
      outputIGST: this.outputIGST,
      outputCGST: this.outputCGST,
      outputSGST: this.outputSGST,
      totalInput: this.totalInput,
      totalOutput: this.totalOutput,
      netPayable: this.netPayable,
      payableIGST: this.payableIGST,
      payableCGST: this.payableCGST,
      payableSGST: this.payableSGST,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromJSON(json) {
    return new MonthlyGST(json);
  }
}

module.exports = MonthlyGST;
