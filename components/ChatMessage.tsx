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

export default function ChatMessage({ message, onCopy, theme }: ChatMessageProps) {
  const handleCopy = useCallback(() => {
    onCopy(message.content);
    const sound = new Audio('/copy.mp3');
    sound.play();
  }, [message.content, onCopy]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`p-4 rounded-lg m-2 max-w-[80%] relative ${theme === 'dark' ? 'glass-effect' : 'glass-effect-light'} ${message.role === 'user' ? 'self-end' : 'self-start'}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = node && node.tagName === 'code' && !match;
            return !isInline ? (
              <div className="relative">
                <Highlight
                  code={String(children).replace(/\n$/, '')}
                  language={match ? match[1] : 'text'}
                  theme={{
                    plain: { background: theme === 'dark' ? '#2a2a2a' : '#f0f0f0', color: theme === 'dark' ? '#f5e6cc' : '#1a1a1a' },
                    styles: [],
                  }}
                >
                  {({ className, style, tokens, getLineProps, getTokenProps }) => (
                    <pre className={className} style={{ ...style, margin: 0, padding: '1rem', borderRadius: '0.5rem' }}>
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
                <button
                  onClick={handleCopy}
                  className="absolute top-2 right-2 text-beige-accent"
                >
                  <FaCopy />
                </button>
              </div>
            ) : (
              <code className={`p-1 rounded ${theme === 'dark' ? 'bg-grey-medium' : 'bg-grey-light'}`} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {message.content}
      </ReactMarkdown>
      <button
        onClick={handleCopy}
        className="text-beige-accent mt-2"
      >
        <FaCopy />
      </button>
    </motion.div>
  );
}