import { render, screen } from '@testing-library/react';
import { BurndownChart } from './BurndownChart';
import { format, subDays, addDays } from 'date-fns';

// Helper to create date strings
const today = new Date();
const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');

describe('BurndownChart', () => {
  const defaultProps = {
    sprintName: 'Sprint 1',
    startDate: formatDate(subDays(today, 7)),
    endDate: formatDate(addDays(today, 7)),
    totalPoints: 50,
    completedPointsByDay: {
      [formatDate(subDays(today, 7))]: 5,
      [formatDate(subDays(today, 6))]: 8,
      [formatDate(subDays(today, 5))]: 6,
      [formatDate(subDays(today, 4))]: 4,
      [formatDate(subDays(today, 3))]: 7,
      [formatDate(subDays(today, 2))]: 3,
      [formatDate(subDays(today, 1))]: 5,
    },
  };

  it('renders without crashing', () => {
    render(<BurndownChart {...defaultProps} />);
    expect(screen.getByText('Sprint 1 Burndown')).toBeInTheDocument();
  });

  it('displays the sprint name in the title', () => {
    render(<BurndownChart {...defaultProps} sprintName="Feature Sprint 2.2" />);
    expect(screen.getByText('Feature Sprint 2.2 Burndown')).toBeInTheDocument();
  });

  it('displays total points correctly', () => {
    render(<BurndownChart {...defaultProps} totalPoints={100} />);
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('shows completed points', () => {
    render(<BurndownChart {...defaultProps} />);
    // Sum of completedPointsByDay = 38
    expect(screen.getByText('38')).toBeInTheDocument();
  });

  it('shows remaining points', () => {
    render(<BurndownChart {...defaultProps} />);
    // 50 - 38 = 12
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('displays stats labels', () => {
    render(<BurndownChart {...defaultProps} />);
    expect(screen.getByText('Total Points')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Remaining')).toBeInTheDocument();
  });

  it('renders the chart components', () => {
    render(<BurndownChart {...defaultProps} />);
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('renders both ideal and actual lines', () => {
    render(<BurndownChart {...defaultProps} />);
    expect(screen.getByTestId('line-ideal')).toBeInTheDocument();
    expect(screen.getByTestId('line-actual')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <BurndownChart {...defaultProps} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  // Edge cases
  it('handles empty completedPointsByDay', () => {
    render(
      <BurndownChart
        {...defaultProps}
        completedPointsByDay={{}}
      />
    );
    expect(screen.getByText('0')).toBeInTheDocument(); // Completed should be 0
    expect(screen.getAllByText('50').length).toBeGreaterThanOrEqual(1); // Total and Remaining both show 50
  });

  it('handles zero total points', () => {
    render(
      <BurndownChart
        {...defaultProps}
        totalPoints={0}
        completedPointsByDay={{}}
      />
    );
    expect(screen.getByText('Sprint 1 Burndown')).toBeInTheDocument();
  });

  it('displays one of the status indicators', () => {
    // The status depends on current date vs sprint dates, so just check one exists
    render(<BurndownChart {...defaultProps} />);
    const statuses = ['✓ On track', '🎉 Ahead of schedule', '⚠️ Behind schedule'];
    const found = statuses.some(status => screen.queryByText(status) !== null);
    expect(found).toBe(true);
  });

  it('shows "ahead" status when well ahead of schedule', () => {
    // Complete all points immediately
    const aheadProps = {
      sprintName: 'Sprint 1',
      startDate: formatDate(subDays(today, 2)),
      endDate: formatDate(addDays(today, 10)),
      totalPoints: 50,
      completedPointsByDay: {
        [formatDate(subDays(today, 2))]: 25,
        [formatDate(subDays(today, 1))]: 20,
        [formatDate(today)]: 5,
      },
    };
    render(<BurndownChart {...aheadProps} />);
    expect(screen.getByText('🎉 Ahead of schedule')).toBeInTheDocument();
  });

  it('shows "behind" status when behind schedule', () => {
    // Complete almost nothing with sprint mostly done
    const behindProps = {
      sprintName: 'Sprint 1',
      startDate: formatDate(subDays(today, 10)),
      endDate: formatDate(addDays(today, 2)),
      totalPoints: 50,
      completedPointsByDay: {
        [formatDate(subDays(today, 10))]: 1,
      },
    };
    render(<BurndownChart {...behindProps} />);
    expect(screen.getByText('⚠️ Behind schedule')).toBeInTheDocument();
  });
});
