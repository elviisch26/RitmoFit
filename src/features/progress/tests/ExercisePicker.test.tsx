import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';

import { ExercisePicker } from '../components/ExercisePicker';

const exercises = [
  { id: 1, name: 'Flexiones' },
  { id: 2, name: 'Press de banca' },
];

describe('ExercisePicker (EXERCICIO-2/5: chips with per-exercise a11y labels)', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders one chip per exercise with a per-exercise a11y label', async () => {
    await render(<ExercisePicker exercises={exercises} selectedId={2} onSelect={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Flexiones' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Press de banca' })).toBeOnTheScreen();
  });

  it('calls onSelect with the tapped exercise id', async () => {
    const onSelect = jest.fn();
    await render(<ExercisePicker exercises={exercises} selectedId={1} onSelect={onSelect} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Press de banca' }));

    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it('renders nothing when no exercise has sessions (empty global lives in the screen)', async () => {
    await render(<ExercisePicker exercises={[]} selectedId={null} onSelect={jest.fn()} />);

    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryByText('Press de banca')).toBeNull();
  });
});