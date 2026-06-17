type Props = {
  className?: string;
};

export const SuccessCheckIcon = ({ className }: Props) => {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden
      className={`w-10 h-10 ${className || ''}`}
    >
      <path
        d="M8 20l8 8 16-16"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
