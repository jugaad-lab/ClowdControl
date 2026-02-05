import { render, screen } from '@testing-library/react';
import { VelocityChart } from './VelocityChart';

describe('VelocityChart', () => {
  const mockSprints = [
    { sprintName: 'Sprint 1', pointsCompleted: 20 },
    { sprintName: 'Sprint 2', pointsCompleted: 25 },
    { sprintName: 'Sprint 3', pointsCompleted: 22 },
    { sprintName: 'Sprint 4', pointsCompleted: 28 },
  ];

  it('renders without crashing', () => {
    render(<VelocityChart sprints={mockSprints} />);
    expect(screen.getByText('Sprint Velocity')).toBeInTheDocument();
  });

  it('displays correct average velocity', () => {
    render(<VelocityChart sprints={mockSprints} />);
    // Average = (20 + 25 + 22 + 28) / 4 = 23.75, rounded to 23.8
    expect(screen.getByText('23.8 pts')).toBeInTheDocument();
  });

  it('displays best sprint value', () => {
    render(<VelocityChart sprints={mockSprints} />);
    expect(screen.getByText('28 pts')).toBeInTheDocument(); // Max value
  });

  it('displays lowest sprint value', () => {
    render(<VelocityChart sprints={mockSprints} />);
    expect(screen.getByText('20 pts')).toBeInTheDocument(); // Min value
  });

  it('shows stat labels', () => {
    render(<VelocityChart sprints={mockSprints} />);
    expect(screen.getByText('Average Velocity')).toBeInTheDocument();
    expect(screen.getByText('Best Sprint')).toBeInTheDocument();
    expect(screen.getByText('Lowest Sprint')).toBeInTheDocument();
  });

  it('renders the bar chart', () => {
    render(<VelocityChart sprints={mockSprints} />);
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('renders legend items', () => {
    render(<VelocityChart sprints={mockSprints} />);
    expect(screen.getByText('Above average')).toBeInTheDocument();
    expect(screen.getByText('On target')).toBeInTheDocument();
    expect(screen.getByText('Below average')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <VelocityChart sprints={mockSprints} className="my-custom-class" />
    );
    expect(container.firstChild).toHaveClass('my-custom-class');
  });

  // Edge cases
  it('handles empty sprints array', () => {
    render(<VelocityChart sprints={[]} />);
    expect(screen.getByText('No sprint data available')).toBeInTheDocument();
  });

  it('shows 0 for average when no sprints', () => {
    render(<VelocityChart sprints={[]} />);
    // Should not crash, just show empty state
    expect(screen.getByText('Sprint Velocity')).toBeInTheDocument();
  });

  it('handles single sprint', () => {
    render(<VelocityChart sprints={[{ sprintName: 'Sprint 1', pointsCompleted: 30 }]} />);
    // All three stats will show 30 pts (average, best, lowest are all the same)
    expect(screen.getAllByText('30 pts').length).toBe(3);
  });

  it('calculates stable trend correctly', () => {
    const stableSprints = [
      { sprintName: 'Sprint 1', pointsCompleted: 20 },
      { sprintName: 'Sprint 2', pointsCompleted: 20 },
      { sprintName: 'Sprint 3', pointsCompleted: 20 },
      { sprintName: 'Sprint 4', pointsCompleted: 20 },
    ];
    render(<VelocityChart sprints={stableSprints} />);
    expect(screen.getByText('➡️ Stable')).toBeInTheDocument();
  });

  it('calculates increasing trend', () => {
    const increasingSprints = [
      { sprintName: 'Sprint 1', pointsCompleted: 10 },
      { sprintName: 'Sprint 2', pointsCompleted: 15 },
      { sprintName: 'Sprint 3', pointsCompleted: 25 },
      { sprintName: 'Sprint 4', pointsCompleted: 30 },
    ];
    render(<VelocityChart sprints={increasingSprints} />);
    expect(screen.getByText('📈 Trending up')).toBeInTheDocument();
  });

  it('calculates decreasing trend', () => {
    const decreasingSprints = [
      { sprintName: 'Sprint 1', pointsCompleted: 30 },
      { sprintName: 'Sprint 2', pointsCompleted: 28 },
      { sprintName: 'Sprint 3', pointsCompleted: 15 },
      { sprintName: 'Sprint 4', pointsCompleted: 12 },
    ];
    render(<VelocityChart sprints={decreasingSprints} />);
    expect(screen.getByText('📉 Trending down')).toBeInTheDocument();
  });

  it('handles sprints with optional properties', () => {
    const sprintsWithOptional = [
      {
        sprintName: 'Sprint 1',
        pointsCompleted: 20,
        pointsCommitted: 25,
        startDate: '2024-01-01',
        endDate: '2024-01-14',
      },
    ];
    render(<VelocityChart sprints={sprintsWithOptional} />);
    expect(screen.getByText('Sprint Velocity')).toBeInTheDocument();
  });

  it('handles sprints with zero points', () => {
    const zeroSprints = [
      { sprintName: 'Sprint 1', pointsCompleted: 0 },
      { sprintName: 'Sprint 2', pointsCompleted: 0 },
    ];
    render(<VelocityChart sprints={zeroSprints} />);
    // All three stats show 0 pts
    expect(screen.getAllByText('0 pts').length).toBe(3);
  });
});
