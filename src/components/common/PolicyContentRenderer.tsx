import React from 'react';
import {
  GraduationCap,
  ShieldCheck,
  AlertTriangle,
  MessageSquare,
  FileText,
} from 'lucide-react';

interface PolicyContentRendererProps {
  content: string;
  textColor?: string;
  subTextColor?: string;
  themeColor?: string;
}

interface PolicySection {
  heading: string;
  lines: string[];
}

const isHeadingLine = (trimmed: string): boolean => {
  return (
    trimmed.startsWith('### ') ||
    /^第[0-9０-９一二三四五六七八九十]+条/.test(trimmed) ||
    (/^[0-9]+[.\s]/.test(trimmed) && trimmed.length < 60)
  );
};

const getSectionMeta = (heading: string): {
  isWarning: boolean;
  tag?: string;
  renderIcon: (color: string) => React.ReactNode;
} => {
  const iconProps = (color: string) => ({ size: 16, color, strokeWidth: 2.2 });

  if (/開発|ベータ|beta|消失|免責/i.test(heading)) {
    return {
      isWarning: true,
      tag: 'Beta',
      renderIcon: (color) => <AlertTriangle {...iconProps(color)} />,
    };
  }
  if (/プライバシー|データ|保存|個人情報/.test(heading)) {
    return {
      isWarning: false,
      renderIcon: (color) => <ShieldCheck {...iconProps(color)} />,
    };
  }
  if (/対象|ルール|目的|禁止/.test(heading)) {
    return {
      isWarning: false,
      renderIcon: (color) => <GraduationCap {...iconProps(color)} />,
    };
  }
  if (/フィードバック|アンケート/.test(heading)) {
    return {
      isWarning: false,
      renderIcon: (color) => <MessageSquare {...iconProps(color)} />,
    };
  }
  return {
    isWarning: false,
    renderIcon: (color) => <FileText {...iconProps(color)} />,
  };
};

export const PolicyContentRenderer: React.FC<PolicyContentRendererProps> = ({
  content,
  textColor = 'var(--text-primary)',
  subTextColor = 'var(--text-secondary)',
  themeColor = 'var(--oshi-color)',
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

  const renderLines = (lines: string[]) => {
    const elements: React.ReactNode[] = [];
    let currentList: string[] = [];

    const flushList = (key: string) => {
      if (currentList.length > 0) {
        elements.push(
          <ul
            key={`ul-${key}`}
            style={{
              margin: '4px 0 0',
              paddingLeft: 18,
              lineHeight: 1.5,
              fontSize: 12,
              color: subTextColor,
            }}
          >
            {currentList.map((item, idx) => (
              <li key={idx} style={{ marginBottom: 2 }}>
                {renderInlineFormatted(item)}
              </li>
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    lines.forEach((line, idx) => {
      if (line.startsWith('・') || line.startsWith('- ') || line.startsWith('* ')) {
        currentList.push(line.replace(/^[・\-*]\s*/, ''));
      } else {
        flushList(`l-${idx}`);
        elements.push(
          <p
            key={`p-${idx}`}
            style={{
              margin: elements.length === 0 ? 0 : '4px 0 0',
              fontSize: 12,
              lineHeight: 1.5,
              color: subTextColor,
            }}
          >
            {renderInlineFormatted(line)}
          </p>
        );
      }
    });

    flushList('end');
    return elements;
  };

  const rawLines = content.split(/\r?\n/);
  const preamble: string[] = [];
  const sections: PolicySection[] = [];
  let currentSection: PolicySection | null = null;

  for (const raw of rawLines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    if (isHeadingLine(trimmed)) {
      const headingText = trimmed.replace(/^###\s+/, '');
      currentSection = { heading: headingText, lines: [] };
      sections.push(currentSection);
    } else if (currentSection) {
      currentSection.lines.push(trimmed);
    } else {
      preamble.push(trimmed);
    }
  }

  const borderSubtle = 'var(--border-subtle)';
  const borderMedium = 'var(--border-medium)';
  const subtleBg = 'var(--bg-surface-subtle)';
  const warningColor = 'var(--color-warning)';
  const warningBg = 'var(--color-warning-bg)';

  return (
    <div>
      {preamble.length > 0 && (
        <div style={{ marginBottom: sections.length > 0 ? 10 : 0 }}>
          {renderLines(preamble)}
        </div>
      )}

      {sections.length > 0 && (
        <div
          style={{
            borderRadius: 14,
            border: `1px solid ${borderMedium}`,
            backgroundColor: subtleBg,
            overflow: 'hidden',
          }}
        >
          {sections.map((section, index) => {
            const meta = getSectionMeta(section.heading);
            const isLast = index === sections.length - 1;
            const iconColor = meta.isWarning ? warningColor : themeColor;

            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 11,
                  padding: '11px 13px',
                  backgroundColor: meta.isWarning ? warningBg : 'transparent',
                  borderBottom: isLast ? 'none' : `1px solid ${borderSubtle}`,
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    flexShrink: 0,
                    marginTop: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: meta.isWarning
                      ? 'rgba(245, 158, 11, 0.16)'
                      : `color-mix(in srgb, ${themeColor} 12%, transparent)`,
                  }}
                  aria-hidden="true"
                >
                  {meta.renderIcon(iconColor)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 6,
                      marginBottom: 3,
                    }}
                  >
                    <h4
                      style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: 800,
                        color: textColor,
                        lineHeight: 1.35,
                      }}
                    >
                      {section.heading}
                    </h4>
                    {meta.tag && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '1px 5.5px',
                          borderRadius: 5,
                          backgroundColor: 'rgba(245, 158, 11, 0.22)',
                          color: warningColor,
                          letterSpacing: '0.01em',
                        }}
                      >
                        {meta.tag}
                      </span>
                    )}
                  </div>
                  {renderLines(section.lines)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
