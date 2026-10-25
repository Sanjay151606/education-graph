import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Login } from '../pages/Login';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

// Mock api
vi.mock('../services/api', () => ({
  authApi: {
    login: vi.fn(() =>
      Promise.resolve({
        data: {
          access_token: 'fake-jwt-token',
          user: {
            id: 'user-1',
            email: 'test@example.com',
            full_name: 'Test User',
            focus_span_minutes: 25,
            preferred_content_style: 'bullet_points',
            difficulty_level: 'adaptive',
            reminders_enabled: true
          }
        }
      })
    ),
    getMe: vi.fn(() => Promise.reject(new Error('Not logged in'))),
  },
  default: {
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  }
}));

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          {component}
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  it('renders login heading and form elements', () => {
    renderWithProviders(<Login />);
    expect(screen.getByText(/Sign In to BrainGraph/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enter Workspace/i })).toBeInTheDocument();
  });

  it('allows user to enter credentials and submit', async () => {
    renderWithProviders(<Login />);
    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const submitBtn = screen.getByRole('button', { name: /Enter Workspace/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(emailInput.value).toBe('test@example.com');
    });
  });
});
