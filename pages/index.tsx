import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCog, FaPause, FaPlay, FaMoon, FaSun } from 'react-icons/fa';
import { scroller } from 'react-scroll';
import { saveToStorage, loadFromStorage, ChatMessage } from '../utils/storage'; // Removed clearStorage
import { streamResponse, checkApiKey } from '../utils/api';
import ChatMessageComponent from '../components/ChatMessage';
import Sidebar from '../components/Sidebar';

const TypingIndicator = () => (
  <motion.div
    className="flex space-x-1.5 p-3"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    role="status" // Added role
    aria-label="Assistant is typing..." // Added aria-label
  >
    <motion.div className="w-2 h-2 bg-accent-light dark:bg-accent-dark rounded-full animate-pulse" />
    <motion.div className="w-2 h-2 bg-accent-light dark:bg-accent-dark rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
    <motion.div className="w-2 h-2 bg-accent-light dark:bg-accent-dark rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
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
  const [error, setError] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [persistedSuggestedModels, setPersistedSuggestedModels] = useState<string[]>([]);
  const [isVerifyingApiKey, setIsVerifyingApiKey] = useState(false); // New state for initial setup
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = loadFromStorage('zenbot');
    if (stored) {
      setApiKey(stored.apiKey || '');
      setMessages(stored.messages || []);
      setCustomModels(stored.customModels || []);
      setModel(stored.selectedModel || 'deepseek-r1:0528');
      setSystemPrompt(stored.systemPrompt || 'You are a helpful assistant.');
      setMaxTokens(stored.maxTokens || 4096);
      setTheme(stored.theme || 'dark');
      setPersistedSuggestedModels(stored.suggestedModels || []);
    } else {
      setMessages([{ role: 'assistant', content: 'Welcome to ZenBotTX9000! Enter your OpenRouter API key to start chatting. Get your free key from [OpenRouter.ai](https://openrouter.ai).', type: 'response' }]);
    }
  }, []);

  const saveAppData = useCallback(() => {
    saveToStorage('zenbot', {
      version: 2,
      apiKey,
      messages,
      customModels,
      selectedModel: model,
      systemPrompt,
      maxTokens,
      theme,
      suggestedModels: persistedSuggestedModels,
      migratedToV2: true,
    });
    if (messages.length > 0) { // Only scroll if there are messages
      scroller.scrollTo('chat-bottom', { containerId: 'chat-container', smooth: true, duration: 300 });
    }
  }, [apiKey, messages, customModels, model, systemPrompt, maxTokens, theme, persistedSuggestedModels]);

  useEffect(() => {
    saveAppData();
  }, [saveAppData]);

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
  }, [apiKey, model, messages, systemPrompt, maxTokens, input]);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
    if (!isPaused) abortControllerRef.current?.abort();
  }, [isPaused]);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const handleFetchedModelsSave = useCallback((models: string[]) => {
    setPersistedSuggestedModels(models);
    // saveAppData will be called by the useEffect hook due to persistedSuggestedModels change
  }, []);

  // Update setCustomModels to use saveAppData
  const handleSetCustomModels = useCallback((newCustomModels: string[]) => {
    setCustomModels(newCustomModels);
    // saveAppData will be called by the useEffect hook due to customModels change
  }, []);

  // Update setApiKey to use saveAppData
  const handleSetApiKey = useCallback((newApiKey: string) => {
    setApiKey(newApiKey);
     // saveAppData will be called by the useEffect hook due to apiKey change
  }, []);

  useEffect(() => {
    // Apply theme class to body for Tailwind dark mode
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    // Removed ${theme} class, Tailwind handles dark mode via 'dark' class on <html>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark"
    >
      <Sidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        model={model}
        setModel={setModel}
        customModels={customModels}
        setCustomModels={handleSetCustomModels} // Use updated setter
        systemPrompt={systemPrompt}
        setSystemPrompt={setSystemPrompt}
        maxTokens={maxTokens}
        setMaxTokens={setMaxTokens}
        apiKey={apiKey}
        setApiKey={handleSetApiKey} // Use updated setter
        clearChat={() => {
          setMessages([]);
          // saveAppData will be called by useEffect due to messages change
        }}
        theme={theme}
        toggleTheme={toggleTheme}
        persistedSuggestedModels={persistedSuggestedModels}
        onFetchedModelsSave={handleFetchedModelsSave}
        // Pass theme explicitly if Sidebar needs it for internal logic not covered by Tailwind dark:
        // For now, assuming Sidebar also uses Tailwind dark: variants based on html class
      />
      <motion.div
        className="flex-1 flex flex-col w-full p-2 sm:p-4 md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto" // Responsive padding and max-width
        // Main content area animation can be part of the overall page load or slightly delayed
        // For now, inheriting parent's y:20 to y:0, no separate opacity/delay here to keep it simple
      >
        {!apiKey && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, delay: 0.1 }} // Added delay for API key section
            className="p-4 sm:p-6 bg-card-bg-light dark:bg-card-bg-dark backdrop-blur-md shadow-xl rounded-xl border border-border-light dark:border-border-dark"
          >
            <h2 className="text-xl sm:text-2xl font-semibold text-accent-light dark:text-accent-dark mb-4">Enter OpenRouter API Key</h2>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-3 rounded-lg bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark outline-none border border-border-light dark:border-border-dark"
              placeholder="Paste your API key here"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isVerifyingApiKey}
              onClick={async () => {
                setIsVerifyingApiKey(true);
                setError('');
                try {
                  const isValid = await checkApiKey(apiKey, model);
                  if (isValid) {
                    saveAppData(); // This will also save the apiKey
                  } else {
                    setError('Invalid API key. Please check and try again.');
                  }
                } catch (e) {
                  setError('Failed to verify API key. Check your connection.');
                } finally {
                  setIsVerifyingApiKey(false);
                }
              }}
              className="mt-4 w-full px-4 py-3 bg-accent-light dark:bg-accent-dark text-text-primary-dark dark:text-text-primary-light rounded-lg font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark focus:ring-offset-2 dark:focus:ring-offset-background-dark flex items-center justify-center disabled:opacity-70"
            >
              {isVerifyingApiKey ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-text-primary-dark dark:border-text-primary-light mr-3"></div>
                  Verifying...
                </>
              ) : (
                'Save Key'
              )}
            </motion.button>
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                  className="mt-2 text-red-500 dark:text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
        {apiKey && (
          <>
            {/* Header */}
            <motion.div
              className="flex justify-between items-center p-3 sm:p-4 bg-card-bg-light dark:bg-card-bg-dark backdrop-blur-md shadow-lg rounded-xl border border-border-light dark:border-border-dark sticky top-2 sm:top-4 z-10 mb-2 sm:mb-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }} // Refined Header animation
            >
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-accent-light dark:text-accent-dark">ZenBotTX9000</h1>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <motion.button
                  whileHover={{ scale: 1.1, rotate: theme === 'dark' ? -10 : 10 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleTheme}
                  className="p-2 rounded-full text-accent-light dark:text-accent-dark hover:bg-background-light dark:hover:bg-border-dark focus:outline-none focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? <FaSun size={20} /> : <FaMoon size={20} />}
                </motion.button>
                <motion.button
                  whileHover={{ rotate: 90, scale: 1.1 }} // Cog already has rotate: 90
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowSidebar(true)}
                  className="p-2 rounded-full text-accent-light dark:text-accent-dark hover:bg-background-light dark:hover:bg-border-dark focus:outline-none focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark"
                  aria-label="Settings"
                >
                  <FaCog size={22} />
                </motion.button>
              </div>
            </motion.div>

            {/* Chat Container */}
            <motion.div
              ref={chatContainerRef}
              id="chat-container"
              className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'spring', stiffness: 100, delay: 0.1 }}
              role="log" // Added role
              aria-live="polite" // Added aria-live
            >
              <AnimatePresence>
                {messages.map((msg, index) => (
                  <ChatMessageComponent key={index} message={msg} onCopy={handleCopy} theme={theme} />
                ))}
                {isStreaming && <TypingIndicator />}
                <div id="chat-bottom" />
              </AnimatePresence>
            </motion.div>

            {/* Input Area */}
            <motion.div
              className="p-3 sm:p-4 mt-2 sm:mt-4 bg-card-bg-light dark:bg-card-bg-dark backdrop-blur-md shadow-xl rounded-xl border border-border-light dark:border-border-dark flex items-center space-x-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut", delay: 0.2 }}
              role="form" // Added role for the input area
              aria-label="Message input form"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isStreaming && handleSend()}
                className="flex-grow p-3 rounded-lg bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark outline-none border border-border-light dark:border-border-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark"
                placeholder="Type your message..."
                disabled={isStreaming && !isPaused}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={isStreaming && !isPaused}
                className="p-3 bg-accent-light dark:bg-accent-dark text-text-primary-dark dark:text-text-primary-light rounded-lg font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark focus:ring-offset-2 dark:focus:ring-offset-background-dark disabled:opacity-50"
              >
                Send
              </motion.button>
              {isStreaming && (
                <motion.button
                  whileHover={{ scale: 1.1, rotate: isPaused ? 0 : 5 }} // Rotate only if it's a pause icon
                  whileTap={{ scale: 0.9 }}
                  onClick={togglePause}
                  className="p-3 bg-background-light dark:bg-border-dark text-accent-light dark:text-accent-dark rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark focus:ring-offset-2 dark:focus:ring-offset-background-dark"
                  aria-label={isPaused ? "Play" : "Pause"}
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