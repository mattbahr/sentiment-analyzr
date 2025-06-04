import mongoose from 'mongoose';
import { mongoConnect } from './connection.ts';
import Trial from '../models/trial.ts';

describe('MongoDB connection', () => {
  beforeAll(async () => {
    await mongoConnect();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  test('Should successfully connect to the database', async () => {
    const trials = await Trial.find({});
    expect(mongoose.connection.readyState).toEqual(1);
  });
});
