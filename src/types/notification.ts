import type { Location } from './location';

export type Notification = {
  id: string;
  location: Location;
  status: 'read' | 'unread';
  kind: 'located' | 'rejected';
  created_at: Date;
};
