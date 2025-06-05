import React, { useState, useEffect } from 'react';

interface RegisterProps {
  onRegister: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister }) => {
  const [trialKey, setTrialKey] = useState('');
  const [storageType, setStorageType] = useState<'local' | 'sync'>('local');
  const [error, setError] = useState('');

  useEffect(() => {
    // Try to load existing key
    chrome.storage.local.get(['saTrialKey'], (result) => {
      if (result.saTrialKey) {
        setTrialKey(result.saTrialKey);
      } else {
        chrome.storage.sync.get(['saTrialKey'], (syncResult) => {
          if (syncResult.saTrialKey) {
            setTrialKey(syncResult.saTrialKey);
          }
        });
      }
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trialKey.trim()) {
      setError('Trial key is required');
      return;
    }
    setError('');
    const storage = storageType === 'local' ? chrome.storage.local : chrome.storage.sync;
    storage.set({ saTrialKey: trialKey.trim() }, () => {
      onRegister();
    });
  };

  const isFormValid = trialKey.trim() !== '' && (storageType === 'local' || storageType === 'sync');

  return (
    <form role="form" className="register-form container" onSubmit={handleSubmit}>
      <div className="justify-center grid text-center text-lg pl-10 pr-10 pt-7 mb-2">
        <p>
          Sentiment Analyzr uses GPT to analyze the sentiment of any web page and responds with a
          detailed report which includes a neutralized summary of the page content. It works great
          on news articles, blog posts, social media threads, political cartoons, etc. At this time,
          it does not analyze video or audio data. Sentiment Analyzr is currently in beta. It is
          only available to a limited number of trial users. You may request a trial via{' '}
          <u>
            <a href="mailto:mattbahr1992@gmail.com?subject=Sentiment Analyzr Trial Request">
              email
            </a>
          </u>
          .
        </p>
      </div>
      <div className="justify-center grid">
        <h1>Register Your Trial Key</h1>
      </div>
      <div className="justify-center grid mb-4">
        <input
          type="text"
          placeholder="Trial Key"
          value={trialKey}
          onChange={(e) => setTrialKey(e.target.value)}
          className="trial-key-input mb-2 text-lg border-2 rounded-md p-1 bg-white"
        />
        <div className="storage-choice text-sm">
          <div>
            <label>
              <input
                type="radio"
                name="storageType"
                value="local"
                checked={storageType === 'local'}
                onChange={() => setStorageType('local')}
                className="mr-1"
              />
              Local - Access the key only from this browser.
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="storageType"
                value="sync"
                checked={storageType === 'sync'}
                onChange={() => setStorageType('sync')}
                className="mr-1"
              />
              Sync - Access the key across all synced browsers.
            </label>
          </div>
        </div>
        {error && <div className="error">{error}</div>}
      </div>
      <div className="justify-center grid">
        <button
          type="submit"
          className="analyzr-btn shadow-lg transition duration-150 ease-in-out hover:shadow-xl"
          disabled={!isFormValid}
        >
          Save Trial Key
        </button>
      </div>
    </form>
  );
};

export default Register;
