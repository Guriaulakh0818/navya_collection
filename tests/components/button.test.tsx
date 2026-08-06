import { describe, expect, it, vi } from 'vitest';
import React from 'react';

import { Button } from '../../src/frontend/components/ui/button';
import { fireEvent, render, screen } from '../helpers/test-utils';

describe('UI Button Component', () => {
  it('renders button with children text', () => {
    render(<Button>Add to Cart</Button>);
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeInDOM();
  });

  it('triggers onClick event handler when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);

    fireEvent.click(screen.getByRole('button', { name: /click me/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not trigger onClick when disabled', () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled Button
      </Button>,
    );

    const btn = screen.getByRole('button', { name: /disabled button/i });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });
});
