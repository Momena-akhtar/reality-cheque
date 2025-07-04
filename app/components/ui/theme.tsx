export default function Theme() {
  return (
    <button className="px-4 py-2 text-sm border cursor-pointer border-border text-white rounded-xl hover:bg-primary-hover transition-colors">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" />
      </svg>
    </button>
  );
}