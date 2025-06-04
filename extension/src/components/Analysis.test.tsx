import { render, screen, waitFor } from '@testing-library/react';
import Analysis from './Analysis';

afterEach(() => {
  jest.clearAllMocks();
});

describe('Analysis component unit tests', () => {
  const defaultProps = {
    loading: false,
    result: null,
    onAnalyze: jest.fn(),
    hasResult: false,
    onLogout: jest.fn(),
  };

  test('Renders Analyze button initially', () => {
    render(<Analysis {...defaultProps} />);
    const button = screen.getByRole('button', { name: /analyze/i });
    expect(button).toBeInTheDocument();
  });

  test('Displays loading state when analyzing', () => {
    render(<Analysis {...defaultProps} loading={true} />);
    expect(screen.getByTitle('ellipsis-loader')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /analyze/i })).toBeDisabled();
  });

  test('Displays result after successful analysis', async () => {
    render(<Analysis {...defaultProps} result={'<div>Analysis Result</div>'} hasResult={true} />);

    await waitFor(() => {
      expect(screen.getByText(/analysis result/i)).toBeInTheDocument();
    });
  });

  test('Does not display result if hasResult is false', () => {
    render(<Analysis {...defaultProps} result={'<div>Should not show</div>'} hasResult={false} />);
    expect(screen.queryByText(/should not show/i)).not.toBeInTheDocument();
  });
});
