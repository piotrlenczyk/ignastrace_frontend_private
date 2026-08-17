/*
 * The legacy notifications screen's shape, and the part of the legacy location
 * shape it quotes.
 *
 * The shared legacy location declaration went with the activity list's move to the
 * new API, and this screen is still on the legacy backend — so it states the four
 * fields it actually reads itself, and the declaration dies with the screen rather
 * than outliving it as a module anything new could reach for.
 */
export type Notification = {
  id: string;
  location: {
    id: string;
    type: 'LinkLocation' | 'PhoneLocation';
    name?: string;
    phone?: string;
  };
  status: 'read' | 'unread';
  kind: 'located' | 'rejected';
  created_at: Date;
};
