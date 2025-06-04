import pino from 'pino';
import App from './app.ts';
import { mongoConnect } from './db/connection.ts';

const logger = pino();

mongoConnect();

App.listen(process.env.PORT, () => logger.info(`✓ Server listening on port: ${process.env.PORT}`));
