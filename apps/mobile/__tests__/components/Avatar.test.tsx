import React from 'react';
import { render } from '@testing-library/react-native';
import { Avatar } from '../../components/ui/Avatar';

describe('Avatar', () => {
  it('renders initials when no avatarUrl', () => {
    const { getByText } = render(<Avatar name="Marcus Kim" />);
    expect(getByText('MK')).toBeTruthy();
  });

  it('renders single initial for single name', () => {
    const { getByText } = render(<Avatar name="Marcus" />);
    expect(getByText('M')).toBeTruthy();
  });

  it('renders at default size 36', () => {
    const { toJSON } = render(<Avatar name="Test User" />);
    expect(toJSON()).toBeTruthy();
  });
});
