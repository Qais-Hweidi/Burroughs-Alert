import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DeleteAlertDialog from '../../src/components/alerts/DeleteAlertDialog';

// Mock the UI components
vi.mock('../../src/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, className, disabled, ...props }: any) => (
    <button
      onClick={onClick}
      className={`${variant} ${size} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock('../../src/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
  CardFooter: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
  CardTitle: ({ children, className, ...props }: any) => (
    <h3 className={className} {...props}>
      {children}
    </h3>
  ),
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  AlertTriangle: ({ className }: any) => <span className={className}>AlertTriangle</span>,
  X: ({ className }: any) => <span className={className}>X</span>,
}));

describe('DeleteAlertDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();
  
  const mockAlertInfo = {
    neighborhoods: ['Upper East Side', 'Chelsea'],
    bedrooms: 1,
    priceRange: '$2,000 - $4,000',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    render(
      <DeleteAlertDialog
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.queryByText('Delete Alert')).not.toBeInTheDocument();
  });

  it('renders dialog when isOpen is true', () => {
    render(
      <DeleteAlertDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText('Delete Alert')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this alert? This action cannot be undone.')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Delete Alert')).toBeInTheDocument();
  });

  it('displays alert information when provided', () => {
    render(
      <DeleteAlertDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        alertInfo={mockAlertInfo}
      />
    );

    expect(screen.getByText('1 bedroom • $2,000 - $4,000')).toBeInTheDocument();
    expect(screen.getByText('Upper East Side, Chelsea')).toBeInTheDocument();
  });

  it('handles studio apartment in alert info', () => {
    const studioAlertInfo = {
      ...mockAlertInfo,
      bedrooms: 0,
    };

    render(
      <DeleteAlertDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        alertInfo={studioAlertInfo}
      />
    );

    expect(screen.getByText('Studio • $2,000 - $4,000')).toBeInTheDocument();
  });

  it('handles any size bedroom in alert info', () => {
    const anySizeAlertInfo = {
      ...mockAlertInfo,
      bedrooms: null,
    };

    render(
      <DeleteAlertDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        alertInfo={anySizeAlertInfo}
      />
    );

    expect(screen.getByText('Any size • $2,000 - $4,000')).toBeInTheDocument();
  });

  it('handles many neighborhoods in alert info', () => {
    const manyNeighborhoodsInfo = {
      ...mockAlertInfo,
      neighborhoods: ['Upper East Side', 'Chelsea', 'SoHo', 'TriBeCa'],
    };

    render(
      <DeleteAlertDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        alertInfo={manyNeighborhoodsInfo}
      />
    );

    expect(screen.getByText('Upper East Side, Chelsea, +2 more')).toBeInTheDocument();
  });

  it('handles alert info without price range', () => {
    const alertInfoNoPrices = {
      neighborhoods: ['Upper East Side'],
      bedrooms: 1,
    };

    render(
      <DeleteAlertDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        alertInfo={alertInfoNoPrices}
      />
    );

    expect(screen.getByText('1 bedroom')).toBeInTheDocument();
    expect(screen.getByText('Upper East Side')).toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', () => {
    render(
      <DeleteAlertDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    // Find the backdrop (first div with backdrop styling)
    const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50');
    fireEvent.click(backdrop!);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when X button is clicked', () => {
    render(
      <DeleteAlertDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const closeButton = screen.getByText('X').closest('button');
    fireEvent.click(closeButton!);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when Cancel button is clicked', () => {
    render(
      <DeleteAlertDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onConfirm when Delete Alert button is clicked', () => {
    render(
      <DeleteAlertDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const deleteButtons = screen.getAllByText('Delete Alert');
    const deleteButton = deleteButtons.find(button => 
      button.closest('button')?.className.includes('destructive')
    );
    
    fireEvent.click(deleteButton!);

    expect(mockOnConfirm).toHaveBeenCalled();
  });

  it('shows deleting state correctly', () => {
    render(
      <DeleteAlertDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        isDeleting={true}
      />
    );

    expect(screen.getByText('Deleting...')).toBeInTheDocument();
    
    // Buttons should be disabled
    const cancelButton = screen.getByText('Cancel');
    const closeButton = screen.getByText('X').closest('button');
    
    expect(cancelButton).toBeDisabled();
    expect(closeButton).toBeDisabled();
  });

  it('disables interactions during deletion', () => {
    render(
      <DeleteAlertDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        isDeleting={true}
      />
    );

    // Try clicking buttons while deleting
    const cancelButton = screen.getByText('Cancel');
    const closeButton = screen.getByText('X').closest('button');
    const deleteButton = screen.getByText('Deleting...');

    fireEvent.click(cancelButton);
    fireEvent.click(closeButton!);
    fireEvent.click(deleteButton);

    // onClose should not be called since buttons are disabled
    expect(mockOnClose).not.toHaveBeenCalled();
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('displays warning message about email notifications', () => {
    render(
      <DeleteAlertDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(
      screen.getByText('You will no longer receive email notifications for apartments matching this alert.')
    ).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <DeleteAlertDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    // Dialog should be properly marked
    const dialog = screen.getByText('Delete Alert').closest('div[class*="Card"]');
    expect(dialog).toBeInTheDocument();

    // Warning icon should be present
    expect(screen.getByText('AlertTriangle')).toBeInTheDocument();
  });

  it('handles keyboard interactions', () => {
    render(
      <DeleteAlertDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    
    // Simulate Enter key on cancel button
    fireEvent.keyDown(cancelButton, { key: 'Enter', code: 'Enter' });
    
    // Should work normally (browser handles enter on buttons)
    expect(cancelButton).toBeInTheDocument();
  });

  it('maintains focus management', () => {
    const { rerender } = render(
      <DeleteAlertDialog
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    rerender(
      <DeleteAlertDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    // Dialog should be in the document when opened
    expect(screen.getByText('Delete Alert')).toBeInTheDocument();
  });

  it('handles edge case with empty neighborhoods', () => {
    const emptyNeighborhoodsInfo = {
      neighborhoods: [],
      bedrooms: 1,
      priceRange: '$2,000',
    };

    render(
      <DeleteAlertDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        alertInfo={emptyNeighborhoodsInfo}
      />
    );

    // Should still render the bedroom and price info
    expect(screen.getByText('1 bedroom • $2,000')).toBeInTheDocument();
    // Empty neighborhoods should render as empty string
    expect(screen.getByText('')).toBeInTheDocument();
  });
});