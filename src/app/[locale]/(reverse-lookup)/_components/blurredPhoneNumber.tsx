type BlurredPhoneNumberProps = {
  phoneNumber: string;
};

export const BlurredPhoneNumber = ({ phoneNumber }: BlurredPhoneNumberProps) => {
  const match = phoneNumber.match(/^(\+\d+)\s+(\d+\s+\d+)\s+(\d+)$/);

  if (!match) {
    return <span>{phoneNumber}</span>;
  }

  const [, countryCode, middlePart, lastPart] = match;

  return (
    <span>
      {countryCode}
      {' '}
      <span className="blur-sm">{middlePart}</span>
      {' '}
      {lastPart}
    </span>
  );
};
