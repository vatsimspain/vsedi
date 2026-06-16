type Props = {
  className?: string;
};

export const CheckMarkIcon = ({ className }: Props) => {
  return (
    <svg
      viewBox="0 0 10 10"
      fill="none"
      aria-hidden
      className={`w-2.5 h-2.5 ${className || ''}`}
    >
      <path
        d="M1.5 5l2.5 2.5 4.5-4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
