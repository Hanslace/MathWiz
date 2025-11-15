export default function EpsilonPage() {
  return (
    <main className="w-screen h-screen">
      <iframe
        src="/index.html"
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin"
      />
    </main>
  );
}