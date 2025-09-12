import * as mongoose from 'mongoose';
import { DiwaliCycleI } from './diwaliCycle.interface';

const diwaliCycleSchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
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

const DiwaliCycleModel = mongoose.model<DiwaliCycleI & mongoose.Document>(
  'DiwaliCycle',
  diwaliCycleSchema
);

export default DiwaliCycleModel;
