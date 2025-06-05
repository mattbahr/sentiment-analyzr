import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from './App';

const mockedChrome = {
  storage: {
    local: {
      // @ts-ignore
      get: jest.fn((keys, callback) => {
        callback({ saTrialKey: 'test-trial-key' });
      }),
    },
  },
  tabs: {
    //@ts-ignore
    query: jest.fn(() => Promise.resolve([{ id: 1 }])),
  },
  scripting: {
    executeScript: jest.fn(() => Promise.resolve([{ result: '<html></html>' }])),
  },
};

afterEach(() => {
  jest.clearAllMocks();
});

describe('App component unit tests', () => {
  test('Test registration form', async () => {
    global.chrome = {
      storage: {
        local: {
          // @ts-ignore
          get: jest.fn((keys, callback) => {
            callback({ saTrialKey: null });
          }),
          set: jest.fn(),
          remove: jest.fn(),
        },
        sync: {
          // @ts-ignore
          get: jest.fn((keys, callback) => {
            callback({ saTrialKey: null });
          }),
          set: jest.fn(),
          remove: jest.fn(),
        },
      },
    };

    render(<App />);

    // Check if the form is rendered
    expect(screen.getByRole('form')).toBeInTheDocument();

    // Check if the trial key input is present
    const trialKeyInput = screen.getByPlaceholderText(/trial key/i);
    expect(trialKeyInput).toBeInTheDocument();

    // Check if the register button is present
    const registerButton = screen.getByRole('button', { name: /save trial key/i });
    expect(registerButton).toBeDisabled();

    // Simulate entering an trial key
    fireEvent.change(trialKeyInput, { target: { value: 'test-trial-key' } });
    expect(trialKeyInput).toHaveValue('test-trial-key');

    await waitFor(() => {
      expect(registerButton).toBeEnabled();
    });

    // @ts-ignore
    global.chrome.storage.local.get = jest.fn((keys, callback) => {
      callback({ saTrialKey: 'test-trial-key' });
    });

    // @ts-ignore
    global.chrome.storage.local.set = jest.fn((keys, callback) => {
      callback();
    });

    // @ts-ignore
    global.chrome.storage.sync.get = jest.fn((keys, callback) => {
      callback({ saTrialKey: 'test-trial-key' });
    });

    // @ts-ignore
    global.chrome.storage.sync.set = jest.fn((keys, callback) => {
      callback();
    });

    // Simulate form submission
    fireEvent.click(registerButton);

    await waitFor(() => {
      expect(global.chrome.storage.local.set).toHaveBeenCalledWith(
        { saTrialKey: 'test-trial-key' },
        expect.any(Function)
      );
      const analyzeButton = screen.getByRole('button', { name: /analyze/i });
      expect(analyzeButton).toBeInTheDocument();
    });
  });

  test('Test logout', async () => {
    global.chrome = {
      storage: {
        local: {
          // @ts-ignore
          get: jest.fn((keys, callback) => {
            callback({ saTrialKey: 'test-trial-key' });
          }),
          // @ts-ignore
          remove: jest.fn((keys, callback) => {
            callback();
          }),
        },
        sync: {
          // @ts-ignore
          remove: jest.fn((keys, callback) => {
            callback();
          }),
        },
      },
    };

    render(<App />);

    const logoutLink = screen.getByRole('link', { name: /logout/i });
    expect(logoutLink).toBeInTheDocument();

    fireEvent.click(logoutLink);

    await waitFor(() => {
      expect(global.chrome.storage.local.remove).toHaveBeenCalledWith(
        ['saTrialKey'],
        expect.any(Function)
      );
      expect(screen.queryByRole('button', { name: /analyze/i })).not.toBeInTheDocument();
      expect(screen.getByRole('form')).toBeInTheDocument();
    });
  });

  test('Test analyze status failed', async () => {
    // @ts-ignore
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Failed to analyze' }),
      })
    );

    // @ts-ignore
    global.chrome = mockedChrome;

    render(<App />);

    const analyzeButton = screen.getByRole('button', { name: /analyze/i });
    expect(analyzeButton).toBeInTheDocument();
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(
        screen.getByText(/We apologize, but we were unable to analyze the page content./i)
      ).toBeInTheDocument();
    });
  });

  test('Test trial expired', async () => {
    // @ts-ignore
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ error: 'Trial expired' }),
      })
    );

    // @ts-ignore
    global.chrome = mockedChrome;

    render(<App />);

    const analyzeButton = screen.getByRole('button', { name: /analyze/i });
    expect(analyzeButton).toBeInTheDocument();
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Your trial has expired. Thank you for using Sentiment Analyzr!/i)
      ).toBeInTheDocument();
    });
  });

  test('Test invalid trial key', async () => {
    // @ts-ignore
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized - No trial found' }),
      })
    );

    // @ts-ignore
    global.chrome = mockedChrome;

    render(<App />);

    const analyzeButton = screen.getByRole('button', { name: /analyze/i });
    expect(analyzeButton).toBeInTheDocument();
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          /You have provided an invalid trial key. Please log out and follow the instructions on the registration page to receive a new trial key./i
        )
      ).toBeInTheDocument();
    });
  });

  test('Test empty result', async () => {
    // @ts-ignore
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ result: '' }),
      })
    );

    // @ts-ignore
    global.chrome = mockedChrome;

    render(<App />);

    const analyzeButton = screen.getByRole('button', { name: /analyze/i });
    expect(analyzeButton).toBeInTheDocument();
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(
        screen.getByText(/We apologize, but we were unable to analyze the page content./i)
      ).toBeInTheDocument();
    });
  });

  test('Test non-HTML result', async () => {
    // @ts-ignore
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ result: 'This is not HTML' }),
      })
    );

    // @ts-ignore
    global.chrome = mockedChrome;

    render(<App />);

    const analyzeButton = screen.getByRole('button', { name: /analyze/i });
    expect(analyzeButton).toBeInTheDocument();
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(
        screen.getByText(/We apologize, but we were unable to analyze the page content./i)
      ).toBeInTheDocument();
    });
  });

  test('Test malformed HTML result', async () => {
    // @ts-ignore
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ result: '</div>This is malformed HTML<div>' }),
      })
    );

    // @ts-ignore
    global.chrome = mockedChrome;

    render(<App />);

    const analyzeButton = screen.getByRole('button', { name: /analyze/i });
    expect(analyzeButton).toBeInTheDocument();
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(
        screen.getByText(/We apologize, but we were unable to analyze the page content./i)
      ).toBeInTheDocument();
    });
  });

  test('Test successful analysis', async () => {
    // @ts-ignore
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ result: '<div>Analysis Result</div>' }),
      })
    );

    // @ts-ignore
    global.chrome = mockedChrome;

    render(<App />);

    const analyzeButton = screen.getByRole('button', { name: /analyze/i });
    expect(analyzeButton).toBeInTheDocument();
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText(/Analysis Result/i)).toBeInTheDocument();
    });
  });
});
