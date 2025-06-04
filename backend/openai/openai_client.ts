import OpenAI from 'openai';
import fs from 'fs';
import pino from 'pino';

const logger = pino();

export const getAssistantResponse = async (filePath: string, prompt: string, apiToken: string) => {
  const openai = new OpenAI({ apiKey: apiToken });

  logger.debug(`${new Date().toISOString()} - Sending html to OpenAI.`);

  const htmlFile = await openai.files
    .create({
      file: fs.createReadStream(filePath),
      purpose: 'assistants',
    })
    .catch((err) => {
      logger.error(`${new Date().toISOString()} - Error uploading file to OpenAI: ${err.message}`);
    });

  if (!htmlFile) {
    return;
  }

  logger.debug(`${new Date().toISOString()} - Creating OpenAI thread.`);

  const thread = await openai.beta.threads
    .create({
      messages: [
        {
          role: 'user',
          content: prompt,
          attachments: [
            {
              file_id: htmlFile.id,
              tools: [{ type: 'code_interpreter' }],
            },
          ],
        },
      ],
    })
    .catch((err) => {
      logger.error(`${new Date().toISOString()} - Error creating OpenAI thread: ${err.message}`);
    });

  if (!thread) {
    return;
  }

  logger.debug(`${new Date().toISOString()} - Creating OpenAI assistant.`);

  const assistant = await openai.beta.assistants
    .create({
      name: 'Sentiment Analyzr',
      model: 'gpt-4o',
      tools: [{ type: 'code_interpreter' }],
    })
    .catch((err) => {
      logger.error(`${new Date().toISOString()} - Error creating OpenAI Assistant: ${err.message}`);
    });

  if (!assistant) {
    return;
  }

  logger.debug(`${new Date().toISOString()} - Starting OpenAI Assistant run.`);

  const run = await openai.beta.threads.runs
    .create(thread.id, {
      assistant_id: assistant.id,
      instructions: prompt,
    })
    .catch((err) => {
      logger.error(
        `${new Date().toISOString()} - Error starting OpenAI Assistant run: ${err.message}`
      );
    });

  if (!run) {
    logger.debug(`${new Date().toISOString()} - Deleting OpenAI Assistant.`);

    openai.beta.assistants.del(assistant.id).catch((err) => {
      logger.error(`${new Date().toISOString()} - Error deleting OpenAI Assistant: ${err.message}`);
    });

    return;
  }

  // Poll for completion
  let runStatus;
  do {
    await new Promise((r) => setTimeout(r, 2000));
    runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id).catch((err) => {
      logger.error(
        `${new Date().toISOString()} - Error retrieving OpenAI Assistant run status: ${err.message}`
      );
      return undefined;
    });
  } while (runStatus && runStatus.status !== 'completed' && runStatus.status !== 'failed');

  if (!runStatus || runStatus.status === 'failed') {
    logger.error('OpenAI Assistant run failed');

    logger.debug(`${new Date().toISOString()} - Deleting OpenAI Assistant.`);

    openai.beta.assistants.del(assistant.id).catch((err) => {
      logger.error(`${new Date().toISOString()} - Error deleting OpenAI Assistant: ${err.message}`);
    });

    return;
  }

  // Get the response
  const messages = await openai.beta.threads.messages.list(thread.id).catch((err) => {
    logger.error(
      `${new Date().toISOString()} - Error retrieving OpenAI Assistant messages: ${err.message}`
    );
  });

  // Find the first text content in the latest message
  let result = '';
  if (messages?.data[0]?.content) {
    const textBlock = messages.data[0].content.find((block: any) => block.type === 'text');
    // For type 'text', the property is 'text.value'. For type 'image_file', it's different.
    if (textBlock && textBlock.type === 'text' && 'text' in textBlock) {
      result = (textBlock as any).text.value || '';
    }
  }

  logger.debug(`${new Date().toISOString()} - Deleting OpenAI Assistant.`);

  openai.beta.assistants.del(assistant.id).catch((err) => {
    logger.error(`${new Date().toISOString()} - Error deleting OpenAI Assistant: ${err.message}`);
  });

  return result;
};
