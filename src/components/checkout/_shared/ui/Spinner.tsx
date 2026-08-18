import { cn } from '@/components/checkout/_shared/utils/style.utils';

export const Spinner = (props: { className?: string }) => {
  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        stroke="currentColor"
        className={cn('size-5 text-white', props.className)}
        viewBox="0 0 24 24"
      >
        <g className="origin-center animate-spinner-rotate">
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            className="animate-spinner"
          ></circle>
        </g>
      </svg>
    </>
  );
};
