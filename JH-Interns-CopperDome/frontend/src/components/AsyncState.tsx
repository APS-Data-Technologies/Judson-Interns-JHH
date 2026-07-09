export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return <p className="state-message body-md">{label}</p>;
}

export function ErrorState({ label = 'Something went wrong. Please try again.' }: { label?: string }) {
  return <p className="state-message body-md">{label}</p>;
}

export function EmptyState({ label }: { label: string }) {
  return <p className="state-message body-md">{label}</p>;
}
