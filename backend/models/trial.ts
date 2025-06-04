import Mongoose from 'mongoose';

const { Schema } = Mongoose;

interface ITrial {
  token: string;
  email: string;
  trialCount: number;
}

const TrialSchema = new Schema<ITrial>({
  token: { type: String, required: true },
  email: { type: String, required: true },
  trialCount: { type: Number, required: true, default: 0 },
});

const Trial = Mongoose.model<ITrial>('Trial', TrialSchema);

export default Trial;
