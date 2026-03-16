import { useAuth } from './features/auth/AuthContext'
import { LoginView } from './features/auth/LoginView'

function App() {
  const { user, loading, logout } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="text-sm text-gray-600">Loading your session…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginView />
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-xl">
        <div className="bg-white rounded-2xl shadow-xl px-8 py-10">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Welcome, {user.email}
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            You&apos;re signed in. This is where your personalized todo
            dashboard will live.
          </p>

          <button
            type="button"
            onClick={() => logout()}
            className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
