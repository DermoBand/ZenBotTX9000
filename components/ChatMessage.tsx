import { motion } from 'framer-motion';
import { FaCopy } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'prism-react-renderer';
import { useCallback } from 'react';
import { ChatMessage as MessageType } from '../utils/storage';

interface ChatMessageProps {
  message: MessageType;
  onCopy: (text: string) => void;
}

export default function ChatMessage({ message, onCopy }: ChatMessageProps) {
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
      className={`chat-message ${message.role} ${message.type || ''}`}
      role="article"
      aria-label={`${message.role} message`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = node.tagName === 'code' && !match;
            return !isInline ? (
              <div className="relative">
                <SyntaxHighlighter
                  language={match ? match[1] : 'text'}
                  style={{
                    dark: {
                      background: '#2a2a2a',
                      color: '#f5e6cc',
                    },
                  }}
                  customStyle={{ margin: 0, padding: '1rem', borderRadius: '0.5rem' }}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
                <button
                  onClick={handleCopy}
                  className="absolute top-2 right-2 text-beige-accent"
                  aria-label="Copy code"
                >
                  <FaCopy />
                </button>
              </div>
            ) : (
              <code className="bg-grey-medium p-1 rounded" {...props}>
                {children}
              </code>
            );
          },
          table({ children }) {
            return (
              <table className="border-collapse border border-grey-light my-2 w-full">{children}</table>
            );
          },
          th({ children }) {
            return <th className="border border-grey-light p-2">{children}</th>;
          },
          td({ children }) {
            return <td className="border border-grey-light p-2">{children}</td>;
          },
        }}
      >
        {message.content}
      </ReactMarkdown>
      <button
        onClick={handleCopy}
        className="text-beige-accent mt-2"
        aria-label="Copy message"
      >
        <FaCopy />
      </button>
    </motion.div>
  );
}