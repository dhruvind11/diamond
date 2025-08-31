import mongoose from 'mongoose';

const ObjectId = (id: string) => {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch (e) {
    return false;
  }
};

interface UpdateData {
  updateData?: unknown;
  updateOptions?: unknown;
}
interface SortObject {
  _id?: number;
}

interface Options extends UpdateData {
  query?: unknown;
  select?: string;
  sort?: any;
  populate?: any;
  offset?: number;
  limit?: number;
  lean?: boolean;
  insert?: unknown;
  deletedBy?: string;
}

const find = async (collections: any, options?: Options) =>
  collections
    .find(options?.query || {})
    .select(options?.select)
    .populate(options?.populate)
    .sort(options?.sort)
    .skip(options?.offset)
    .limit(options?.limit)
    .lean(options?.lean || true);

const findById = async (collections: any, options?: Options) =>
  collections
    .findById(options?.query || {})
    .select(options?.select)
    .populate(options?.populate)
    .lean(options?.lean || true);

const findOne = async (collections: any, options?: Options) =>
  collections
    .findOne(options?.query || {})
    .select(options?.select)
    .populate(options?.populate)
    .sort(options?.sort)
    .lean(options?.lean ?? true);

const create = async (collections: any, options?: Options) => collections.create(options?.insert);

const insertMany = async (collections: any, options?: Options) =>
  collections.insertMany(options?.insert);

const countDocuments = async (collections: any, options: Options) =>
  collections.countDocuments(options.query).exec();

const softDeleteOne = async (collections: any, options: Options) => {
  const doc = await findOne(collections, options);
  doc.deletedBy = options.deletedBy;
  doc.deleted = true;
  return doc.save();
};

const deleteOne = async (collections: any, options: Options) =>
  collections.deleteOne(options.query).exec();

const findOneAndUpdate = async (collections: any, options: Options) =>
  collections.findOneAndUpdate(
    options.query,
    options.updateData,
    options.updateOptions || { new: true }
  );

const deleteMany = async (collections: any, options: Options) =>
  collections.deleteMany(options.query || {});

const findByIdAndDelete = async (collections: any, options: Options) =>
  collections.findByIdAndDelete(options.query);

const aggregate = async (collections: any, aggregateQuery: any) =>
  collections.aggregate(aggregateQuery);

const updateMany = async (collection: any, options: Options) =>
  collection.updateMany(options.query, options.updateData, options.updateOptions || { new: true });

const exportObject = {
  ObjectId,
  find,
  findById,
  findOne,
  create,
  insertMany,
  countDocuments,
  softDeleteOne,
  deleteOne,
  findOneAndUpdate,
  deleteMany,
  findByIdAndDelete,
  aggregate,
  updateMany,
};

export = exportObject;
