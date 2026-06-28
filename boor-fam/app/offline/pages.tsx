export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-indigo-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-indigo-700">
          You're Offline
        </h1>

        <p className="mt-4 text-slate-600">
          Please reconnect to continue using BoorFam.
        </p>

        <button
          onClick={() => location.reload()}
          className="mt-8 rounded-xl bg-indigo-600 px-6 py-3 text-white"
        >
          Retry
        </button>
      </div>
    </main>
  );
}