import { motion } from 'framer-motion';
import { FaCopy } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Highlight } from 'prism-react-renderer';
import { useCallback } from 'react';
import { ChatMessage as MessageType } from '../utils/storage';

interface ChatMessageProps {
  message: MessageType;
  onCopy: (text: string) => void;
  theme: 'dark' | 'light';
}

// Define color values from the new palette for use in Highlight theme
const newPalette = {
  backgroundDark: '#121212',
  textPrimaryDark: '#E0E0E0',
  codeBgDark: '#1E1E1E', // Background for code blocks in dark mode

  backgroundLight: '#F5F5F5',
  textPrimaryLight: '#202020',
  codeBgLight: '#EFEFEF', // Background for code blocks in light mode
};

export default function ChatMessage({ message, onCopy, theme }: ChatMessageProps) {
  const handleCopy = useCallback(() => {
    onCopy(message.content);
  }, [message.content, onCopy]);

  const codeBlockTheme = {
    plain: {
      color: theme === 'dark' ? newPalette.textPrimaryDark : newPalette.textPrimaryLight,
      backgroundColor: theme === 'dark' ? newPalette.codeBgDark : newPalette.codeBgLight,
    },
    styles: [ // Minimal styles, can be expanded for more syntax highlighting
      {
        types: ['prolog', 'comment', 'doctype', 'cdata'],
        style: {
          color: theme === 'dark' ? '#9CA3AF' : '#6B7280', // Example: text-secondary
        },
      },
      {
        types: ['punctuation'],
        style: {
          color: theme === 'dark' ? newPalette.textPrimaryDark : newPalette.textPrimaryLight,
        },
      },
      {
        types: ['property', 'tag', 'boolean', 'number', 'constant', 'symbol'],
        style: {
          color: theme === 'dark' ? '#FBBF24' : '#F59E0B', // Example: accent color variant
        },
      },
      {
        types: ['selector', 'attr-name', 'string', 'char', 'builtin', 'inserted'],
        style: {
          color: theme === 'dark' ? '#A7F3D0' : '#34D399', // Example: another accent variant
        },
      },
    ],
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      role="article" // Added role
      aria-labelledby={message.role === 'user' ? 'user-message-heading' : 'assistant-message-heading'} // Example, if we had headings
      // Applying new card style, responsive padding, and conditional user/assistant alignment
      className={`p-3 sm:p-4 m-1 sm:m-2 max-w-[80%] relative
                  bg-card-bg-light dark:bg-card-bg-dark
                  backdrop-blur-md shadow-lg rounded-xl
                  border border-border-light dark:border-border-dark
                  ${message.role === 'user' ? 'self-end' : 'self-start'}`}
    >
      {/* Hidden headings for screen readers, if desired, or rely on message content itself */}
      {/* <h2 id={message.role === 'user' ? 'user-message-heading' : 'assistant-message-heading'} className="sr-only">
        {message.role === 'user' ? 'User Message' : 'Assistant Message'}
      </h2> */}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = node && node.tagName === 'code' && !match; // Check if it's inline code

            return !isInline && match ? (
              // Code block with language
              <div className="relative my-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-md overflow-hidden">
                <Highlight
                  code={String(children).replace(/\n$/, '')}
                  language={match[1] as any} // 'as any' to satisfy Prism's Language type
                  theme={codeBlockTheme as any} // Use the new theme, 'as any' for Prism theme type
                >
                  {({ className: hlClassName, style, tokens, getLineProps, getTokenProps }) => (
                    <pre className={`${hlClassName} p-4 text-sm overflow-x-auto`} style={{ ...style, margin: 0 }}>
                      {tokens.map((line, i) => (
                        <div {...getLineProps({ line, key: i })}>
                          {line.map((token, key) => (
                            <span {...getTokenProps({ token, key })} />
                          ))}
                        </div>
                      ))}
                    </pre>
                  )}
                </Highlight>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onCopy(String(children).replace(/\n$/, ''))}
                  className="absolute top-2 right-2 p-1.5 rounded-md text-text-secondary-light dark:text-text-secondary-dark hover:bg-border-light dark:hover:bg-border-dark focus:outline-none focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark"
                  aria-label="Copy code to clipboard"
                >
                  <FaCopy size={16} />
                </motion.button>
              </div>
            ) : (
              // Inline code or code block without a language
              <code
                className={`px-1.5 py-0.5 rounded-md text-sm
                           bg-background-light dark:bg-background-dark
                           border border-border-light dark:border-border-dark
                           text-accent-light dark:text-accent-dark`}
                {...props}
              >
                {children}
              </code>
            );
          },
          // Customize other elements like links, paragraphs if needed
          a: ({ node, ...props }) => (
            <a className="text-accent-light dark:text-accent-dark hover:underline" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="mb-2 last:mb-0" {...props} />
          ),
          // Add more custom renderers if necessary for ul, ol, li, blockquote, etc.
        }}
      >
        {message.content}
      </ReactMarkdown>
      {/* General copy button for the whole message content, if message.type is 'response' */}
      {message.type === 'response' && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleCopy} // handleCopy already copies message.content
          className="absolute bottom-2 right-2 p-1.5 rounded-md text-text-secondary-light dark:text-text-secondary-dark hover:bg-border-light dark:hover:bg-border-dark focus:outline-none focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark"
          aria-label="Copy message to clipboard"
        >
          <FaCopy size={16} />
        </motion.button>
      )}
    </motion.div>
  );
}