import * as mongoose from 'mongoose';

const LedgerSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyProfile', required: true },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdDate: { type: Date, default: Date.now },
    amount: { type: Number, required: true },
    type: {
      type: String,
      enum: ['debit', 'credit', 'credit brokerage', 'discount', 'debit brokerage'],
      required: true,
    },
    pendingAmount: { type: Number, default: 0 },
    description: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      getters: true,
    },
  }
);

const LedgerModel = mongoose.model<any & mongoose.Document>('Ledger', LedgerSchema);

export default LedgerModel;
