'use client';
import { useEffect, useState } from 'react';

export default function InvestorProfileCard() {
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    fetch('/api/user/investor-profile')
      .then(r => {
        if (!r.ok) throw new Error('Failed to load profile');
        return r.json();
      })
      .then(d => {
        setProfile(d.profile || {});
        setError(null);
      })
      .catch(err => {
        setProfile({});
        setError(err.message || 'Failed to load investor profile');
      });
  }, []);

  const clearProfile = async () => {
    setClearing(true);
    try {
      await fetch('/api/user/investor-profile', {
        method: 'POST',
        body: JSON.stringify({ profile: {} }),
        headers: { 'Content-Type': 'application/json' }
      });
      setProfile({});
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear profile');
    } finally {
      setClearing(false);
    }
  };

  if (error) {
    return (
      <div className="border rounded-lg p-4 space-y-3">
        <p className="text-sm text-red-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-blue-500 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (profile === null) return <p className="text-sm text-muted">Loading profile...</p>;

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-lg">Investor Profile</h3>
      {Object.keys(profile).length === 0 ? (
        <p className="text-sm text-muted">No profile data yet. Start chatting about stocks to build your profile.</p>
      ) : (
        <pre className="text-xs bg-canvas dark:bg-elevated p-3 rounded overflow-auto max-h-60 border border-borderSubtle">
          {JSON.stringify(profile, null, 2)}
        </pre>
      )}
      <button
        onClick={clearProfile}
        disabled={clearing || Object.keys(profile).length === 0}
        className="text-sm text-red-500 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {clearing ? 'Clearing...' : 'Clear Profile'}
      </button>
    </div>
  );
}