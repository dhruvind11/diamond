import 'dotenv/config';
import express from 'express';
import MongoDBConnection from './connections/mongodb.connection';
import Logger from './services/logger/logger.service';
import controllers from './api';
import * as http from 'http';
import { routeAccessLogger } from './middleware/logger.middleware';
import { ControllerI } from './interfaces/common.interface';
import { errorResponse } from './middleware/apiResponse.middleware';
import cors from "cors"

class App {
  public app: express.Application;

  constructor() {
    this.app = express();

    Promise.all([
      this.connectToTheDatabase(),
      this.initializeMiddleware(),
      this.initializeControllers(),
      this.initializeErrorHandling(),
    ]).then(() => {
      this.listen();
    });
  }

  private async connectToTheDatabase() {
    await MongoDBConnection.init();
  }

  private async initializeMiddleware() {
    this.app.use('/export', express.static('src/download'));
    this.app.use(express.urlencoded({ extended: false }));
    this.app.use(cors());
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(routeAccessLogger);
  }

  private async initializeErrorHandling() {
    this.app.use(errorResponse);
  }

  private async initializeControllers() {
    controllers.forEach((controller: ControllerI) => {
      this.app.use('/', controller.router);
    });
  }

  public async listen(): Promise<void> {
    const PORT = process.env.PORT;
    let server = http.createServer(this.app);

    server.listen(PORT, () => {
      Logger.info(`App listening on the PORT ${PORT}`);
    });
  }
}

try {
  new App();
} catch (e: any) {
  Logger.error(`Error on project startup: ${e.message}`);
}

process
  .on('unhandledRejection', (response, p) => {
    Logger.error(response);
    Logger.error(p);
  })
  .on('uncaughtException', (err) => {
    Logger.error(err);
  });

export default App;
