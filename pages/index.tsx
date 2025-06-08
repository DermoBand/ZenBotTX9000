import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCog, FaPause, FaPlay, FaMoon, FaSun } from 'react-icons/fa';
import { scroller } from 'react-scroll';
import { saveToStorage, loadFromStorage, clearStorage, ChatMessage } from '../utils/storage';
import { streamResponse, checkApiKey } from '../utils/api';
import ChatMessageComponent from '../components/ChatMessage';
import Sidebar from '../components/Sidebar';

const TypingIndicator = ({ theme }: { theme: 'dark' | 'light' }) => (
  <motion.div
    className="flex space-x-2 p-4"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <motion.div className={`w-2 h-2 ${theme === 'dark' ? 'bg-beige-accent' : 'bg-grey-dark'} rounded-full animate-pulse`} />
    <motion.div className={`w-2 h-2 ${theme === 'dark' ? 'bg-beige-accent' : 'bg-grey-dark'} rounded-full animate-pulse`} style={{ animationDelay: '0.2s' }} />
    <motion.div className={`w-2 h-2 ${theme === 'dark' ? 'bg-beige-accent' : 'bg-grey-dark'} rounded-full animate-pulse`} style={{ animationDelay: '0.4s' }} />
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
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = loadFromStorage('zenbot');
    if (stored && stored.version === 1) {
      setApiKey(stored.apiKey || '');
      setMessages(stored.messages || []);
      setCustomModels(stored.customModels || []);
    }
    if (!stored) {
      setMessages([{ role: 'assistant', content: 'Welcome to ZenBotTX9000! Enter your OpenRouter API key to start chatting. Get your free key from [OpenRouter.ai](https://openrouter.ai).', type: 'response' }]);
    }
  }, []);

  useEffect(() => {
    if (messages.length) {
      saveToStorage('zenbot', { version: 1, apiKey, messages, customModels });
      scroller.scrollTo('chat-bottom', { containerId: 'chat-container', smooth: true, duration: 300 });
    }
  }, [messages, apiKey, customModels]);

  const playSound = useCallback((src: string) => {
    const sound = new Audio(src);
    sound.volume = soundVolume;
    sound.play();
  }, [soundVolume]);

  const handleSend = useCallback(async () => {
    if (!apiKey) {
      setError('Please enter your OpenRouter API key.');
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
    let currentMessage: ChatMessage = { role: 'assistant', content: '', type: 'response' };
    setMessages((prev) => [...prev, currentMessage]);

    try {
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
      setError(`Error: ${error.message || 'Failed to fetch response.'}`);
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [apiKey, model, messages, systemPrompt, maxTokens, input, playSound]);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
    if (!isPaused) abortControllerRef.current?.abort();
    playSound('/click.mp3');
  }, [isPaused, playSound]);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    playSound('/copy.mp3');
  }, [playSound]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    playSound('/click.mp3');
  }, [playSound]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`min-h-screen ${theme} flex flex-col`}
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
        clearChat={() => setMessages([])}
        soundVolume={soundVolume}
        setSoundVolume={setSoundVolume}
        theme={theme}
        toggleTheme={toggleTheme}
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
            className={`p-6 ${theme === 'dark' ? 'glass-effect' : 'glass-effect-light'}`}
          >
            <h2 className="text-2xl text-beige-accent mb-4">Enter OpenRouter API Key</h2>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className={`w-full p-3 rounded-lg ${theme === 'dark' ? 'bg-grey-medium text-grey-light' : 'bg-grey-light text-grey-dark'} focus:outline-none focus:ring-2 focus:ring-beige-accent`}
              placeholder="Paste your API key here"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={async () => {
                const isValid = await checkApiKey(apiKey, model);
                if (isValid) saveToStorage('zenbot', { version: 1, apiKey, messages, customModels });
                else setError('Invalid API key.');
                playSound('/click.mp3');
              }}
              className="mt-4 w-full px-6 py-3 bg-beige-accent text-grey-dark rounded-lg"
            >
              Save Key
            </motion.button>
            {error && <p className="mt-2 text-red-400">{error}</p>}
          </motion.div>
        )}
        {apiKey && (
          <>
            <motion.div
              className={`flex justify-between items-center p-4 ${theme === 'dark' ? 'glass-effect' : 'glass-effect-light'}`}
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-3xl font-bold text-beige-accent">ZenBotTX9000</h1>
              <div className="flex space-x-4">
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={toggleTheme} className="text-beige-accent">
                  {theme === 'dark' ? <FaSun size={24} /> : <FaMoon size={24} />}
                </motion.button>
                <motion.button whileHover={{ rotate: 90, scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setShowSidebar(true)} className="text-beige-accent">
                  <FaCog size={28} />
                </motion.button>
              </div>
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
                  <ChatMessageComponent key={index} message={msg} onCopy={handleCopy} theme={theme} />
                ))}
                {isStreaming && <TypingIndicator theme={theme} />}
                <div id="chat-bottom" />
              </AnimatePresence>
            </motion.div>
            <motion.div
              className={`p-4 ${theme === 'dark' ? 'glass-effect' : 'glass-effect-light'} flex items-center space-x-2`}
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                className={`flex-grow p-3 rounded-lg ${theme === 'dark' ? 'bg-grey-medium text-grey-light' : 'bg-grey-light text-grey-dark'} focus:outline-none focus:ring-2 focus:ring-beige-accent`}
                placeholder="Type your message..."
                disabled={isStreaming && !isPaused}
              />
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleSend} className="p-3 bg-beige-accent text-grey-dark rounded-lg">
                Send
              </motion.button>
              {isStreaming && (
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={togglePause} className="p-3 bg-grey-medium text-beige-accent rounded-lg">
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