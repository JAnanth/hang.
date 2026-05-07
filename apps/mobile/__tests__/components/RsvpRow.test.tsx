import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RsvpRow } from '../../components/event/RsvpRow';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

describe('RsvpRow', () => {
  it('renders all three RSVP buttons', () => {
    const { getByTestId } = render(<RsvpRow current={null} onRsvp={jest.fn()} />);
    expect(getByTestId('rsvp-going')).toBeTruthy();
    expect(getByTestId('rsvp-maybe')).toBeTruthy();
    expect(getByTestId('rsvp-cant')).toBeTruthy();
  });

  it('calls onRsvp with correct status when tapped', () => {
    const onRsvp = jest.fn();
    const { getByTestId } = render(<RsvpRow current={null} onRsvp={onRsvp} />);
    fireEvent.press(getByTestId('rsvp-going'));
    expect(onRsvp).toHaveBeenCalledWith('going');
  });

  it('calls onRsvp with "maybe" when maybe tapped', () => {
    const onRsvp = jest.fn();
    const { getByTestId } = render(<RsvpRow current={null} onRsvp={onRsvp} />);
    fireEvent.press(getByTestId('rsvp-maybe'));
    expect(onRsvp).toHaveBeenCalledWith('maybe');
  });

  it('calls onRsvp with "cant" when cant tapped', () => {
    const onRsvp = jest.fn();
    const { getByTestId } = render(<RsvpRow current={null} onRsvp={onRsvp} />);
    fireEvent.press(getByTestId('rsvp-cant'));
    expect(onRsvp).toHaveBeenCalledWith('cant');
  });

  it('does not call onRsvp when disabled', () => {
    const onRsvp = jest.fn();
    const { getByTestId } = render(<RsvpRow current={null} onRsvp={onRsvp} isLoading />);
    fireEvent.press(getByTestId('rsvp-going'));
    expect(onRsvp).not.toHaveBeenCalled();
  });
});
