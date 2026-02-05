import { render, screen, fireEvent } from '@testing-library/react';
import { SprintGoals, SprintGoal, GoalStatus } from './SprintGoals';

describe('SprintGoals', () => {
  const mockGoals: SprintGoal[] = [
    { id: '1', title: 'Complete authentication', status: 'completed' },
    { id: '2', title: 'Setup CI/CD pipeline', status: 'in-progress', description: 'GitHub Actions' },
    { id: '3', title: 'Write documentation', status: 'not-started' },
  ];

  const mockHandlers = {
    onGoalAdd: jest.fn(),
    onGoalUpdate: jest.fn(),
    onGoalDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<SprintGoals goals={mockGoals} />);
    expect(screen.getByText('Sprint Goals')).toBeInTheDocument();
  });

  it('displays all goal titles', () => {
    render(<SprintGoals goals={mockGoals} />);
    expect(screen.getByText('Complete authentication')).toBeInTheDocument();
    expect(screen.getByText('Setup CI/CD pipeline')).toBeInTheDocument();
    expect(screen.getByText('Write documentation')).toBeInTheDocument();
  });

  it('displays goal descriptions', () => {
    render(<SprintGoals goals={mockGoals} />);
    expect(screen.getByText('GitHub Actions')).toBeInTheDocument();
  });

  it('displays correct completion count', () => {
    render(<SprintGoals goals={mockGoals} />);
    expect(screen.getByText('1/3 Complete')).toBeInTheDocument();
  });

  it('displays progress percentage', () => {
    render(<SprintGoals goals={mockGoals} />);
    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  it('displays status labels correctly', () => {
    render(<SprintGoals goals={mockGoals} />);
    // Each status appears twice: once as badge, once in summary stats
    expect(screen.getAllByText('Completed').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('In Progress').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Not Started').length).toBeGreaterThanOrEqual(1);
  });

  it('shows summary stats', () => {
    render(<SprintGoals goals={mockGoals} />);
    // Find stat labels
    expect(screen.getAllByText('Not Started').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('In Progress').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Completed').length).toBeGreaterThanOrEqual(1);
  });

  it('applies custom className', () => {
    const { container } = render(
      <SprintGoals goals={mockGoals} className="custom-goals-class" />
    );
    expect(container.firstChild).toHaveClass('custom-goals-class');
  });

  // Empty state
  it('shows empty state when no goals', () => {
    render(<SprintGoals goals={[]} />);
    expect(screen.getByText('No sprint goals defined yet.')).toBeInTheDocument();
  });

  it('shows add first goal button when empty and editable', () => {
    render(<SprintGoals goals={[]} editable={true} onGoalAdd={mockHandlers.onGoalAdd} />);
    expect(screen.getByText('+ Add your first goal')).toBeInTheDocument();
  });

  // Add goal functionality
  it('shows add goal button when goals exist', () => {
    render(
      <SprintGoals goals={mockGoals} editable={true} onGoalAdd={mockHandlers.onGoalAdd} />
    );
    expect(screen.getByText('+ Add Goal')).toBeInTheDocument();
  });

  it('opens add goal form when clicking add button', () => {
    render(
      <SprintGoals goals={mockGoals} editable={true} onGoalAdd={mockHandlers.onGoalAdd} />
    );
    fireEvent.click(screen.getByText('+ Add Goal'));
    expect(screen.getByPlaceholderText('Goal title')).toBeInTheDocument();
  });

  it('calls onGoalAdd with new goal data', () => {
    render(
      <SprintGoals goals={mockGoals} editable={true} onGoalAdd={mockHandlers.onGoalAdd} />
    );
    
    fireEvent.click(screen.getByText('+ Add Goal'));
    fireEvent.change(screen.getByPlaceholderText('Goal title'), {
      target: { value: 'New goal' },
    });
    fireEvent.change(screen.getByPlaceholderText('Description (optional)'), {
      target: { value: 'Goal description' },
    });
    fireEvent.click(screen.getByText('Add Goal'));

    expect(mockHandlers.onGoalAdd).toHaveBeenCalledWith({
      title: 'New goal',
      description: 'Goal description',
      status: 'not-started',
    });
  });

  it('cancels adding goal', () => {
    render(
      <SprintGoals goals={mockGoals} editable={true} onGoalAdd={mockHandlers.onGoalAdd} />
    );
    
    fireEvent.click(screen.getByText('+ Add Goal'));
    expect(screen.getByPlaceholderText('Goal title')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByPlaceholderText('Goal title')).not.toBeInTheDocument();
  });

  it('disables add button when title is empty', () => {
    render(
      <SprintGoals goals={mockGoals} editable={true} onGoalAdd={mockHandlers.onGoalAdd} />
    );
    
    fireEvent.click(screen.getByText('+ Add Goal'));
    const addButton = screen.getByRole('button', { name: 'Add Goal' });
    expect(addButton).toBeDisabled();
  });

  // Edit goal functionality
  it('enters edit mode when clicking edit button', () => {
    render(
      <SprintGoals 
        goals={mockGoals} 
        editable={true} 
        onGoalUpdate={mockHandlers.onGoalUpdate} 
      />
    );
    
    const editButtons = screen.getAllByTitle('Edit goal');
    fireEvent.click(editButtons[0]);
    
    expect(screen.getByDisplayValue('Complete authentication')).toBeInTheDocument();
  });

  it('saves edited goal', () => {
    render(
      <SprintGoals 
        goals={mockGoals} 
        editable={true} 
        onGoalUpdate={mockHandlers.onGoalUpdate} 
      />
    );
    
    const editButtons = screen.getAllByTitle('Edit goal');
    fireEvent.click(editButtons[0]);
    
    const input = screen.getByDisplayValue('Complete authentication');
    fireEvent.change(input, { target: { value: 'Updated goal title' } });
    fireEvent.click(screen.getByText('Save'));

    expect(mockHandlers.onGoalUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '1',
        title: 'Updated goal title',
      })
    );
  });

  // Delete goal functionality
  it('calls onGoalDelete when delete button is clicked', () => {
    render(
      <SprintGoals 
        goals={mockGoals} 
        editable={true} 
        onGoalDelete={mockHandlers.onGoalDelete} 
      />
    );
    
    const deleteButtons = screen.getAllByTitle('Delete goal');
    fireEvent.click(deleteButtons[0]);

    expect(mockHandlers.onGoalDelete).toHaveBeenCalledWith('1');
  });

  // Status cycling
  it('cycles status when clicking status badge', () => {
    render(
      <SprintGoals 
        goals={mockGoals} 
        editable={true} 
        onGoalUpdate={mockHandlers.onGoalUpdate} 
      />
    );
    
    // Click on "Not Started" status badge (the one that's clickable, i.e. has title attr)
    const notStartedBadges = screen.getAllByText('Not Started');
    // Find the button element (not the stat label)
    const badge = notStartedBadges.find(el => el.closest('button[title]'));
    fireEvent.click(badge!);

    expect(mockHandlers.onGoalUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '3',
        status: 'in-progress',
      })
    );
  });

  // Read-only mode
  it('hides edit/delete buttons when not editable', () => {
    render(<SprintGoals goals={mockGoals} editable={false} />);
    expect(screen.queryByTitle('Edit goal')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Delete goal')).not.toBeInTheDocument();
  });

  it('hides add goal button when not editable', () => {
    render(<SprintGoals goals={mockGoals} editable={false} />);
    expect(screen.queryByText('+ Add Goal')).not.toBeInTheDocument();
  });

  // Edge cases
  it('handles goals with no description', () => {
    const goalsNoDesc: SprintGoal[] = [
      { id: '1', title: 'Goal without description', status: 'not-started' },
    ];
    render(<SprintGoals goals={goalsNoDesc} />);
    expect(screen.getByText('Goal without description')).toBeInTheDocument();
  });

  it('calculates 0% progress when no goals completed', () => {
    const uncompletedGoals: SprintGoal[] = [
      { id: '1', title: 'Goal 1', status: 'not-started' },
      { id: '2', title: 'Goal 2', status: 'in-progress' },
    ];
    render(<SprintGoals goals={uncompletedGoals} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('calculates 100% progress when all goals completed', () => {
    const completedGoals: SprintGoal[] = [
      { id: '1', title: 'Goal 1', status: 'completed' },
      { id: '2', title: 'Goal 2', status: 'completed' },
    ];
    render(<SprintGoals goals={completedGoals} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('applies strikethrough to completed goal titles', () => {
    render(<SprintGoals goals={mockGoals} />);
    const completedGoal = screen.getByText('Complete authentication');
    expect(completedGoal).toHaveClass('line-through');
  });
});
