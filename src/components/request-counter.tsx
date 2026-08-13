import type { RequestCountData } from '@/types/request_count_data';

export const RequestCounter = ({ requestCountData }: { requestCountData: RequestCountData }) => {
  const { count, limit } = requestCountData;

  return (
    <div className="min-w-8 text-sm text-gray-500">
      {count} / {limit}
    </div>
  );
};
