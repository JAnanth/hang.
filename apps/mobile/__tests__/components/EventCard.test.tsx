import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EventCard } from '../../components/feed/EventCard.js';
import type { FeedItem } from '@hang/shared';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const mockEvent: FeedItem = {
  id: 'evt-1',
  title: 'Pickup basketball at RSF',
  description: null,
  location: 'RSF Courts',
  type: 'planned',
  status: 'active',
  createdBy: 'user-1',
  friendsOnly: false,
  quickAddCap: 10,
  confirmedTime: new Date(Date.now() + 3600 * 1000).toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  groupIds: ['group-1'],
  creator: { id: 'user-1', name: 'Marcus Kim', username: null, avatarUrl: null, isVerified: false },
  groups: [{ id: 'group-1', name: 'Floor 3' }],
  rsvpCounts: { going: 4, maybe: 1, cant: 0 },
  currentUserRsvp: null,
  seenAt: null,
  isFeatured: false,
};

describe('EventCard', () => {
  it('renders event title', () => {
    const { getByText } = render(<EventCard event={mockEvent} />);
    expect(getByText('Pickup basketball at RSF')).toBeTruthy();
  });

  it('renders location', () => {
    const { getByText } = render(<EventCard event={mockEvent} />);
    expect(getByText('RSF Courts')).toBeTruthy();
  });

  it('renders group name in meta', () => {
    const { getByText } = render(<EventCard event={mockEvent} />);
    expect(getByText(/FLOOR 3/)).toBeTruthy();
  });

  it('navigates on press', () => {
    const push = jest.fn();
    jest.spyOn(require('expo-router'), 'useRouter').mockReturnValue({ push });
    const { getByTestId } = render(<EventCard event={mockEvent} />);
    fireEvent.press(getByTestId('event-card-evt-1'));
    expect(push).toHaveBeenCalledWith('/events/evt-1');
  });
});
