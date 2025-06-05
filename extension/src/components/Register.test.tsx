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
          callback({ saTrialKey: null });
        }),
        set: jest.fn(),
        remove: jest.fn(),
      },
      // @ts-ignore
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

  test('Registration form validation test', async () => {
    render(<Register onRegister={jest.fn()} />);

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
  });
});
