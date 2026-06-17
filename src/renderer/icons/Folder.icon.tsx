type Props = {
  className?: string;
};

export const FolderIcon = ({ className }: Props) => {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={`w-4 h-4 ${className || ''}`}
    >
      <path
        d="M1 3.5A1.5 1.5 0 012.5 2h3.172a1.5 1.5 0 011.06.44l.829.828A1.5 1.5 0 008.62 3.75H13.5A1.5 1.5 0 0115 5.25v7.25A1.5 1.5 0 0113.5 14h-11A1.5 1.5 0 011 12.5v-9z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
};
