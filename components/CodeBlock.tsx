import React, { useMemo } from 'react';
import Prism from 'prismjs';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'clike' }) => {
  const html = useMemo(() => {
    // Ensure Prism and languages are available
    if (!Prism || !Prism.languages) return code;

    // Resolve grammar with fallbacks: specific -> clike -> javascript
    const grammar = Prism.languages[language] || Prism.languages.clike || Prism.languages.javascript;
    
    if (!grammar) return code;
    
    try {
      return Prism.highlight(code, grammar, language);
    } catch (e) {
      console.warn('Prism highlighting failed:', e);
      return code;
    }
  }, [code, language]);

  return (
    <pre className={`language-${language} !bg-transparent !m-0 !p-0 font-mono text-sm leading-relaxed`}>
      <code 
        className={`language-${language}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </pre>
  );
};