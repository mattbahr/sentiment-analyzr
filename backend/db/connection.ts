import fs from 'fs';
import mongoose from 'mongoose';
import pino from 'pino';

const logger = pino();

const usernameSecretPath = '/run/secrets/mongodb_app_username';
const passwordSecretPath = '/run/secrets/mongodb_app_password';

export const mongoConnect = () => {
  fs.readFile(usernameSecretPath, 'utf8', (err, username) => {
    if (err) {
      logger.error(`Failed to retrieve mongodb username: ${err}`);
      return;
    }

    fs.readFile(passwordSecretPath, 'utf8', (err, password) => {
      if (err) {
        logger.error(`Failed to retrieve mongodb password: ${err}`);
        return;
      }

      const mongoUrl = `mongodb://${username.trim()}:${password.trim()}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/sentiment_analyzr_db`;

      mongoose
        .connect(mongoUrl)
        .then(() => logger.info('✓ MongoDB connected.'))
        .catch((err) => logger.error(`✗ MongoDB connection error: ${err}`));
    });
  });
};
