import { useState, useRef, useEffect } from 'react';
import { CSSTransition } from 'react-transition-group';

interface AnalysisProps {
  loading: boolean;
  result: string | null;
  onAnalyze: () => Promise<void>;
  hasResult: boolean;
  onLogout: () => void;
}

const Analysis: React.FC<AnalysisProps> = ({ loading, result, onAnalyze, hasResult, onLogout }) => {
  const [typedResult, setTypedResult] = useState<string | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Listen for a custom event to cancel
    const cancelListener = () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
      setTypedResult(null);
    };
    window.addEventListener('analyzr-cancel', cancelListener);
    return () => {
      window.removeEventListener('analyzr-cancel', cancelListener);
    };
  }, []);

  useEffect(() => {
    if (result) {
      // Wait for ellipsis to fade out
      setTimeout(() => {
        setTypedResult('');
        // Extract only the text nodes and tags for a typewriter effect that preserves HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = result;
        const nodes: ChildNode[] = Array.from(tempDiv.childNodes);
        let htmlSoFar = '';
        let charIndex = 0;
        let flatNodes: { text: string; tagOpen?: string; tagClose?: string }[] = [];

        function flatten(node: ChildNode) {
          if (node.nodeType === Node.TEXT_NODE) {
            // Trim whitespace-only text nodes to avoid extra vertical space
            let text = (node.textContent || '').replace(/\s+/g, ' ');

            if (text.trim() !== '') {
              flatNodes.push({ text });
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            // Only add attributes if they exist, and use double quotes for HTML validity
            const attrs = el
              .getAttributeNames()
              .map((n) => ` ${n}="${el.getAttribute(n)}"`)
              .join('');
            flatNodes.push({ tagOpen: `<${el.tagName.toLowerCase()}${attrs}>`, text: '' });
            Array.from(node.childNodes).forEach(flatten);
            flatNodes.push({ tagClose: `</${el.tagName.toLowerCase()}>`, text: '' });
          }
        }
        nodes.forEach(flatten);

        function typeNext() {
          while (charIndex < flatNodes.length) {
            const node = flatNodes[charIndex];
            if (node.tagOpen) {
              htmlSoFar += node.tagOpen;
              charIndex++;
            } else if (node.tagClose) {
              htmlSoFar += node.tagClose;
              charIndex++;
            } else if (node.text) {
              // Type out text one character at a time
              const nextChar = node.text[0];
              htmlSoFar += nextChar;
              node.text = node.text.slice(1);
              setTypedResult(htmlSoFar);
              if (node.text.length === 0) {
                charIndex++;
              }
              typingTimeout.current = setTimeout(typeNext, 4);
              return;
            } else {
              charIndex++;
            }
          }
          setTypedResult(htmlSoFar);
        }
        typeNext();
        return () => {
          if (typingTimeout.current) clearTimeout(typingTimeout.current);
        };
      }, 350);
    } else {
      setTypedResult(null);
    }
  }, [result]);

  const handleAnalyze = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    try {
      await onAnalyze();
    } catch (e) {
      // Ignore abort errors
    }
  };

  return (
    <div className="container">
      <div
        style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', width: '100%' }}
      >
        <a
          href="#"
          role="link"
          className="logout-link text-lg mr-4"
          style={{
            fontWeight: 600,
            textDecoration: 'underline',
            cursor: 'pointer',
            marginBottom: 8,
          }}
          onClick={(e) => {
            e.preventDefault();
            window.dispatchEvent(new Event('analyzr-cancel'));
            onLogout();
          }}
        >
          Logout
        </a>
      </div>
      <div className="justify-center grid">
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="analyzr-btn shadow-lg transition duration-150 ease-in-out hover:shadow-xl"
        >
          Analyze
        </button>
      </div>
      <div className="justify-center grid" style={{ position: 'relative', minHeight: 64 }}>
        <CSSTransition in={loading} timeout={350} classNames="fade" unmountOnExit>
          <div className="ellipsis-loader" title="ellipsis-loader" aria-label="Loading">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </div>
        </CSSTransition>
        {!loading && hasResult && !!typedResult && (
          <div
            className="result typewriter"
            dangerouslySetInnerHTML={{ __html: typedResult || '' }}
          />
        )}
      </div>
    </div>
  );
};

export default Analysis;
