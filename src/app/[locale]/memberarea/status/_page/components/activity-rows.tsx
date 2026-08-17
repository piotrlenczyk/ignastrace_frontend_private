import type { ActivityRow } from '../activity-row';
import { ActivityItem } from './activity-item';

export const ActivityRows = ({ rows }: { rows: ActivityRow[] }) => {
  return (
    <div className="mt-4 flex flex-col gap-4">
      {rows.map((row) => (
        <ActivityItem key={`${row.kind}-${row.id}`} row={row} />
      ))}
    </div>
  );
};
