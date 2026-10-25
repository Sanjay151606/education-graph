import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Tasks } from '../pages/Tasks';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

vi.mock('../services/api', () => ({
  authApi: {
    getMe: vi.fn(() =>
      Promise.resolve({
        data: {
          id: 'user-1',
          email: 'test@example.com',
          full_name: 'Test User',
          focus_span_minutes: 25
        }
      })
    )
  },
  tasksApi: {
    getAll: vi.fn(() =>
      Promise.resolve({
        data: [
          {
            id: 'task-1',
            user_id: 'user-1',
            title: 'Complete Math Problem Set',
            description: 'Algebra chapter 5',
            estimated_minutes: 25,
            priority: 'high',
            status: 'pending',
            subtasks: [
              {
                id: 'sub-1',
                task_id: 'task-1',
                title: 'Review formulas',
                estimated_minutes: 5,
                is_completed: false
              }
            ]
          }
        ]
      })
    ),
    create: vi.fn((data) =>
      Promise.resolve({
        data: {
          id: 'task-2',
          user_id: 'user-1',
          title: data.title,
          description: data.description,
          estimated_minutes: data.estimated_minutes,
          priority: data.priority,
          status: 'pending',
          subtasks: []
        }
      })
    ),
    update: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    breakdown: vi.fn(() => Promise.resolve({ data: { subtasks: [] } })),
    addSubtask: vi.fn(() => Promise.resolve({ data: {} })),
    updateSubtask: vi.fn(() => Promise.resolve({ data: {} })),
    deleteSubtask: vi.fn(() => Promise.resolve({ data: {} }))
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

describe('Tasks Component', () => {
  it('renders task manager header and creation form', async () => {
    renderWithProviders(<Tasks />);
    expect(screen.getByText(/ADHD Micro-Task Manager/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. Write History Term Paper Draft/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText(/Complete Math Problem Set/i)).toBeInTheDocument();
    });
  });

  it('allows adding a new task', async () => {
    renderWithProviders(<Tasks />);
    const titleInput = screen.getByPlaceholderText(/e.g. Write History Term Paper Draft/i);
    const addBtn = screen.getByRole('button', { name: /Add Task/i });

    fireEvent.change(titleInput, { target: { value: 'Read Physics Lab Notes' } });
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(titleInput.value).toBe('');
    });
  });
});
