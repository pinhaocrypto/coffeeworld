import { useWorldID } from './WorldIDProvider';

export default function WorldIDButton() {
  const { isVerified, isLoading, error, openWidget, handleSignOut, devModeLogin } = useWorldID();
  const isDev = process.env.NODE_ENV !== 'production';

  return (
    <div className="flex flex-col items-end">
      {error && <div className="text-red-500 text-xs mb-1">Error: {error}</div>}
      
      {isVerified ? (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-white">Verified</span>
          <button 
            className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
            onClick={handleSignOut}
            disabled={isLoading}
          >
            {isLoading ? 'Signing Out...' : 'Sign Out'}
          </button>
        </div>
      ) : (
        <div className="flex space-x-2">
          <button 
            className="px-3 py-1 text-sm font-medium text-white bg-amber-700 rounded hover:bg-amber-800 disabled:opacity-50 transition duration-200"
            onClick={openWidget}
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Verify with World ID'}
          </button>
          
          {isDev && (
            <button 
              className="px-3 py-1 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50 transition duration-200"
              onClick={devModeLogin}
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : '🛠️ Dev Login'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
