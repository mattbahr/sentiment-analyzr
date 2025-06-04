import { getAssistantResponse } from './openai_client.ts';

jest.mock('openai');
jest.mock('fs', () => ({
  createReadStream: jest.fn(),
}));
jest.mock('pino', () => () => ({
  debug: jest.fn(),
  error: jest.fn(),
}));

const mockCreate = jest.fn();
const mockThreadsCreate = jest.fn();
const mockAssistantsCreate = jest.fn();
const mockAssistantsDel = jest.fn();
const mockRunsCreate = jest.fn();
const mockRunsRetrieve = jest.fn();
const mockMessagesList = jest.fn();

const OpenAI = require('openai');
OpenAI.mockImplementation(() => ({
  files: { create: mockCreate },
  beta: {
    threads: {
      create: mockThreadsCreate,
      runs: {
        create: mockRunsCreate,
        retrieve: mockRunsRetrieve,
      },
      messages: {
        list: mockMessagesList,
      },
    },
    assistants: {
      create: mockAssistantsCreate,
      del: mockAssistantsDel,
    },
  },
}));

describe('OpenAI Client unit tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  mockAssistantsDel.mockResolvedValue({});

  test('Should return undefined on failed html upload', async () => {
    mockCreate.mockRejectedValue(new Error('upload failed'));
    const result = await getAssistantResponse('file.html', 'prompt', 'token');
    expect(result).toBeUndefined();
    expect(mockCreate).toHaveBeenCalled();
  });

  test('Should return undefined on failed thread creation', async () => {
    mockCreate.mockResolvedValue({ id: 'fileid' });
    mockThreadsCreate.mockRejectedValue(new Error('thread failed'));
    const result = await getAssistantResponse('file.html', 'prompt', 'token');
    expect(result).toBeUndefined();
    expect(mockThreadsCreate).toHaveBeenCalled();
  });

  test('Should return undefined on failed assistant create', async () => {
    mockCreate.mockResolvedValue({ id: 'fileid' });
    mockThreadsCreate.mockResolvedValue({ id: 'threadid' });
    mockAssistantsCreate.mockRejectedValue(new Error('assistant failed'));
    const result = await getAssistantResponse('file.html', 'prompt', 'token');
    expect(result).toBeUndefined();
    expect(mockAssistantsCreate).toHaveBeenCalled();
  });

  test('Should return undefined on failed run create', async () => {
    mockCreate.mockResolvedValue({ id: 'fileid' });
    mockThreadsCreate.mockResolvedValue({ id: 'threadid' });
    mockAssistantsCreate.mockResolvedValue({ id: 'assistid' });
    mockRunsCreate.mockRejectedValue(new Error('run failed'));
    const result = await getAssistantResponse('file.html', 'prompt', 'token');
    expect(result).toBeUndefined();
    expect(mockRunsCreate).toHaveBeenCalled();
  });

  test('Should return undefined if run status is failed', async () => {
    mockCreate.mockResolvedValue({ id: 'fileid' });
    mockThreadsCreate.mockResolvedValue({ id: 'threadid' });
    mockAssistantsCreate.mockResolvedValue({ id: 'assistid' });
    mockRunsCreate.mockResolvedValue({ id: 'runid' });
    mockRunsRetrieve.mockResolvedValueOnce({ status: 'failed' });
    const result = await getAssistantResponse('file.html', 'prompt', 'token');
    expect(result).toBeUndefined();
    expect(mockRunsRetrieve).toHaveBeenCalled();
  });

  test('Should return empty string if no text content in messages', async () => {
    mockCreate.mockResolvedValue({ id: 'fileid' });
    mockThreadsCreate.mockResolvedValue({ id: 'threadid' });
    mockAssistantsCreate.mockResolvedValue({ id: 'assistid' });
    mockRunsCreate.mockResolvedValue({ id: 'runid' });
    mockRunsRetrieve.mockResolvedValueOnce({ status: 'completed' });
    mockMessagesList.mockResolvedValue({ data: [{ content: [] }] });
    const result = await getAssistantResponse('file.html', 'prompt', 'token');
    expect(result).toBe('');
    expect(mockMessagesList).toHaveBeenCalled();
  });

  test('Should return text value from messages', async () => {
    mockCreate.mockResolvedValue({ id: 'fileid' });
    mockThreadsCreate.mockResolvedValue({ id: 'threadid' });
    mockAssistantsCreate.mockResolvedValue({ id: 'assistid' });
    mockRunsCreate.mockResolvedValue({ id: 'runid' });
    mockRunsRetrieve.mockResolvedValueOnce({ status: 'completed' });
    mockMessagesList.mockResolvedValue({
      data: [
        {
          content: [{ type: 'text', text: { value: 'Hello world!' } }],
        },
      ],
    });
    const result = await getAssistantResponse('file.html', 'prompt', 'token');
    expect(result).toBe('Hello world!');
  });
});
