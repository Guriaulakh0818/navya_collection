import { describe, expect, it } from 'vitest';
import React from 'react';

import { Loader } from '../../src/frontend/components/ui/loader';
import { render, screen } from '../helpers/test-utils';

describe('UI Loader Component', () => {
  it('renders spinner element', () => {
    const { container } = render(<Loader />);
    expect(container.querySelector('.animate-spin')).toBeInDOM();
  });

  it('renders optional text label when provided', () => {
    render(<Loader text="Loading cart details..." />);
    expect(screen.getByText('Loading cart details...')).toBeInDOM();
  });
});
