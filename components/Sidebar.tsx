import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaTrash } from 'react-icons/fa';
import { useState, useCallback } from 'react';
import { fetchModels, checkApiKey } from '../utils/api';
// Removed unused import: import { saveToStorage } from '../utils/storage';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  model: string;
  setModel: (model: string) => void;
  customModels: string[];
  setCustomModels: (models: string[]) => void;
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  maxTokens: number;
  setMaxTokens: (tokens: number) => void;
  apiKey: string; // Still needed for checkApiKey
  setApiKey: (key: string) => void;
  clearChat: () => void;
  // Add new props for persisted suggested models
  persistedSuggestedModels: string[];
  onFetchedModelsSave: (models: string[]) => void;
  // theme prop is removed as Tailwind dark: variants are used based on html class
  // toggleTheme prop is removed as it's not used by Sidebar
}

export default function Sidebar({
  isOpen,
  onClose,
  model,
  setModel,
  customModels,
  setCustomModels,
  systemPrompt,
  setSystemPrompt,
  maxTokens,
  setMaxTokens,
  apiKey,
  setApiKey,
  clearChat,
  persistedSuggestedModels,
  onFetchedModelsSave,
}: SidebarProps) {
  const [newModel, setNewModel] = useState('');
  const [error, setError] = useState('');
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false); // New state for Sidebar

  const handleFetchModels = useCallback(async () => {
    if (!apiKey) {
      setError("Please enter an API key first to fetch models.");
      return;
    }
    setIsFetchingModels(true);
    setError('');
    try {
      const models = await fetchModels(apiKey);
      onFetchedModelsSave(models); // Save fetched models to parent state
    } catch (e: any) {
      setError(`Failed to fetch models: ${e.message}`);
    } finally {
      setIsFetchingModels(false);
    }
  }, [apiKey, onFetchedModelsSave]);

  const addCustomModel = useCallback(() => {
    if (newModel && !customModels.includes(newModel)) {
      const updatedModels = [...customModels, newModel];
      setCustomModels(updatedModels); // Update state in parent
      setNewModel('');
    }
  }, [newModel, customModels, setCustomModels]);

  const handleApiKeySave = useCallback(async () => {
    setIsSavingKey(true);
    setError('');
    try {
      const isValid = await checkApiKey(apiKey, model);
      if (!isValid) {
        setError('Invalid API key or model unavailable. Visit https://openrouter.ai to get a valid key.');
      } else {
        setError(''); // Clear error on successful save implicitly by parent
        // Actual saving (setApiKey which triggers saveAppData) is handled by parent.
        // We just need to show feedback here.
      }
    } catch (e) {
      setError('Failed to verify API key. Check your connection.');
    } finally {
      setIsSavingKey(false);
    }
  }, [apiKey, model, setApiKey]); // setApiKey is part of SidebarProps, not the state setter from Home

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          // Added responsive width, background, border, shadow, and padding
          className="fixed top-0 left-0 h-full z-50 w-full sm:w-3/4 md:w-96
                     bg-card-bg-light dark:bg-card-bg-dark
                     backdrop-blur-lg shadow-2xl
                     border-r border-border-light dark:border-border-dark
                     p-4 sm:p-6 overflow-y-auto flex flex-col"
          role="complementary"
          aria-label="Settings sidebar"
        >
          {/* Header for Sidebar */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-accent-light dark:text-accent-dark">Settings</h2>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 rounded-full text-text-secondary-light dark:text-text-secondary-dark hover:bg-border-light dark:hover:bg-border-dark focus:outline-none focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark"
              aria-label="Close sidebar"
            >
              <FaTimes size={20} />
            </motion.button>
          </div>

          {/* Form Elements Section */}
          <div className="space-y-6 flex-grow">
            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">API Key</label>
              <input
                type="password" // Changed to password for better security practice
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full p-3 rounded-lg bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark outline-none border border-border-light dark:border-border-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark"
                placeholder="Paste your OpenRouter API key"
                aria-label="API key input"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleApiKeySave}
                disabled={isSavingKey}
                className="mt-2 w-full px-4 py-2.5 bg-accent-light dark:bg-accent-dark text-text-primary-dark dark:text-text-primary-light rounded-lg font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark focus:ring-offset-2 dark:focus:ring-offset-background-dark flex items-center justify-center disabled:opacity-70"
                aria-label="Save API key"
              >
                {isSavingKey ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-text-primary-dark dark:border-text-primary-light mr-3"></div>
                    Saving...
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
                    className="mt-2 text-sm text-red-600 dark:text-red-400"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
              <p className="mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                Get your key from{' '}
                <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-accent-light dark:text-accent-dark hover:underline">
                  OpenRouter.ai
                </a>
              </p>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full p-3 rounded-lg bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark outline-none border border-border-light dark:border-border-dark"
                aria-label="Select model"
              >
                {/* Consider a default placeholder option if needed */}
                <option value="deepseek-r1:0528">DeepSeek-R1 (0528)</option>
                {customModels.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
                {persistedSuggestedModels.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleFetchModels}
                className="mt-2 w-full px-4 py-2.5 bg-accent-light dark:bg-accent-dark text-text-primary-dark dark:text-text-primary-light rounded-lg font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark focus:ring-offset-2 dark:focus:ring-offset-background-dark disabled:opacity-70"
                disabled={isFetchingModels}
                aria-label="Fetch free models"
              >
                {isFetchingModels ? 'Fetching...' : 'Fetch/Refresh Models'}
              </motion.button>
            </div>

            {/* Add Custom Model */}
            <div>
              <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">Add Custom Model</label>
              <input
                type="text"
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomModel()}
                className="w-full p-3 rounded-lg bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark outline-none border border-border-light dark:border-border-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark"
                placeholder="e.g., provider/model:version"
                aria-label="Add custom model"
              />
               <p className="mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                Press Enter to add. Find models at{' '}
                <a
                  href="https://openrouter.ai/models"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-light dark:text-accent-dark hover:underline"
                >
                  OpenRouter Models
                </a>
              </p>
            </div>

            {/* System Prompt */}
            <div>
              <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">System Prompt</label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full p-3 rounded-lg bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark outline-none border border-border-light dark:border-border-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark"
                rows={4}
                aria-label="System prompt"
              />
            </div>

            {/* Max Tokens */}
            <div>
              <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">Max Tokens</label>
              <input
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(Number(e.target.value))}
                className="w-full p-3 rounded-lg bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark outline-none border border-border-light dark:border-border-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark"
                min={100}
                max={16384} // Consider model specific limits if known
                step={128}
                aria-label="Max tokens"
              />
            </div>
          </div>

          {/* Footer Actions - Clear Chat */}
          <div className="mt-auto pt-6"> {/* Pushes to bottom */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) clearChat();
              }}
              className="w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-600 focus:ring-offset-2 dark:focus:ring-offset-background-dark"
              aria-label="Clear chat history"
            >
              <FaTrash className="inline mr-2 -mt-0.5" /> Clear Chat History
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}