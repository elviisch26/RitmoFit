import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';

import { TimePickerModal } from '../components/TimePickerModal';

describe('TimePickerModal (NOTI-7)', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders two labelled columns and confirms the selected hour/minute', async () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();

    await render(
      <TimePickerModal
        visible
        initialHour={8}
        initialMinute={0}
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    // Column labels per requirement + hour options 0..23 / minutes 0..55 step 15.
    expect(screen.getByLabelText('Hora')).toBeOnTheScreen();
    expect(screen.getByLabelText('Minutos')).toBeOnTheScreen();
    expect(screen.getByLabelText('Hora 23')).toBeOnTheScreen();
    expect(screen.getByLabelText('Hora 0')).toBeOnTheScreen();
    expect(screen.getByLabelText('Minuto 45')).toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText('Hora 20'));
    await fireEvent.press(screen.getByLabelText('Minuto 30'));
    await fireEvent.press(screen.getByRole('button', { name: 'Confirmar' }));

    expect(onConfirm).toHaveBeenCalledWith(20, 30);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('emits only full-step minute values (triangulation: different slot)', async () => {
    const onConfirm = jest.fn();

    await render(
      <TimePickerModal
        visible
        initialHour={14}
        initialMinute={45}
        onConfirm={onConfirm}
        onClose={jest.fn()}
      />,
    );

    await fireEvent.press(screen.getByLabelText('Hora 7'));
    await fireEvent.press(screen.getByLabelText('Minuto 0'));
    await fireEvent.press(screen.getByRole('button', { name: 'Confirmar' }));

    expect(onConfirm).toHaveBeenCalledWith(7, 0);
  });

  it('closes without confirming (Cancel) and hides while not visible', async () => {
    const onClose = jest.fn();
    const onConfirm = jest.fn();

    await render(
      <TimePickerModal
        visible
        initialHour={9}
        initialMinute={15}
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onClose).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('does not render content while hidden', async () => {
    await render(
      <TimePickerModal
        visible={false}
        initialHour={8}
        initialMinute={0}
        onConfirm={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    expect(screen.queryByLabelText('Hora 8')).toBeNull();
  });
});