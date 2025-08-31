import * as mongoose from 'mongoose';
import { UserI } from './users.interface';

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['Party', 'Admin', 'Company'],
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    address: {
      type: String,
      // required: true,
    },
    bankName: {
      type: String,
    },
    country: {
      type: String,
    },
    accountNo: {
      type: Number,
    },
    ifscCode: {
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

// companyProfileSchema.plugin(mongoosePaginate);

const UserModel = mongoose.model<UserI & mongoose.Document>('User', UserSchema);

export default UserModel;
