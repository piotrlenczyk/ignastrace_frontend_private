type ReverseLookupValueProps = {
  value: string | number | (string | number | undefined)[] | undefined | null;
  fallbackText?: string;
  className?: string;
};

const ReverseLookupValue = ({
  value,
  fallbackText,
}: ReverseLookupValueProps) => {
  if (!value || (Array.isArray(value) && value.length === 0)) {
    return <span className="text-weak">{fallbackText}</span>;
  }

  // Handle arrays
  if (Array.isArray(value)) {
    const validItems = value.filter(Boolean);

    if (validItems.length === 0) {
      return <span className="text-weak">{fallbackText}</span>;
    }
    return (
      <>
        {validItems.map(item => (
          <span key={item} className="comma-separated break-words">
            {item}
          </span>
        ))}
      </>
    );
  }

  // Handle single string value
  return <span>{value}</span>;
};

export default ReverseLookupValue;
