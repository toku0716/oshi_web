import React from 'react';

interface PolicyContentRendererProps {
  content: string;
  textColor?: string;
  subTextColor?: string;
}

export const PolicyContentRenderer: React.FC<PolicyContentRendererProps> = ({
  content,
  textColor = 'var(--text-primary)',
  subTextColor = 'var(--text-secondary)',
}) => {
  const renderInlineFormatted = (text: string) => {
    const parts: React.ReactNode[] = [];
    const regex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      parts.push(
        <strong key={match.index} style={{ color: textColor, fontWeight: 700 }}>
          {match[1]}
        </strong>
      );
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    return parts.length > 0 ? parts : text;
  };

  const lines = content.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];

  const flushList = (key: string) => {
    if (currentList.length > 0) {
      elements.push(
        <ul
          key={`ul-${key}`}
          style={{
            margin: '0 0 16px',
            paddingLeft: 20,
            lineHeight: 1.65,
            color: subTextColor,
          }}
        >
          {currentList.map((item, idx) => (
            <li key={idx} style={{ marginBottom: 4 }}>
              {renderInlineFormatted(item)}
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushList(`empty-${i}`);
      continue;
    }

    // List item check
    if (trimmed.startsWith('・') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const itemText = trimmed.replace(/^[・\-*]\s*/, '');
      currentList.push(itemText);
      continue;
    }

    // Not a list item, flush any pending list
    flushList(`line-${i}`);

    // Heading check (### or 第〇条 or 1. など)
    const isMarkdownH3 = trimmed.startsWith('### ');
    const isHeadingLike =
      isMarkdownH3 ||
      /^第[0-9０-９一二三四五六七八九十]+条/.test(trimmed) ||
      (/^[0-9]+[.\s]/.test(trimmed) && trimmed.length < 60);

    if (isHeadingLike) {
      const headingText = isMarkdownH3 ? trimmed.replace(/^###\s+/, '') : trimmed;
      elements.push(
        <h4
          key={`h4-${i}`}
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: textColor,
            margin: elements.length === 0 ? '0 0 6px' : '20px 0 6px',
            lineHeight: 1.4,
          }}
        >
          {headingText}
        </h4>
      );
    } else {
      // Normal paragraph
      elements.push(
        <p
          key={`p-${i}`}
          style={{
            margin: '0 0 12px',
            lineHeight: 1.65,
            color: subTextColor,
          }}
        >
          {renderInlineFormatted(trimmed)}
        </p>
      );
    }
  }

  flushList('end');

  return <div>{elements}</div>;
};
