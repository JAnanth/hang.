import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TimingToggle } from '../../components/create/TimingToggle';

describe('TimingToggle', () => {
  it('renders all three timing options', () => {
    const { getByTestId } = render(
      <TimingToggle selected="planned" onSelect={jest.fn()} />
    );
    expect(getByTestId('timing-planned')).toBeTruthy();
    expect(getByTestId('timing-voting')).toBeTruthy();
    expect(getByTestId('timing-quick')).toBeTruthy();
  });

  it('calls onSelect with the correct type', () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(
      <TimingToggle selected="planned" onSelect={onSelect} />
    );
    fireEvent.press(getByTestId('timing-voting'));
    expect(onSelect).toHaveBeenCalledWith('voting');
  });

  it('calls onSelect with quick type', () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(
      <TimingToggle selected="planned" onSelect={onSelect} />
    );
    fireEvent.press(getByTestId('timing-quick'));
    expect(onSelect).toHaveBeenCalledWith('quick');
  });
});
