import { useState, useEffect } from 'react';

interface SetupModalProps {
  isOpen: boolean;
  currentUser: Record<string, any>;
  onClose: () => void;
  onSkip: () => void;
  onRefresh: () => void;
}

export default function SetupModal({ isOpen, currentUser, onClose, onSkip, onRefresh }: SetupModalProps) {
  const [step, setStep] = useState<'choice' | 'add-self' | 'add-other'>('choice');
  const [userList, setUserList] = useState<Record<string, any>[]>([]);
  const [selectedParent, setSelectedParent] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (step === 'add-self' || step === 'add-other') {
      loadUsers();
    }
  }, [step]);

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users/search?excludeId=' + currentUser.id);
      const data = await res.json();
      setUserList(data);
      setError('');
    } catch (err) {
      console.error('Failed to load users', err);
      setError('Failed to load user list');
    }
  };

  const handleAddSelf = async () => {
    if (!selectedParent) {
      setError('Please select a parent');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/tree/add-to-tree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          parent_id: selectedParent,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to add to tree');
      }

      onRefresh();
      onClose();
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to add yourself to tree');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddOther = async () => {
    if (!selectedParent) {
      setError('Please select a parent');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/tree/add-to-tree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedParent,
          parent_id: currentUser.id,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to add user to tree');
      }

      setSelectedParent(null);
      setSearchTerm('');
      loadUsers();
      setError('');
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to add user to tree');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = userList.filter(u =>
    `${u.primary_name} ${u.spouse_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]">
      <div className="bg-white p-8 rounded-2xl w-96 shadow-2xl max-h-[90vh] overflow-auto">
        {step === 'choice' && (
          <>
            <h2 className="text-2xl font-bold mb-4 text-center">Welcome to Your Family Tree!</h2>
            <p className="text-gray-600 mb-6 text-center text-sm">
              You've successfully created your profile. Would you like to add yourself to the family tree or add another family member?
            </p>

            <div className="space-y-3">
              <button
                onClick={() => setStep('add-self')}
                className="w-full bg-indigo-600 text-white p-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
              >
                Add Myself to the Tree
              </button>
              <button
                onClick={() => setStep('add-other')}
                className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Add Another Family Member
              </button>
              <button
                onClick={onSkip}
                className="w-full bg-gray-200 text-gray-700 p-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Skip for Now
              </button>
            </div>
          </>
        )}

        {step === 'add-self' && (
          <>
            <button
              onClick={() => setStep('choice')}
              className="text-gray-500 hover:text-gray-700 mb-4 text-sm"
            >
              ← Back
            </button>
            <h2 className="text-xl font-bold mb-4">Add Yourself to the Tree</h2>
            <p className="text-gray-600 mb-4 text-sm">Select your parent in the family tree:</p>

            <input
              type="text"
              placeholder="Search family members..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full border p-2 mb-3 rounded"
            />

            <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedParent(user.id)}
                    className={`w-full p-3 text-left rounded border-2 transition ${
                      selectedParent === user.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-sm">{user.primary_name}</div>
                    {user.spouse_name && <div className="text-xs text-gray-500">& {user.spouse_name}</div>}
                  </button>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4 text-sm">No family members found</p>
              )}
            </div>

            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

            <div className="flex gap-2">
              <button
                onClick={() => setStep('choice')}
                className="flex-1 bg-gray-200 text-gray-700 p-2 rounded font-semibold hover:bg-gray-300 transition"
              >
                Back
              </button>
              <button
                onClick={handleAddSelf}
                disabled={!selectedParent || isSaving}
                className="flex-1 bg-indigo-600 text-white p-2 rounded font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
              >
                {isSaving ? 'Saving...' : 'Add Me'}
              </button>
            </div>
          </>
        )}

        {step === 'add-other' && (
          <>
            <button
              onClick={() => setStep('choice')}
              className="text-gray-500 hover:text-gray-700 mb-4 text-sm"
            >
              ← Back
            </button>
            <h2 className="text-xl font-bold mb-4">Add Family Member to Tree</h2>
            <p className="text-gray-600 mb-4 text-sm">Select a family member to add under you:</p>

            <input
              type="text"
              placeholder="Search existing members..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full border p-2 mb-3 rounded"
            />

            <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedParent(user.id)}
                    className={`w-full p-3 text-left rounded border-2 transition ${
                      selectedParent === user.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-sm">{user.primary_name}</div>
                    {user.spouse_name && <div className="text-xs text-gray-500">& {user.spouse_name}</div>}
                  </button>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4 text-sm">No family members found</p>
              )}
            </div>

            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

            <div className="flex gap-2">
              <button
                onClick={() => setStep('choice')}
                className="flex-1 bg-gray-200 text-gray-700 p-2 rounded font-semibold hover:bg-gray-300 transition"
              >
                Back
              </button>
              <button
                onClick={handleAddOther}
                disabled={!selectedParent || isSaving}
                className="flex-1 bg-blue-600 text-white p-2 rounded font-semibold hover:bg-blue-700 transition disabled:opacity-60"
              >
                {isSaving ? 'Saving...' : 'Add Member'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
