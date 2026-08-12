import Link from 'next/link';

type ToolItemProps = {
  icon: React.ReactNode;
  label: string;
  href: string;
  onClick?: () => void;
};

const ToolItem = ({ icon, label, href, onClick }: ToolItemProps) => {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        flex items-center gap-3 rounded-xl border border-stroke-weak bg-background p-4 hover:border-primary
        hover:bg-primary-50
      `}
    >
      <div className="flex size-[36px] items-center justify-center rounded-lg border border-primary-200">
        {icon}
      </div>
      <span className="text-lg font-semibold">{label}</span>
    </Link>
  );
};

export default ToolItem;
