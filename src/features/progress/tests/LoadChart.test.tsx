import { cleanup, render, screen } from '@testing-library/react-native';
import { LineChart } from 'react-native-gifted-charts';

jest.mock('react-native-gifted-charts', () => ({
  LineChart: jest.fn((_props: unknown) => null),
}));

import { LoadChart } from '../components/LoadChart';

const mockLineChart = jest.mocked(LineChart);

describe('LoadChart (PROGRESS-4: LineChart props + chart a11y label)', () => {
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  it('sets curved, isAnimated, the kg suffix and a mapped dataset (PROGRESS-4)', async () => {
    const points = [
      { date: '12/01', weightKg: 60 },
      { date: '14/01', weightKg: 65 },
      { date: '16/01', weightKg: 70 },
    ];

    await render(<LoadChart exerciseName="Press de banca" points={points} />);

    expect(screen.getByLabelText('Evolución de cargas de Press de banca')).toBeOnTheScreen();
    expect(mockLineChart).toHaveBeenCalledTimes(1);

    const props = mockLineChart.mock.calls[0][0];
    expect(props.curved).toBe(true);
    expect(props.isAnimated).toBe(true);
    expect(props.yAxisLabelSuffix).toBe(' kg');
    expect(props.data).toEqual([
      { value: 60, label: '12/01' },
      { value: 65, label: '14/01' },
      { value: 70, label: '16/01' },
    ]);
  });

  it('relabels and rescales the chart for another exercise and dataset (triangulation)', async () => {
    const points = [{ date: '13/01', weightKg: 100 }];

    await render(<LoadChart exerciseName="Sentadilla" points={points} />);

    expect(screen.getByLabelText('Evolución de cargas de Sentadilla')).toBeOnTheScreen();

    const props = mockLineChart.mock.calls[0][0];
    expect(props.data).toEqual([{ value: 100, label: '13/01' }]);
  });
});