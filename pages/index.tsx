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
  >
    <motion.div className="w-2 h-2 bg-beige-accent rounded-full animate-typing" />
    <motion.div className="w-2 h-2 bg-beige-accent rounded-full animate-typing" style={{ animationDelay: '0.2s' }} />
    <motion.div className="w-2 h-2 bg-beige-accent rounded-full animate-typing" style={{ animationDelay: '0.4s' }} />
  </motion.div>
);

export default function Home() {
  console.log('Home component initializing...');
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
    console.log('Running useEffect for storage load...');
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
      console.log('Saving to storage and scrolling...');
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
    console.log('Handling send...');
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
    console.log('Toggling pause...');
    if (isPaused) {
      setIsPaused(false);
    } else {
      setIsPaused(true);
      abortControllerRef.current?.abort();
    }
    playSound('/click.mp3');
  }, [isPaused, playSound]);

  const clearChat = useCallback(() => {
    console.log('Clearing chat...');
    setMessages([]);
    clearStorage('zenbot');
    playSound('/click.mp3');
  }, [playSound]);

  const handleCopy = useCallback((text: string) => {
    console.log('Copying text...');
    navigator.clipboard.writeText(text);
    playSound('/copy.mp3');
  }, [playSound]);

  console.log('Rendering Home component...');
  return (
    <div className="chat-container">
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
      <div className="flex-1 flex flex-col">
        {!apiKey && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 m-4 bg-grey-dark rounded-lg"
            role="alert"
            aria-label="API key prompt"
          >
            <h2 className="text-beige-accent text-xl mb-2">Enter OpenRouter API Key</h2>
            <p className="mb-4">
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
              className="w-full p-2 rounded bg-grey-medium text-grey-light"
              placeholder="Paste your API key here"
              aria-label="API key input"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={async () => {
                console.log('Saving API key...');
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
              className="mt-2 px-4 py-2 bg-beige-accent text-grey-dark rounded"
              aria-label="Save API key"
            >
              Save Key
            </motion.button>
            {error && <p className="text-red-400 mt-2">{error}</p>}
          </motion.div>
        )}
        {apiKey && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-between p-4 bg-grey-dark"
            >
              <h1 className="text-2xl text-beige-accent">ZenBotTX9000</h1>
              <motion.button
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowSidebar(true);
                  playSound('/click.mp3');
                }}
                className="text-beige-accent"
                aria-label="Open settings"
              >
                <FaCog size={24} />
              </motion.button>
            </motion.div>
            <div
              ref={chatContainerRef}
              id="chat-container"
              className="flex-1 overflow-y-auto p-4"
            >
              {messages.map((msg, index) => (
                <ChatMessageComponent key={index} message={msg} onCopy={handleCopy} />
              ))}
              {isStreaming && <TypingIndicator />}
              <div id="chat-bottom" />
            </div>
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 p-4"
              >
                {error}
              </motion.p>
            )}
            <div className="p-4 bg-grey-dark flex items-center">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                className="flex-grow p-2 rounded bg-grey-medium text-grey-light"
                placeholder="Type your message..."
                disabled={isStreaming && !isPaused}
                aria-label="Message input"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                className="ml-2 p-2 bg-beige-accent text-grey-dark rounded"
                disabled={isStreaming && !isPaused}
                aria-label="Send message"
              >
                <SendIcon />
              </motion.button>
              {isStreaming && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={togglePause}
                  className="ml-2 p-2 bg-grey-medium text-beige-accent rounded"
                  aria-label={isPaused ? 'Resume' : 'Pause'}
                >
                  {isPaused ? <FaPlay /> : <FaPause />}
                </motion.button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const SendIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 12L22 2L12 22L2 12Z" stroke="currentColor" strokeWidth="2" />
  </svg>
);