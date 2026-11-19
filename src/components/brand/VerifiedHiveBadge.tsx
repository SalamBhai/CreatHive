/** A hexagonal hive cell with a clean check — marks a verified CreatHive profile. */
export function VerifiedHiveBadge({
  size = 14,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 2.25 20.4 7.1v9.8L12 21.75 3.6 16.9V7.1L12 2.25Z"
        fill="currentColor"
      />
      <path
        d="m8.4 12.1 2.5 2.5 4.7-5"
        stroke="#fff"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
