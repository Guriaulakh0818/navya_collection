import { describe, expect, it, vi } from 'vitest';
import React from 'react';

import { Input } from '../../src/frontend/components/ui/input';
import { fireEvent, render, screen } from '../helpers/test-utils';

describe('UI Input Component', () => {
  it('renders input with placeholder text', () => {
    render(<Input placeholder="Enter mobile number" />);
    expect(screen.getByPlaceholderText(/enter mobile number/i)).toBeInTheDocument();
  });

  it('handles onChange text input events', () => {
    const handleChange = vi.fn();
    render(<Input placeholder="Search" onChange={handleChange} />);

    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: 'Kurti' } });

    expect(handleChange).toHaveBeenCalled();
    expect((input as HTMLInputElement).value).toBe('Kurti');
  });

  it('renders in disabled state when specified', () => {
    render(<Input placeholder="Disabled" disabled />);
    expect(screen.getByPlaceholderText(/disabled/i)).toBeDisabled();
  });
});
