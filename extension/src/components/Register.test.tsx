import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Register from './Register';

afterEach(() => {
  jest.clearAllMocks();
});

describe('Register component unit tests', () => {
  // @ts-ignore
  global.chrome = {
    storage: {
      // @ts-ignore
      local: {
        // @ts-ignore
        get: jest.fn((keys, callback) => {
          callback({ openaiApiKey: null });
        }),
        set: jest.fn(),
        remove: jest.fn(),
      },
      // @ts-ignore
      sync: {
        // @ts-ignore
        get: jest.fn((keys, callback) => {
          callback({ openaiApiKey: null });
        }),
        set: jest.fn(),
        remove: jest.fn(),
      },
    },
  };

  test('Registration form validation test', async () => {
    render(<Register onRegister={jest.fn()} />);

    // Check if the form is rendered
    expect(screen.getByRole('form')).toBeInTheDocument();

    // Check if the API key input is present
    const apiKeyInput = screen.getByPlaceholderText(/api key/i);
    expect(apiKeyInput).toBeInTheDocument();

    // Check if the register button is present
    const registerButton = screen.getByRole('button', { name: /save api key/i });
    expect(registerButton).toBeDisabled();

    // Simulate entering an API key
    fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } });
    expect(apiKeyInput).toHaveValue('test-api-key');

    await waitFor(() => {
      expect(registerButton).toBeEnabled();
    });
  });
});
