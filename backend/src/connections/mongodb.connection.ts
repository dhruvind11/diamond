import { connect } from 'mongoose';
import Logger from '../services/logger/logger.service';

class MongoDBConnecction {
  async init(): Promise<void> {
    try {
      const MONGO_SRV = process.env.MONGO_SRV;

      await connect(`${MONGO_SRV}`);

      // set('debug', true);

      Logger.info('Database connected successfully.');
    } catch (err) {
      Logger.error(err);
      process.exit(0);
    }
  }
}

export default new MongoDBConnecction();
