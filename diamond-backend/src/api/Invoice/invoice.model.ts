import * as mongoose from 'mongoose';
// import { UserI } from './users.interface';

const itemsSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true,
  },
  itemDescription: {
    type: String,
    required: true,
  },
  cost: { type: Number, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
});

const paymentSchema = new mongoose.Schema({
  paymentDate: { type: Date, required: true },
  amount: { type: Number, required: true },
  note: { type: String },
});
const InvoiceSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompanyProfile',
      required: true,
      index: true,
    },
    invoiceNo: {
      type: Number,
      required: true,
      unique: true,
    },
    billNo: {
      type: String,
      required: true,
      unique: true,
    },
    invoiceType: {
      type: String,
      enum: ['buy', 'sell'],
      required: true,
    },
    createdDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    brokerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    brokeragePercentage: { type: Number, default: 0 },
    brokerageAmount: { type: Number, default: 0 },
    items: [
      {
        type: itemsSchema,
        required: true,
      },
    ],
    subTotal: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      required: true,
    },
    // tax: {
    //   type: Number,
    //   required: true,
    // },
    payments: [{ type: paymentSchema }],
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Unpaid'],
      default: 'Unpaid',
      required: true,
    },
    billStatus: {
      type: String,
      enum: ['Pending', 'In Progress', 'Complete'],
      default: 'Pending',
      required: true,
    },
    note: {
      type: String,
    },
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

const InvoiceModel = mongoose.model<any & mongoose.Document>('Invoice', InvoiceSchema);

export default InvoiceModel;
