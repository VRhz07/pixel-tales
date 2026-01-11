import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit2, Filter, AlertCircle, Check, X, Upload, Download } from 'lucide-react';
import profanityService, { ProfanityWord, ProfanityStats } from '../../services/profanity.service';
import { useThemeStore } from '../../stores/themeStore';
import { refreshProfanityWords } from '../../utils/profanityFilter';

interface ProfanityManagementProps {
  onClose?: () => void;
}

export default function ProfanityManagement({ onClose }: ProfanityManagementProps) {
  const { isDarkMode } = useThemeStore();
  const [words, setWords] = useState<ProfanityWord[]>([]);
  const [stats, setStats] = useState<ProfanityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Add/Edit modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWord, setEditingWord] = useState<ProfanityWord | null>(null);
  const [formData, setFormData] = useState({
    word: '',
    language: 'en' as 'en' | 'tl' | 'both',
    severity: 'moderate' as 'mild' | 'moderate' | 'severe',
    is_active: true,
  });
  
  // Bulk add modal state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkWords, setBulkWords] = useState('');
  const [bulkLanguage, setBulkLanguage] = useState<'en' | 'tl' | 'both'>('en');
  const [bulkSeverity, setBulkSeverity] = useState<'mild' | 'moderate' | 'severe'>('moderate');

  useEffect(() => {
    loadWords();
    loadStats();
  }, [searchQuery, languageFilter, severityFilter, currentPage]);

  const loadWords = async () => {
    try {
      setLoading(true);
      const { words: wordsData, pagination } = await profanityService.getProfanityWords({
        search: searchQuery || undefined,
        language: languageFilter === 'all' ? undefined : languageFilter,
        severity: severityFilter === 'all' ? undefined : severityFilter,
        page: currentPage,
        page_size: 10,
      });
      setWords(wordsData);
      setTotalPages(pagination.total_pages);
      setError(null);
    } catch (err: any) {
      console.error('Error loading profanity words:', err);
      setError(err.response?.data?.error || 'Failed to load profanity words');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await profanityService.getProfanityStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleAddWord = async () => {
    try {
      if (!formData.word.trim()) {
        alert('Please enter a word');
        return;
      }
      
      await profanityService.addProfanityWord(formData);
      
      // Refresh profanity filter in child apps
      await refreshProfanityWords();
      
      setShowAddModal(false);
      setFormData({ word: '', language: 'en', severity: 'moderate', is_active: true });
      loadWords();
      loadStats();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add word');
    }
  };

  const handleEditWord = async () => {
    try {
      if (!editingWord) return;
      
      await profanityService.updateProfanityWord(editingWord.id, formData);
      
      // Refresh profanity filter in child apps
      await refreshProfanityWords();
      
      setEditingWord(null);
      setFormData({ word: '', language: 'en', severity: 'moderate', is_active: true });
      loadWords();
      loadStats();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update word');
    }
  };

  const handleDeleteWord = async (wordId: number, word: string) => {
    if (!confirm(`Are you sure you want to delete "${word}"?`)) return;
    
    try {
      await profanityService.deleteProfanityWord(wordId);
      
      // Refresh profanity filter in child apps
      await refreshProfanityWords();
      
      loadWords();
      loadStats();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete word');
    }
  };

  const handleBulkAdd = async () => {
    try {
      if (!bulkWords.trim()) {
        alert('Please enter words to add');
        return;
      }
      
      const wordsList = bulkWords
        .split('\n')
        .map(w => w.trim())
        .filter(w => w.length > 0);
      
      if (wordsList.length === 0) {
        alert('No valid words to add');
        return;
      }
      
      const result = await profanityService.bulkAddProfanityWords({
        words: wordsList,
        language: bulkLanguage,
        severity: bulkSeverity,
      });
      
      // Refresh profanity filter in child apps
      await refreshProfanityWords();
      
      alert(`Bulk add completed!\nAdded: ${result.added_count}\nSkipped: ${result.skipped_count}`);
      setShowBulkModal(false);
      setBulkWords('');
      loadWords();
      loadStats();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to bulk add words');
    }
  };

  const handleImportFromFile = async () => {
    if (!confirm('Import profanity words from the export file? This will add any missing words from the repository.')) {
      return;
    }
    
    try {
      setLoading(true);
      const result = await profanityService.importProfanityWordsFromFile();
      // Refresh profanity filter in child apps
      await refreshProfanityWords();
      
      alert(
        `Import completed successfully!\n\n` +
        `✅ Added: ${result.added} new words\n` +
        `🔄 Updated: ${result.updated} words\n` +
        `⏭️ Skipped: ${result.skipped} words (already up to date)\n` +
        `📊 Total in database: ${result.total_in_database} words`
      );
      loadWords();
      loadStats();
    } catch (err: any) {
      console.error('Import error:', err);
      alert(err.response?.data?.error || 'Failed to import profanity words. Make sure the export file exists in the repository.');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (word: ProfanityWord) => {
    setEditingWord(word);
    setFormData({
      word: word.word,
      language: word.language,
      severity: word.severity,
      is_active: word.is_active,
    });
  };

  return (
    <div className={`profanity-management ${isDarkMode ? 'dark' : ''}`}>
      {/* Header */}
      <div className="profanity-header">
        <div>
          <h2>Profanity Word Management</h2>
          <p>Manage inappropriate words filtered in the app</p>
        </div>
        <div className="profanity-header-actions">
          <button onClick={() => setShowBulkModal(true)} className="btn-secondary">
            <Upload size={18} />
            Bulk Add
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            <Plus size={18} />
            Add Word
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="profanity-stats">
          <div className="stat-card">
            <h3>{stats.total_words}</h3>
            <p>Total Words</p>
          </div>
          <div className="stat-card">
            <h3>{stats.active_words}</h3>
            <p>Active</p>
          </div>
          <div className="stat-card">
            <h3>{stats.by_language.english}</h3>
            <p>English</p>
          </div>
          <div className="stat-card">
            <h3>{stats.by_language.tagalog}</h3>
            <p>Tagalog</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="profanity-filters">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search words..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)}>
          <option value="all">All Languages</option>
          <option value="en">English</option>
          <option value="tl">Tagalog</option>
          <option value="both">Both</option>
        </select>
        <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
          <option value="all">All Severities</option>
          <option value="mild">Mild</option>
          <option value="moderate">Moderate</option>
          <option value="severe">Severe</option>
        </select>
      </div>

      {/* Words List */}
      {loading ? (
        <div className="loading-state">Loading...</div>
      ) : error ? (
        <div className="error-state">
          <AlertCircle size={24} />
          <p>{error}</p>
        </div>
      ) : words.length === 0 ? (
        <div className="empty-state">
          <p>No profanity words found</p>
        </div>
      ) : (
        <div className="profanity-list">
          <table>
            <thead>
              <tr>
                <th>Word</th>
                <th>Language</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {words.map((word) => (
                <tr key={word.id}>
                  <td><strong>{word.word}</strong></td>
                  <td>{word.language_display}</td>
                  <td>
                    <span className={`severity-badge severity-${word.severity}`}>
                      {word.severity_display}
                    </span>
                  </td>
                  <td>
                    {word.is_active ? (
                      <span className="status-active">Active</span>
                    ) : (
                      <span className="status-inactive">Inactive</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => openEditModal(word)}
                        className="btn-icon"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteWord(word.id, word.word)}
                        className="btn-icon btn-danger"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingWord) && (
        <div className={`modal-overlay ${isDarkMode ? 'dark' : ''}`} onClick={() => {
          setShowAddModal(false);
          setEditingWord(null);
          setFormData({ word: '', language: 'en', severity: 'moderate', is_active: true });
        }}>
          <div className={`modal-content ${isDarkMode ? 'dark' : ''}`} onClick={(e) => e.stopPropagation()}>
            <h3>{editingWord ? 'Edit Word' : 'Add New Word'}</h3>
            
            <div className="form-group">
              <label>Word *</label>
              <input
                type="text"
                value={formData.word}
                onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                placeholder="Enter word..."
              />
            </div>

            <div className="form-group">
              <label>Language *</label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value as any })}
              >
                <option value="en">English</option>
                <option value="tl">Tagalog</option>
                <option value="both">Both</option>
              </select>
            </div>

            <div className="form-group">
              <label>Severity *</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
              >
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
            </div>

            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                Active
              </label>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingWord(null);
                  setFormData({ word: '', language: 'en', severity: 'moderate', is_active: true });
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={editingWord ? handleEditWord : handleAddWord}
                className="btn-primary"
              >
                {editingWord ? 'Update' : 'Add'} Word
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Add Modal */}
      {showBulkModal && (
        <div className={`modal-overlay ${isDarkMode ? 'dark' : ''}`} onClick={() => setShowBulkModal(false)}>
          <div className={`modal-content modal-large ${isDarkMode ? 'dark' : ''}`} onClick={(e) => e.stopPropagation()}>
            <h3>Bulk Add Words</h3>
            <p>Enter one word per line</p>
            
            <div className="form-group">
              <label>Words (one per line) *</label>
              <textarea
                value={bulkWords}
                onChange={(e) => setBulkWords(e.target.value)}
                placeholder="word1&#10;word2&#10;word3"
                rows={10}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Language *</label>
                <select
                  value={bulkLanguage}
                  onChange={(e) => setBulkLanguage(e.target.value as any)}
                >
                  <option value="en">English</option>
                  <option value="tl">Tagalog</option>
                  <option value="both">Both</option>
                </select>
              </div>

              <div className="form-group">
                <label>Severity *</label>
                <select
                  value={bulkSeverity}
                  onChange={(e) => setBulkSeverity(e.target.value as any)}
                >
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowBulkModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleBulkAdd} className="btn-primary">
                Add Words
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
