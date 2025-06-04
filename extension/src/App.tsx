import { useEffect, useState } from 'react';
import Register from './components/Register';
import Analysis from './components/Analysis';
import envJSON from '../env.json';
import { CSSTransition, SwitchTransition } from 'react-transition-group';

function App() {
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingKey, setLoadingKey] = useState<boolean>(true);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    // Check for saved API key in local or sync storage
    chrome.storage.local.get(['openaiApiKey'], (result) => {
      if (result.openaiApiKey) {
        setApiKey(result.openaiApiKey);
        setHasApiKey(true);
        setLoadingKey(false);
      } else {
        chrome.storage.sync.get(['openaiApiKey'], (syncResult) => {
          if (syncResult.openaiApiKey) {
            setApiKey(syncResult.openaiApiKey);
            setHasApiKey(true);
          } else {
            setHasApiKey(false);
          }

          setLoadingKey(false);
        });
      }
    });
  }, []);

  const handleRegister = () => {
    // After registration, check for key again
    chrome.storage.local.get(['openaiApiKey'], (result) => {
      if (result.openaiApiKey) {
        setApiKey(result.openaiApiKey);
        setHasApiKey(true);
      } else {
        chrome.storage.sync.get(['openaiApiKey'], (syncResult) => {
          if (syncResult.openaiApiKey) {
            setApiKey(syncResult.openaiApiKey);
            setHasApiKey(true);
          } else {
            setHasApiKey(false);
          }
        });
      }
    });
  };

  const handleLogout = () => {
    // Cancel any pending analyze request (typewriter and fetch)
    window.dispatchEvent(new Event('analyzr-cancel'));
    chrome.storage.local.remove(['openaiApiKey'], () => {
      chrome.storage.sync.remove(['openaiApiKey'], () => {
        setApiKey(null);
        setHasApiKey(false);
        setResult(null);
        setLoading(false);
      });
    });
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setResult(null);

    // Get the full HTML of the current page
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const html = await chrome.scripting
      .executeScript({
        target: { tabId: tab.id ? tab.id : 0 },
        func: () => document.documentElement.outerHTML,
      })
      .then((res) => res[0].result);
    // Get API key from state
    let key = apiKey;
    if (!key) {
      // fallback: try to get from storage again
      key = await new Promise<string | null>((resolve) => {
        chrome.storage.local.get(['openaiApiKey'], (result) => {
          if (result.openaiApiKey) resolve(result.openaiApiKey);
          else
            chrome.storage.sync.get(['openaiApiKey'], (syncResult) =>
              resolve(syncResult.openaiApiKey || null)
            );
        });
      });
    }

    // Use AbortController for fetch
    const abortController = new AbortController();
    window.addEventListener('analyzr-cancel', () => abortController.abort(), { once: true });
    try {
      const response = await fetch(envJSON.REACT_APP_API_URL + '/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, apiKey: key }),
        signal: abortController.signal,
      });

      setLoading(false);
      const errorMsg = '<div>We apologize, but we were unable to analyze the page content.</div>';
      const trialExpiredMsg =
        '<div>Your trial has expired. Please log out and provide a valid OpenAI API key.</div>';
      if (response.ok) {
        const json = await response.json();
        let result = json.result;

        if (!result) {
          setResult(errorMsg);
          return;
        }

        const startIdx = result.indexOf('<div>');
        const endIdx = result.indexOf('</div>');

        if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) {
          setResult(errorMsg);
          return;
        }

        result = result.substring(startIdx, endIdx + 6);
        setResult(result);
      } else if (response.status === 403) {
        setResult(trialExpiredMsg);
      } else {
        setResult(errorMsg);
      }
    } catch (e) {
      if ((e as any).name === 'AbortError') {
        setLoading(false);
        setResult(null);
        return;
      }
      setLoading(false);
      setResult('<div>An unexpected error occurred. Please try again later.</div>');
    }
  };

  return (
    !loadingKey && (
      <SwitchTransition mode="out-in">
        <CSSTransition
          key={hasApiKey ? 'analyze' : 'register'}
          timeout={350}
          classNames="fade-slide"
          unmountOnExit
        >
          {hasApiKey ? (
            <Analysis
              loading={loading}
              result={result}
              onAnalyze={handleAnalyze}
              hasResult={!!result}
              onLogout={handleLogout}
            />
          ) : (
            <Register onRegister={handleRegister} />
          )}
        </CSSTransition>
      </SwitchTransition>
    )
  );
}

export default App;
