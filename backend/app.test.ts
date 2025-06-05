import request from 'supertest';
import App from './app.ts';
import * as openAIClient from './openai/openai_client.ts';
import Trial from './models/trial.ts';

jest.mock('./models/trial.ts');
jest.mock('./openai/openai_client.ts');

const mockedOpenAIClient = openAIClient as jest.Mocked<typeof openAIClient>;

afterEach(() => {
  jest.clearAllMocks();
});

describe('Analyze router unit tests', () => {
  test('Should return 500 on missing trialKey', async () => {
    const response = await request(App).post('/analyze').send({ html: '<p>test</p>' }); // No trial key
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Missing trial key');
  });

  test('Should return 500 on missing html', async () => {
    const response = await request(App).post('/analyze').send({ trialKey: 'fake-trial-key' }); // No HTML content
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Missing html');
  });

  jest.mock('fs', () => ({
    readFileSync: jest.fn(() => 'fake-api-key'),
  }));
  jest.mock('fs/promises', () => ({
    readFile: jest.fn(() => 'fake-prompt'),
    writeFile: jest.fn(() => Promise.resolve()),
  }));
  jest.mock('tmp', () => ({
    file: jest.fn((opts: any, cb: any) => cb(null, '/tmp/fakefile.html')),
  }));
  jest.mock('./openai/openai_client.ts', () => ({
    getAssistantResponse: jest.fn(),
  }));

  test('Should return 403 if trial has expired', async () => {
    (Trial.findOne as jest.Mock).mockResolvedValueOnce({
      trialCount: 0,
      email: 'test@example.com',
    });

    const response = await request(App).post('/analyze').send({
      html: '<p>test</p>',
      trialKey: 'fake-trial-key',
    });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Trial expired');
  });

  test('Should return 401 if no trial found', async () => {
    (Trial.findOne as jest.Mock).mockResolvedValueOnce(undefined);

    const response = await request(App).post('/analyze').send({
      html: '<p>test</p>',
      trialKey: 'fake-trial-key',
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthorized - No trial found');
  });

  test('Should return 500 if getAssistantResponse returns falsy', async () => {
    mockedOpenAIClient.getAssistantResponse.mockResolvedValueOnce(undefined);
    (Trial.findOne as jest.Mock).mockResolvedValueOnce({
      trialCount: 3,
      email: 'test@example.com',
      save: jest.fn(),
    });

    const response = await request(App).post('/analyze').send({
      html: '<p>test</p>',
      trialKey: 'fake-trial-key',
    });
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to retrieve analysis from OpenAI.');
  });

  test('Should return 200 and result if getAssistantResponse returns value', async () => {
    mockedOpenAIClient.getAssistantResponse.mockResolvedValueOnce('analysis result');
    (Trial.findOne as jest.Mock).mockResolvedValueOnce({
      trialCount: 3,
      email: 'test@example.com',
      save: jest.fn(),
    });

    const response = await request(App).post('/analyze').send({
      html: '<p>test</p>',
      trialKey: 'fake-trial-key',
    });
    expect(response.status).toBe(200);
    expect(response.body.result).toBe('analysis result');
  });

  test('Should decrement trial count on successful analysis', async () => {
    const mockTrial = { trialCount: 3, email: 'test@example.com', save: jest.fn() };
    (Trial.findOne as jest.Mock).mockResolvedValueOnce(mockTrial);

    mockedOpenAIClient.getAssistantResponse.mockResolvedValueOnce('analysis result');

    const response = await request(App).post('/analyze').send({
      html: '<p>test</p>',
      trialKey: 'fake-trial-key',
    });

    expect(response.status).toBe(200);
    expect(response.body.result).toBe('analysis result');
    expect(mockTrial.trialCount).toBe(2);
  });
});
