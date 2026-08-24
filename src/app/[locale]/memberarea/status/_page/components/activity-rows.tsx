import { type ActivityRow, rowKey } from '../activity-row';
import { ActivityItem } from './activity-item';
import { ActivityMoreRows } from './activity-more-rows';

type ActivityRowsProps = {
  /** The page the server read and rendered. */
  rows: ActivityRow[];
  /** Where the feed carries on, when it does. */
  nextCursor?: string;
  /** The size the server asked for, so the browser asks for the same. */
  pageSize: number;
};

/**
 * The list: the server's page, then whatever the member asks the feed for after
 * it, in one column so a row fetched in the browser sits flush against the rows
 * that arrived with the document.
 */
export const ActivityRows = ({ rows, nextCursor, pageSize }: ActivityRowsProps) => {
  return (
    <div className="mt-4 flex flex-col gap-4">
      {rows.map((row) => (
        <ActivityItem key={rowKey(row)} row={row} />
      ))}

      {nextCursor && <ActivityMoreRows cursor={nextCursor} pageSize={pageSize} />}
    </div>
  );
};
