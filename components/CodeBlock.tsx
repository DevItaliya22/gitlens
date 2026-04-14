import React, { useEffect, useMemo, useRef, useState } from "react";
import Prism from "prismjs";

interface CodeBlockProps {
  code: string;
  language?: string;
}

const LINE_HEIGHT = 22;
const OVERSCAN = 30;

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = "clike",
}) => {
  const lines = useMemo(() => code.split("\n"), [code]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateHeight = () => setContainerHeight(element.clientHeight);
    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const totalHeight = lines.length * LINE_HEIGHT;
  const firstVisible = Math.floor(scrollTop / LINE_HEIGHT);
  const visibleCount = Math.ceil(containerHeight / LINE_HEIGHT);
  const start = Math.max(0, firstVisible - OVERSCAN);
  const end = Math.min(lines.length, firstVisible + visibleCount + OVERSCAN);
  const topSpacerHeight = start * LINE_HEIGHT;
  const bottomSpacerHeight = Math.max(0, totalHeight - end * LINE_HEIGHT);

  const highlightedVisibleLines = useMemo(() => {
    const grammar =
      Prism.languages[language] ||
      Prism.languages.clike ||
      Prism.languages.javascript;
    if (!grammar || !Prism?.highlight) {
      return lines.slice(start, end);
    }

    return lines.slice(start, end).map((line) => {
      try {
        return Prism.highlight(line, grammar, language);
      } catch {
        return line;
      }
    });
  }, [language, lines, start, end]);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto custom-scrollbar"
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: topSpacerHeight }} />
      <pre
        className={`language-${language} !bg-transparent !m-0 !p-0 font-mono text-sm leading-relaxed`}
      >
        <code className={`language-${language}`}>
          {highlightedVisibleLines.map((line, idx) => (
            <div
              key={`${start + idx}-${line.length}`}
              style={{ minHeight: LINE_HEIGHT }}
              dangerouslySetInnerHTML={{ __html: line || " " }}
            />
          ))}
        </code>
      </pre>
      <div style={{ height: bottomSpacerHeight }} />
    </div>
  );
};
