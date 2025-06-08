import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCog, FaPause, FaPlay } from 'react-icons/fa';
import { scroller } from 'react-scroll';
import { saveToStorage, loadFromStorage, clearStorage, ChatMessage, StorageSchema } from '../utils/storage';
import { streamResponse, checkApiKey } from '../utils/api';
import ChatMessageComponent from '../components/ChatMessage';
import Sidebar from '../components/Sidebar';

const TypingIndicator = () => (
  <motion.div
    className="flex space-x-2 p-4"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
  >
    <motion.div className="w-2 h-2 bg-beige-accent rounded-full animate-pulse" />
    <motion.div className="w-2 h-2 bg-beige-accent rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
    <motion.div className="w-2 h-2 bg-beige-accent rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
  </motion.div>
);

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [model, setModel] = useState('deepseek-r1:0528');
  const [customModels, setCustomModels] = useState<string[]>([]);
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful assistant.');
  const [maxTokens, setMaxTokens] = useState(4096);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [soundVolume, setSoundVolume] = useState(0.5);
  const [error, setError] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = loadFromStorage<StorageSchema>('zenbot');
      if (stored && stored.version === 1) {
        setApiKey(stored.apiKey || '');
        setMessages(stored.messages || []);
        setCustomModels(stored.customModels || []);
      }
      if (!stored) {
        setMessages([
          {
            role: 'assistant',
            content: 'Welcome to ZenBotTX9000! Enter your OpenRouter API key to start chatting. Get your free key from [OpenRouter.ai](https://openrouter.ai).',
            type: 'response',
          },
        ]);
      }
    } catch (e) {
      console.error('Error loading storage:', e);
      setError('Failed to load saved data. Please try again.');
    }
  }, []);

  useEffect(() => {
    if (messages.length) {
      try {
        saveToStorage('zenbot', { version: 1, apiKey, messages, customModels });
        scroller.scrollTo('chat-bottom', {
          containerId: 'chat-container',
          smooth: true,
          duration: 300,
        });
      } catch (e) {
        console.error('Error saving storage:', e);
      }
    }
  }, [messages, apiKey, customModels]);

  const playSound = useCallback((src: string) => {
    try {
      const sound = new Audio(src);
      sound.volume = soundVolume;
      sound.play().catch((e) => console.error('Error playing sound:', e));
    } catch (e) {
      console.error('Error initializing sound:', e);
    }
  }, [soundVolume]);

  const handleSend = useCallback(async () => {
    if (!apiKey) {
      setError('Please enter your OpenRouter API key. Visit https://openrouter.ai to get one.');
      return;
    }
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);
    setError('');
    playSound('/click.mp3');

    abortControllerRef.current = new AbortController();

    try {
      let currentMessage: ChatMessage = { role: 'assistant', content: '', type: 'response' };
      setMessages((prev) => [...prev, currentMessage]);

      await streamResponse(
        apiKey,
        model,
        messages.concat(userMessage),
        systemPrompt,
        maxTokens,
        (chunk, type) => {
          playSound('/typing.mp3');
          setMessages((prev) => {
            const updated = [...prev];
            if (type !== currentMessage.type) {
              currentMessage = { role: 'assistant', content: chunk, type };
              updated.push(currentMessage);
            } else {
              currentMessage.content += chunk;
              updated[updated.length - 1] = { ...currentMessage };
            }
            return updated;
          });
        },
        abortControllerRef.current.signal
      );
    } catch (error: any) {
      console.error('Error streaming response:', error);
      setError(`Error: ${error.message || 'Failed to fetch response. Check your API key or network.'}`);
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [apiKey, model, messages, systemPrompt, maxTokens, input, playSound]);

  const togglePause = useCallback(() => {
    if (isPaused) {
      setIsPaused(false);
    } else {
      setIsPaused(true);
      abortControllerRef.current?.abort();
    }
    playSound('/click.mp3');
  }, [isPaused, playSound]);

  const clearChat = useCallback(() => {
    setMessages([]);
    clearStorage('zenbot');
    playSound('/click.mp3');
  }, [playSound]);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    playSound('/copy.mp3');
  }, [playSound]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-grey-dark text-grey-light flex flex-col"
    >
      <Sidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        model={model}
        setModel={setModel}
        customModels={customModels}
        setCustomModels={setCustomModels}
        systemPrompt={systemPrompt}
        setSystemPrompt={setSystemPrompt}
        maxTokens={maxTokens}
        setMaxTokens={setMaxTokens}
        apiKey={apiKey}
        setApiKey={setApiKey}
        clearChat={clearChat}
        soundVolume={soundVolume}
        setSoundVolume={setSoundVolume}
      />
      <motion.div
        className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4"
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
      >
        {!apiKey && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="p-6 bg-grey-dark/80 backdrop-blur-md rounded-xl shadow-lg border border-grey-medium"
          >
            <h2 className="text-2xl text-beige-accent mb-4">Enter OpenRouter API Key</h2>
            <p className="mb-4 text-sm">
              Get your free API key from{' '}
              <a href="https://openrouter.ai" target="_blank" className="text-beige-accent underline">
                OpenRouter.ai
              </a>
              . Sign up, go to the API section, and copy your key.
            </p>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-3 rounded-lg bg-grey-medium text-grey-light focus:outline-none focus:ring-2 focus:ring-beige-accent"
              placeholder="Paste your API key here"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={async () => {
                try {
                  const isValid = await checkApiKey(apiKey, model);
                  if (isValid) {
                    saveToStorage('zenbot', { version: 1, apiKey, messages, customModels });
                    setError('');
                  } else {
                    setError('Invalid API key or model unavailable. Visit https://openrouter.ai to get a valid key.');
                  }
                  playSound('/click.mp3');
                } catch (e) {
                  console.error('Error saving API key:', e);
                  setError('Failed to save API key. Please try again.');
                }
              }}
              className="mt-4 w-full px-6 py-3 bg-beige-accent text-grey-dark rounded-lg font-semibold"
            >
              Save Key
            </motion.button>
            {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
          </motion.div>
        )}
        {apiKey && (
          <>
            <motion.div
              className="flex justify-between items-center p-4 bg-grey-dark/80 backdrop-blur-md rounded-xl shadow-md"
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-3xl font-bold text-beige-accent">ZenBotTX9000</h1>
              <motion.button
                whileHover={{ rotate: 90, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setShowSidebar(true);
                  playSound('/click.mp3');
                }}
                className="text-beige-accent"
              >
                <FaCog size={28} />
              </motion.button>
            </motion.div>
            <motion.div
              ref={chatContainerRef}
              id="chat-container"
              className="flex-1 overflow-y-auto p-4 space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <AnimatePresence>
                {messages.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChatMessageComponent message={msg} onCopy={handleCopy} />
                  </motion.div>
                ))}
                {isStreaming && <TypingIndicator />}
                <div id="chat-bottom" />
              </AnimatePresence>
            </motion.div>
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 p-4 text-center"
              >
                {error}
              </motion.p>
            )}
            <motion.div
              className="p-4 bg-grey-dark/80 backdrop-blur-md rounded-xl shadow-md flex items-center space-x-2"
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                className="flex-grow p-3 rounded-lg bg-grey-medium text-grey-light focus:outline-none focus:ring-2 focus:ring-beige-accent"
                placeholder="Type your message..."
                disabled={isStreaming && !isPaused}
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleSend}
                className="p-3 bg-beige-accent text-grey-dark rounded-lg"
                disabled={isStreaming && !isPaused}
              >
                <SendIcon />
              </motion.button>
              {isStreaming && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={togglePause}
                  className="p-3 bg-grey-medium text-beige-accent rounded-lg"
                >
                  {isPaused ? <FaPlay size={20} /> : <FaPause size={20} />}
                </motion.button>
              )}
            </motion.div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

const SendIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 12L22 2L12 22L2 12Z" stroke="currentColor" strokeWidth="2" />
  </svg>
);