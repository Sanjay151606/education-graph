import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AssessmentIntro } from '../pages/assessment/AssessmentIntro';
import { SectionC } from '../pages/assessment/SectionC';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

vi.mock('../services/api', () => ({
  authApi: {
    getMe: vi.fn(() =>
      Promise.resolve({
        data: {
          id: 'user-1',
          email: 'student@example.com',
          full_name: 'Alex River',
          focus_span_minutes: 25,
          preferred_content_style: 'bullet_points',
          difficulty_level: 'adaptive'
        }
      })
    ),
    updateProfile: vi.fn(() => Promise.resolve({ data: {} }))
  },
  assessmentApi: {
    start: vi.fn(() =>
      Promise.resolve({
        data: {
          session_id: 'session-123',
          current_section: 'A',
          items: []
        }
      })
    ),
    getSection: vi.fn((sessionId, section) =>
      Promise.resolve({
        data: [
          {
            id: 'sec-c-g-1',
            section: 'C',
            item_type: 'grammar_mcq',
            sequence_index: 1,
            prompt_text: 'She _____ to the market yesterday morning.',
            options: ['go', 'went', 'gone', 'going'],
            difficulty: 'easy'
          }
        ]
      })
    ),
    respond: vi.fn(() =>
      Promise.resolve({
        data: {
          id: 'resp-1',
          session_id: 'session-123',
          item_id: 'sec-c-g-1',
          mcq_choice: 'went',
          is_correct: true
        }
      })
    ),
    recordTabSwitch: vi.fn(() => Promise.resolve({ data: { status: 'logged' } })),
    complete: vi.fn(() => Promise.resolve({ data: { auto_graded_score: 90.0 } })),
    getResults: vi.fn(() => Promise.resolve({ data: { auto_graded_score: 90.0 } })),
    getHistory: vi.fn(() => Promise.resolve({ data: [] }))
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

describe('4-Section Assessment Suite', () => {
  it('renders AssessmentIntro with 4-section preview and mic check', () => {
    renderWithProviders(<AssessmentIntro />);
    expect(screen.getByText(/English Language & Cognitive Flow Assessment/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Section A/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Section B/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Section C/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Section D/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Begin Section A/i })).toBeInTheDocument();
  });

  it('renders SectionC grammar questions and choices', async () => {
    sessionStorage.setItem('bg_assessment_session_id', 'session-123');
    renderWithProviders(<SectionC />);

    await waitFor(() => {
      expect(screen.getByText(/She _____ to the market yesterday morning\./i)).toBeInTheDocument();
      expect(screen.getByText(/went/i)).toBeInTheDocument();
    });
  });
});
