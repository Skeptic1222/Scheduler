import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthButton } from '../auth-button';

// Mock the auth context
const mockUseAuth = vi.fn();

vi.mock('../../lib/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock Google API
global.google = {
  accounts: {
    id: {
      initialize: vi.fn(),
      renderButton: vi.fn(),
    },
  },
};

describe('AuthButton Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderWithProvider = (component: React.ReactNode) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('should show login button when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    renderWithProvider(<AuthButton />);

    expect(screen.getByTestId('button-login')).toBeInTheDocument();
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
  });

  it('should show user info and logout button when authenticated', () => {
    const mockUser = {
      id: '123',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'staff',
    };

    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    renderWithProvider(<AuthButton />);

    expect(screen.getByTestId('text-username')).toHaveTextContent('John Doe');
    expect(screen.getByTestId('button-logout')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: true,
      login: vi.fn(),
      logout: vi.fn(),
    });

    renderWithProvider(<AuthButton />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should call logout when logout button is clicked', async () => {
    const mockLogout = vi.fn();
    const mockUser = {
      id: '123',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'staff',
    };

    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      login: vi.fn(),
      logout: mockLogout,
    });

    renderWithProvider(<AuthButton />);

    fireEvent.click(screen.getByTestId('button-logout'));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  it('should handle different user roles correctly', () => {
    const mockUser = {
      id: '123',
      name: 'Dr. Smith',
      email: 'dr.smith@hospital.com',
      role: 'admin',
    };

    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    renderWithProvider(<AuthButton />);

    expect(screen.getByTestId('text-username')).toHaveTextContent('Dr. Smith');
    // Should show admin-specific UI elements if implemented
  });
});