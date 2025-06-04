import express from 'express';
import cors from 'cors';
import fs, { read } from 'fs';
import pino from 'pino';
import { readFile, writeFile } from 'fs/promises';
import tmp from 'tmp';
import { getAssistantResponse } from './openai/openai_client.ts';
import Trial from './models/trial.ts';

const logger = pino();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/analyze', async (req, res) => {
  logger.info(`${new Date().toISOString()} - Handling analyze request.`);

  try {
    let { html, apiKey } = req.body;

    if (!apiKey) {
      logger.error(`${new Date().toISOString()} - Missing API key in request body.`);
      res.status(500).json({ error: 'Missing API key' });
      return;
    }

    if (!html) {
      logger.error(`${new Date().toISOString()} - Missing html in request body.`);
      res.status(500).json({ error: 'Missing html' });
      return;
    }

    const token = apiKey.trim();
    const trial = await Trial.findOne({ token });

    if (trial) {
      if (trial.trialCount === 0) {
        logger.info(`${new Date().toISOString()} - Trial expired for email: ${trial.email}`);
        res.status(403).json({ error: 'Trial expired' });
        return;
      }

      logger.info(
        `${new Date().toISOString()} - Trial found for email: ${trial.email}. ${trial.trialCount} ${trial.trialCount === 1 ? 'analysis' : 'analyses'} remaining.`
      );
      trial.trialCount -= 1;
      trial.save();
      apiKey = (await readFile('/run/secrets/openai_api_key', 'utf8')).trim();
    }

    // Create a temporary file for the HTML content
    const tmpFile = tmp.file({ postfix: '.html' }, async (err, path) => {
      if (err) {
        logger.error(`${new Date().toISOString()} - Error creating temporary file: ${err.message}`);
        res.status(500).json({ error: 'Failed to create temporary file.' });
        return;
      }

      await writeFile(path, html);

      const prompt = await readFile('./prompt.txt', 'utf8');
      const result = await getAssistantResponse(path, prompt, apiKey);

      if (!result) {
        res.status(500).json({ error: 'Failed to retrieve analysis from OpenAI.' });
        return;
      }

      logger.info(`${new Date().toISOString()} - Responding with results from OpenAI.`);

      res.json({ result });
    });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    logger.error(`${new Date().toISOString()} - Error processing request: ${errorMessage}`);
    res.status(500).json({ error: errorMessage });
  }
});

export default app;
