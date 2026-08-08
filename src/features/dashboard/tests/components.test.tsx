import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';

import { EmptyState, KpiCard, StreakBadge } from '../components';

describe('Dashboard components', () => {
  afterEach(() => {
    cleanup();
  });

  describe('KpiCard', () => {
    it('renders the value, the label and the accessibility label (DASHBOARD-5)', async () => {
      await render(
        <KpiCard label="Entrenos" value={3} accessibilityLabel="Entrenos: 3" />,
      );

      expect(screen.getByLabelText('Entrenos: 3')).toBeOnTheScreen();
      expect(screen.getByText('3')).toBeOnTheScreen();
      expect(screen.getByText('Entrenos')).toBeOnTheScreen();
    });

    it('renders distinct cards for series and time (DASHBOARD-5)', async () => {
      await render(
        <>
          <KpiCard label="Series" value={13} accessibilityLabel="Series: 13" />
          <KpiCard label="Tiempo" value={180} accessibilityLabel="Tiempo: 180 minutos" />
        </>,
      );

      expect(screen.getByLabelText('Series: 13')).toBeOnTheScreen();
      expect(screen.getByLabelText('Tiempo: 180 minutos')).toBeOnTheScreen();
      expect(screen.getByText('13')).toBeOnTheScreen();
      expect(screen.getByText('180')).toBeOnTheScreen();
    });
  });

  describe('StreakBadge', () => {
    it('exposes current and best streak labels with visible text (DASHBOARD-3/5)', async () => {
      await render(<StreakBadge current={3} best={5} />);

      expect(screen.getByLabelText('Racha actual: 3 días')).toBeOnTheScreen();
      expect(screen.getByLabelText('Mejor racha: 5 días')).toBeOnTheScreen();
      expect(screen.getByText('🔥 3 días')).toBeOnTheScreen();
      expect(screen.getByText('Mejor: 5')).toBeOnTheScreen();
    });

    it('renders a zero streak without crashing (DASHBOARD-3)', async () => {
      await render(<StreakBadge current={0} best={0} />);

      expect(screen.getByLabelText('Racha actual: 0 días')).toBeOnTheScreen();
      expect(screen.getByLabelText('Mejor racha: 0 días')).toBeOnTheScreen();
    });
  });

  describe('EmptyState', () => {
    it('renders the title without a CTA when none is provided', async () => {
      await render(<EmptyState title="Todavía no registraste entrenamientos" />);

      expect(screen.getByText('Todavía no registraste entrenamientos')).toBeOnTheScreen();
      expect(screen.queryByRole('button')).toBeNull();
    });

    it('renders a CTA that fires onCtaPress (DASHBOARD-4)', async () => {
      const onCtaPress = jest.fn();
      await render(
        <EmptyState
          title="Todavía no registraste entrenamientos"
          ctaLabel="Crear mi primera rutina"
          onCtaPress={onCtaPress}
        />,
      );

      await fireEvent.press(screen.getByRole('button', { name: 'Crear mi primera rutina' }));

      expect(onCtaPress).toHaveBeenCalledTimes(1);
    });
  });
});