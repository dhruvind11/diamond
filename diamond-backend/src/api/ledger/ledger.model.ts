import * as mongoose from 'mongoose';

const LedgerSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyProfile', required: true },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // who pays
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // who receives

    amount: { type: Number, required: true },
    type: { type: String, enum: ['debit', 'credit', 'credit brokerage'], required: true },
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
