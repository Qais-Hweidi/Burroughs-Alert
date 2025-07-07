import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AlertCard, { AlertData } from '../../src/components/alerts/AlertCard';

// Mock the UI components
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
  CardDescription: ({ children, className, ...props }: any) => (
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

vi.mock('../../src/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, className, ...props }: any) => (
    <button
      onClick={onClick}
      className={`${variant} ${size} ${className}`}
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock('../../src/components/ui/badge', () => ({
  Badge: ({ children, variant, className, ...props }: any) => (
    <span className={`${variant} ${className}`} {...props}>
      {children}
    </span>
  ),
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Edit2: ({ className }: any) => <span className={className}>Edit2</span>,
  Trash2: ({ className }: any) => <span className={className}>Trash2</span>,
  MapPin: ({ className }: any) => <span className={className}>MapPin</span>,
  DollarSign: ({ className }: any) => (
    <span className={className}>DollarSign</span>
  ),
  Home: ({ className }: any) => <span className={className}>Home</span>,
  Heart: ({ className }: any) => <span className={className}>Heart</span>,
  Clock: ({ className }: any) => <span className={className}>Clock</span>,
  Calendar: ({ className }: any) => <span className={className}>Calendar</span>,
}));

describe('AlertCard', () => {
  const mockAlert: AlertData = {
    id: 1,
    neighborhoods: ['Upper East Side', 'Chelsea', 'SoHo'],
    min_price: 2000,
    max_price: 4000,
    bedrooms: 1,
    pet_friendly: true,
    max_commute_minutes: 30,
    commute_destination: 'Times Square',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_active: true,
  };

  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders alert information correctly', () => {
    render(
      <AlertCard
        alert={mockAlert}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Check if bedrooms and price range are displayed
    expect(screen.getByText('1 bedroom • $2,000 - $4,000')).toBeInTheDocument();

    // Check if neighborhoods are displayed
    expect(
      screen.getByText('Upper East Side, Chelsea, SoHo')
    ).toBeInTheDocument();

    // Check if pet-friendly is displayed
    expect(screen.getByText('Pet-friendly')).toBeInTheDocument();

    // Check if commute info is displayed
    expect(screen.getByText('30 min to Times Square')).toBeInTheDocument();

    // Check if created date is displayed
    expect(screen.getByText('Created Jan 1, 2024')).toBeInTheDocument();

    // Check if active status is displayed
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders studio apartment correctly', () => {
    const studioAlert = { ...mockAlert, bedrooms: 0 };

    render(
      <AlertCard
        alert={studioAlert}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Studio • $2,000 - $4,000')).toBeInTheDocument();
  });

  it('renders any size bedroom correctly', () => {
    const anySizeAlert = { ...mockAlert, bedrooms: null };

    render(
      <AlertCard
        alert={anySizeAlert}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Any size • $2,000 - $4,000')).toBeInTheDocument();
  });

  it('renders price range variations correctly', () => {
    // Min price only
    const minOnlyAlert = { ...mockAlert, min_price: 2000, max_price: null };
    const { rerender } = render(
      <AlertCard
        alert={minOnlyAlert}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );
    expect(screen.getByText('1 bedroom • $2,000+')).toBeInTheDocument();

    // Max price only
    const maxOnlyAlert = { ...mockAlert, min_price: null, max_price: 4000 };
    rerender(
      <AlertCard
        alert={maxOnlyAlert}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );
    expect(screen.getByText('1 bedroom • Up to $4,000')).toBeInTheDocument();

    // No price limit
    const noPriceAlert = { ...mockAlert, min_price: null, max_price: null };
    rerender(
      <AlertCard
        alert={noPriceAlert}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );
    expect(screen.getByText('1 bedroom • Any price')).toBeInTheDocument();
  });

  it('handles many neighborhoods correctly', () => {
    const manyNeighborhoodsAlert = {
      ...mockAlert,
      neighborhoods: [
        'Upper East Side',
        'Chelsea',
        'SoHo',
        'TriBeCa',
        'Greenwich Village',
      ],
    };

    render(
      <AlertCard
        alert={manyNeighborhoodsAlert}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(
      screen.getByText('Upper East Side, Chelsea, SoHo, +2 more')
    ).toBeInTheDocument();
  });

  it('displays neighborhood badges correctly', () => {
    render(
      <AlertCard
        alert={mockAlert}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Upper East Side')).toBeInTheDocument();
    expect(screen.getByText('Chelsea')).toBeInTheDocument();
    expect(screen.getByText('SoHo')).toBeInTheDocument();
  });

  it('handles many neighborhood badges correctly', () => {
    const manyNeighborhoodsAlert = {
      ...mockAlert,
      neighborhoods: Array.from(
        { length: 10 },
        (_, i) => `Neighborhood ${i + 1}`
      ),
    };

    render(
      <AlertCard
        alert={manyNeighborhoodsAlert}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Should show first 6 neighborhoods plus "+4 more"
    expect(screen.getByText('Neighborhood 1')).toBeInTheDocument();
    expect(screen.getByText('Neighborhood 6')).toBeInTheDocument();
    expect(screen.getByText('+4 more')).toBeInTheDocument();
  });

  it('handles null pet_friendly correctly', () => {
    const noPetPreferenceAlert = { ...mockAlert, pet_friendly: null };

    render(
      <AlertCard
        alert={noPetPreferenceAlert}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Pet-friendly info should not be displayed
    expect(screen.queryByText('Pet-friendly')).not.toBeInTheDocument();
    expect(screen.queryByText('No pets')).not.toBeInTheDocument();
  });

  it('handles no pets preference correctly', () => {
    const noPetsAlert = { ...mockAlert, pet_friendly: false };

    render(
      <AlertCard
        alert={noPetsAlert}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('No pets')).toBeInTheDocument();
  });

  it('handles no commute information correctly', () => {
    const noCommuteAlert = {
      ...mockAlert,
      commute_destination: null,
      max_commute_minutes: null,
    };

    render(
      <AlertCard
        alert={noCommuteAlert}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Commute info should not be displayed
    expect(screen.queryByText(/min to/)).not.toBeInTheDocument();
  });

  it('renders inactive alert correctly', () => {
    const inactiveAlert = { ...mockAlert, is_active: false };

    render(
      <AlertCard
        alert={inactiveAlert}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    render(
      <AlertCard
        alert={mockAlert}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const editButton = screen.getByText('Edit').closest('button');
    fireEvent.click(editButton!);

    expect(mockOnEdit).toHaveBeenCalledWith(mockAlert.id);
  });

  it('calls onDelete when delete button is clicked', () => {
    render(
      <AlertCard
        alert={mockAlert}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByText('Delete').closest('button');
    fireEvent.click(deleteButton!);

    expect(mockOnDelete).toHaveBeenCalledWith(mockAlert.id);
  });

  it('hides action buttons when showActions is false', () => {
    render(
      <AlertCard
        alert={mockAlert}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        showActions={false}
      />
    );

    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const customClass = 'custom-alert-card';

    render(
      <AlertCard
        alert={mockAlert}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        className={customClass}
      />
    );

    const cardElement = screen
      .getByText('1 bedroom • $2,000 - $4,000')
      .closest('div');
    expect(cardElement).toHaveClass(customClass);
  });

  it('handles missing callbacks gracefully', () => {
    render(<AlertCard alert={mockAlert} />);

    // Should render without errors even without callbacks
    expect(screen.getByText('1 bedroom • $2,000 - $4,000')).toBeInTheDocument();

    // Buttons should still be present but clicking them shouldn't throw errors
    const editButton = screen.getByText('Edit').closest('button');
    const deleteButton = screen.getByText('Delete').closest('button');

    expect(() => fireEvent.click(editButton!)).not.toThrow();
    expect(() => fireEvent.click(deleteButton!)).not.toThrow();
  });
});
