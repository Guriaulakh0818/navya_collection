import { describe, expect, it, vi } from 'vitest';
import React from 'react';

import { Modal } from '../../src/frontend/components/ui/modal';
import { fireEvent, render, screen } from '../helpers/test-utils';

describe('UI Modal Component', () => {
  it('does not render when open prop is false', () => {
    render(
      <Modal open={false} onClose={() => {}}>
        <div>Modal Content</div>
      </Modal>,
    );
    expect(screen.queryByText('Modal Content')).not.toBeInDOM();
  });

  it('renders title and content when open is true', () => {
    render(
      <Modal open={true} onClose={() => {}} title="Select Address">
        <div>Modal Content Body</div>
      </Modal>,
    );

    expect(screen.getByRole('dialog')).toBeInDOM();
    expect(screen.getByText('Select Address')).toBeInDOM();
    expect(screen.getByText('Modal Content Body')).toBeInDOM();
  });

  it('triggers onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <Modal open={true} onClose={handleClose} title="Test Modal">
        <div>Content</div>
      </Modal>,
    );

    const closeBtn = screen.getByRole('button');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
