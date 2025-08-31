import * as mongoose from 'mongoose';
import { CompanyProfileI } from './companyProfile.interface';

const companyProfileSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    logoImage: {
      type: String,
    },
    address: {
      type: String,
    },
    phone: {
      type: Number,
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

// companyProfileSchema.plugin(mongoosePaginate);

const CompanyProfileModel = mongoose.model<CompanyProfileI & mongoose.Document>(
  'CompanyProfile',
  companyProfileSchema
);

export default CompanyProfileModel;
