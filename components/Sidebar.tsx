import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaTrash } from 'react-icons/fa';
import { useState, useCallback } from 'react';
import { fetchModels } from '@utils/api';

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
  apiKey: string;
  setApiKey: (key: string) => void;
  clearChat: () => void;
  soundVolume: number;
  setSoundVolume: (volume: number) => void;
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
  soundVolume,
  setSoundVolume,
}: SidebarProps) {
  const [newModel, setNewModel] = useState('');
  const [suggestedModels, setSuggestedModels] = useState<string[]>([]);
  const [error, setError] = useState('');

  const handleFetchModels = useCallback(async () => {
    const models = await fetchModels(apiKey);
    setSuggestedModels(models);
  }, [apiKey]);

  const addCustomModel = useCallback(() => {
    if (newModel && !customModels.includes(newModel)) {
      setCustomModels([...customModels, newModel]);
      setNewModel('');
    }
  }, [newModel, customModels, setCustomModels]);

  const handleApiKeySave = useCallback(async () => {
    const isValid = await checkApiKey(apiKey, model);
    if (!isValid) {
      setError('Invalid API key or model unavailable.');
      return;
    }
    setError('');
    localStorage.setItem('openRouterApiKey', apiKey);
  }, [apiKey, model]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ duration: 0.3 }}
          className="sidebar fixed top-0 left-0 h-full z-50 md:static"
          role="complementary"
          aria-label="Settings sidebar"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-beige-accent text-xl">Settings</h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="text-beige-accent"
              aria-label="Close sidebar"
            >
              <FaTimes size={24} />
            </motion.button>
          </div>
          <div className="mb-4">
            <label className="block text-grey-light">API Key</label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-2 rounded bg-grey-medium text-grey-light"
              placeholder="Paste your OpenRouter API key"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleApiKeySave}
              className="mt-2 px-4 py-2 bg-beige-accent text-grey-dark rounded"
            >
              Save Key
            </motion.button>
            {error && <p className="text-red-400 mt-2">{error}</p>}
            <p className="text-sm text-grey-light mt-1">
              Get your key from{' '}
              <a href="https://openrouter.ai" target="_blank" className="text-beige-accent underline">
                OpenRouter.ai
              </a>
            </p>
          </div>
          <div className="mb-4">
            <label className="block text-grey-light">Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full p-2 rounded bg-grey-medium text-grey-light"
            >
              <option value="deepseek-r1:0528">DeepSeek-R1 (0528)</option>
              {customModels.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
              {suggestedModels.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleFetchModels}
              className="mt-2 px-4 py-2 bg-beige-accent text-grey-dark rounded"
            >
              Fetch Free Models
            </motion.button>
          </div>
          <div className="mb-4">
            <label className="block text-grey-light">Add Custom Model</label>
            <input
              type="text"
              value={newModel}
              onChange={(e) => setNewModel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomModel()}
              className="w-full p-2 rounded bg-grey-medium text-grey-light"
              placeholder="e.g., provider/model:version"
            />
            <p className="text-sm text-grey-light mt-1">
              Find models at{' '}
              <a
                href="https://openrouter.ai/models?max_price=0"
                target="_blank"
                className="text-beige-accent underline"
              >
                OpenRouter Free Models
              </a>
            </p>
          </div>
          <div className="mb-4">
            <label className="block text-grey-light">System Prompt</label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full p-2 rounded bg-grey-medium text-grey-light"
              rows={3}
            />
          </div>
          <div className="mb-4">
            <label className="block text-grey-light">Max Tokens</label>
            <input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(Number(e.target.value))}
              className="w-full p-2 rounded bg-grey-medium text-grey-light"
              min={100}
              max={16384}
            />
          </div>
          <div className="mb-4">
            <label className="block text-grey-light">Sound Volume</label>
            <input
              type="range"
              value={soundVolume}
              onChange={(e) => setSoundVolume(Number(e.target.value))}
              className="w-full"
              min={0}
              max={1}
              step={0.1}
            />
          </div>
          <div className="mb-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (confirm('Clear chat history?')) clearChat();
              }}
              className="px-4 py-2 bg-red-600 text-grey-light rounded"
            >
              <FaTrash className="inline mr-2" /> Clear Chat
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}