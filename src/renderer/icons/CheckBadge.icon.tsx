type Props = {
  className?: string;
};

export const CheckBadgeIcon = ({ className }: Props) => {
  return (
    <svg
      viewBox="0 0 8 8"
      fill="none"
      aria-hidden
      className={`w-2 h-2 ${className || ''}`}
    >
      <path
        d="M1 4l2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
