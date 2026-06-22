export default function GlobalDim({ visible }) {
  if (!visible) return null;
  return (
    <div className="global-dim">
      <div className="global-dim-spinner" />
    </div>
  );
}
