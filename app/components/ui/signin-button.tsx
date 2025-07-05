export default function SignIn({ onSignInClick }: { onSignInClick: () => void }) {
  return (
    <button onClick={onSignInClick} className="px-4 py-2 text-sm border cursor-pointer border-border text-white rounded-xl hover:bg-primary-hover transition-colors">
      Sign In {<span>→</span>}
    </button>
  );
}