import '@testing-library/jest-dom';
import React from 'react';

// Mock recharts - doesn't render well in jsdom
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    LineChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
      <div data-testid="line-chart" data-points={data?.length || 0}>{children}</div>
    ),
    BarChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
      <div data-testid="bar-chart" data-points={data?.length || 0}>{children}</div>
    ),
    Line: ({ dataKey }: { dataKey: string }) => (
      <div data-testid={`line-${dataKey}`} />
    ),
    Bar: ({ dataKey }: { dataKey: string }) => (
      <div data-testid={`bar-${dataKey}`} />
    ),
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />,
    ReferenceLine: () => <div data-testid="reference-line" />,
    Cell: () => <div data-testid="cell" />,
  };
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  CalendarDays: () => <span data-testid="calendar-icon" />,
  CheckCircle2: () => <span data-testid="check-icon" />,
  Circle: () => <span data-testid="circle-icon" />,
  Clock: () => <span data-testid="clock-icon" />,
  Layers: () => <span data-testid="layers-icon" />,
  ArrowDownAZ: () => <span data-testid="arrow-down-az-icon" />,
  ArrowUpDown: () => <span data-testid="arrow-up-down-icon" />,
  ChevronDown: () => <span data-testid="chevron-down-icon" />,
  Filter: () => <span data-testid="filter-icon" />,
  GripVertical: () => <span data-testid="grip-icon" />,
  Inbox: () => <span data-testid="inbox-icon" />,
  X: () => <span data-testid="x-icon" />,
}));

// Silence ResizeObserver errors in tests
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
