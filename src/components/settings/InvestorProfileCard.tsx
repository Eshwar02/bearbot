'use client';
import { useEffect, useState } from 'react';

export default function InvestorProfileCard() {
  const [profile, setProfile] = useState<any>(null);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    fetch('/api/user/investor-profile')
      .then(r => r.json())
      .then(d => setProfile(d.profile));
  }, []);

  const clearProfile = async () => {
    setClearing(true);
    await fetch('/api/user/investor-profile', {
      method: 'POST',
      body: JSON.stringify({ profile: {} }),
      headers: { 'Content-Type': 'application/json' }
    });
    setProfile({});
    setClearing(false);
  };

  if (profile === null) return <p className="text-sm text-gray-500">Loading profile...</p>;

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-lg">Investor Profile</h3>
      {Object.keys(profile).length === 0 ? (
        <p className="text-sm text-gray-500">No profile data yet. Start chatting about stocks to build your profile.</p>
      ) : (
        <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded overflow-auto max-h-60">
          {JSON.stringify(profile, null, 2)}
        </pre>
      )}
      <button
        onClick={clearProfile}
        disabled={clearing}
        className="text-sm text-red-500 hover:underline disabled:opacity-50"
      >
        {clearing ? 'Clearing...' : 'Clear Profile'}
      </button>
    </div>
  );
}