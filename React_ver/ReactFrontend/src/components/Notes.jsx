import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import logToFile from '../utils/logger';

// Move these component definitions to the top level, before Notes component
const DeleteConfirmationModal = ({ category, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Category</h3>
      <p className="text-gray-600 mb-6">
        Are you sure you want to delete {category} and all its associated notes? This action cannot be undone.
      </p>
      <div className="flex justify-end gap-3">
        <button
          className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg border border-gray-300 hover:bg-gray-50"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          onClick={onConfirm}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

const DeleteNoteModal = ({ onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Note</h3>
      <p className="text-gray-600 mb-6">
        Are you sure you want to delete this note? This action cannot be undone.
      </p>
      <div className="flex justify-end gap-3">
        <button
          className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg border border-gray-300 hover:bg-gray-50"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          onClick={onConfirm}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

function Notes({ videoPausedAt, onSeekToTime }) {
  const [notes, setNotes] = useState(() => {
    const savedNotes = localStorage.getItem('userNotes');
    return savedNotes ? JSON.parse(savedNotes) : [];
  });
  
  const [categories, setCategories] = useState(() => {
    const savedCategories = localStorage.getItem('noteCategories');
    return savedCategories ? JSON.parse(savedCategories) : ['General'];
  });
  
  const [selectedFilters, setSelectedFilters] = useState(() => {
    const savedFilters = localStorage.getItem('noteFilters');
    return savedFilters ? JSON.parse(savedFilters) : ['General'];
  });

  const [noteText, setNoteText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryText, setEditCategoryText] = useState('');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [showDeleteNoteModal, setShowDeleteNoteModal] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [currentWord, setCurrentWord] = useState('');

  /**
   * A ref to remember which category filter action just happened,
   * so we can log it in a useEffect.
   */
  const lastFilterActionRef = useRef(null);

  const handleNoteTextChange = (e) => {
    const newValue = e.target.value;
    setNoteText(newValue);

    if (newValue.endsWith(' ') && currentWord.trim()) {
      logToFile('Notes', 'Text Input', `Completed word: ${currentWord.trim()}`);
      setCurrentWord('');
    } else {
      setCurrentWord(newValue);
    }
  };

  const handleAddNote = () => {
    if (noteText.trim() && selectedCategory) {
      const newNote = {
        text: noteText.trim(),
        timestamp: formatTime(videoPausedAt),
        timeInSeconds: videoPausedAt,
        category: selectedCategory,
      };

      setNotes([...notes, newNote]);
      setNoteText('');
      setSelectedCategory('General');
      
      logToFile('Notes', 'Add Note', `Added note: ${newNote.text}`);
    }
  };

  const handleNewCategory = () => {
    const trimmedCategory = newCategoryInput.trim();
    if (trimmedCategory && !categories.includes(trimmedCategory)) {
      const updatedCategories = [...categories, trimmedCategory];
      setCategories(updatedCategories);
      setSelectedCategory(trimmedCategory);
      setNewCategoryInput('');
      setAddingCategory(false);
      setIsDropdownOpen(false);

      // Update selected filters to include all categories (including the new one)
      setSelectedFilters(updatedCategories);

      logToFile('Notes', 'Add Category', `Added new category: ${trimmedCategory}`);
    }
  };

  const handleCategoryKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNewCategory();
    }
  };

  const handleEditCategory = (oldCategory, newCategory) => {
    const trimmedCategory = newCategory.trim();
    if (trimmedCategory && (trimmedCategory === oldCategory || !categories.includes(trimmedCategory))) {
      if (trimmedCategory !== oldCategory) {
        setCategories(categories.map(cat => cat === oldCategory ? trimmedCategory : cat));
        if (selectedCategory === oldCategory) {
          setSelectedCategory(trimmedCategory);
        }
        setNotes(notes.map(note => 
          note.category === oldCategory ? { ...note, category: trimmedCategory } : note
        ));

        // Log the category name change
        logToFile('Notes', 'Edit Category', `Changed category name from ${oldCategory} to ${trimmedCategory}`);
      }
      setEditingCategory(null);
      setEditCategoryText('');
    }
  };

  const handleEditCategoryKeyPress = (e, category) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEditCategory(category, editCategoryText);
    }
  };

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const getFilteredNotes = () => {
    return notes.filter(note => selectedFilters.includes(note.category));
  };

  const handleDeleteCategory = (categoryToDelete) => {
    if (categoryToDelete === 'General') return; // Prevent deleting the General category
    
    // Remove the category from categories
    setCategories(categories.filter(cat => cat !== categoryToDelete));
    
    // Remove the category from selected filters
    setSelectedFilters(selectedFilters.filter(cat => cat !== categoryToDelete));
    
    // Delete all notes with this category
    setNotes(notes.filter(note => note.category !== categoryToDelete));
    
    // If the deleted category was selected, switch to General
    if (selectedCategory === categoryToDelete) {
      setSelectedCategory('General');
    }
    
    setIsDropdownOpen(false);

    // Log the deletion of the category
    logToFile('Notes', 'Delete Category', `Deleted category: ${categoryToDelete}`);
  };

  const handleDeleteNote = (noteToDelete) => {
    setNotes(notes.filter(note => note !== noteToDelete));
    logToFile('Notes', 'Delete Note', `Deleted note: ${noteToDelete.text}`);
  };

  const handleDownloadNotes = () => {
    const notesContent = notes
      .map(note => `[${note.category}] ${note.text} (${note.timestamp})`)
      .join('\n');
    
    const blob = new Blob([notesContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'video-notes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    logToFile('Notes', 'Download Notes', 'Downloaded notes file');
  };

  /**
   * IMPORTANT CHANGE:
   * Instead of logging directly inside the state update below (which can be
   * called twice in development under React Strict Mode), we only store
   * the action in a ref. We then log it once inside a useEffect.
   */
  const handleCategorySelection = (category) => {
    setSelectedFilters((prev) => {
      const isSelected = prev.includes(category);
      const newFilters = isSelected
        ? prev.filter((cat) => cat !== category)
        : [...prev, category];

      // Store the action for the useEffect to handle
      lastFilterActionRef.current = {
        type: 'categoryToggle',
        category,
        // If it wasn't selected, that means we *just* selected it
        wasSelected: !isSelected,
      };

      return newFilters;
    });
  };

  // Log after selectedFilters changes, using the info stored in lastFilterActionRef
  useEffect(() => {
    if (!lastFilterActionRef.current) return;

    const action = lastFilterActionRef.current;
    if (action.type === 'categoryToggle') {
      if (action.wasSelected) {
        // The category was just selected
        logToFile('Notes', 'Select Category', `Selected category: ${action.category}`);
      } else {
        // The category was just deselected
        logToFile('Notes', 'Deselect Category', `Deselected category: ${action.category}`);
      }
    } else if (action.type === 'selectAll') {
      logToFile('Notes', 'Select All Categories', 'Selected all categories');
    }
    
    // Clear the ref so it doesn't log again
    lastFilterActionRef.current = null;
  }, [selectedFilters]);

  // Add this wrapper function to handle seeking and logging
  const handleSeek = (timeInSeconds) => {
    logToFile('Notes', 'Seek', `Seeked to timestamp: ${formatTime(timeInSeconds)}`);
    onSeekToTime(timeInSeconds);
  };

  // Update the save effects to use a more reliable approach
  useEffect(() => {
    if (notes.length > 0 || localStorage.getItem('userNotes')) {
      localStorage.setItem('userNotes', JSON.stringify(notes));
    }
  }, [notes]);

  useEffect(() => {
    if (categories.length > 0 || localStorage.getItem('noteCategories')) {
      localStorage.setItem('noteCategories', JSON.stringify(categories));
    }
  }, [categories]);

  useEffect(() => {
    if (selectedFilters.length > 0 || localStorage.getItem('noteFilters')) {
      localStorage.setItem('noteFilters', JSON.stringify(selectedFilters));
    }
  }, [selectedFilters]);

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-5 shadow-lg flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2">
          <h2 className="text-xl text-gray-800 border-b-2 border-green-500 pb-1">Notes</h2>
          <button
            onClick={handleDownloadNotes}
            disabled={notes.length === 0}
            className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${
              notes.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Download notes"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75zm-9 13.5a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        <div className="relative">
          <button
            className="border border-gray-300 rounded-lg p-2 bg-white shadow flex items-center gap-2"
            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
          >
            <span>Filter</span>
            <span className="text-sm">
              {selectedFilters.length === categories.length ? 'All' : `(${selectedFilters.length})`}
            </span>
            <span>▼</span>
          </button>
          {isFilterDropdownOpen && (
            <div className="absolute top-full right-0 w-[200px] border border-gray-300 rounded-lg bg-white shadow mt-1 z-10 max-h-[200px] overflow-y-auto">
              {/* Show All Option */}
              <div
                className="p-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2 border-b border-gray-200"
                onClick={() => {
                  // If not all are selected, then "Select All"
                  if (selectedFilters.length !== categories.length) {
                    setSelectedFilters([...categories]);
                    // Log after effect
                    lastFilterActionRef.current = { type: 'selectAll' };
                  }
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedFilters.length === categories.length}
                  onChange={() => {}}
                  className="h-4 w-4"
                />
                <span>Show All</span>
              </div>
              {categories.map((category, index) => (
                <div
                  key={index}
                  className="p-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                  onClick={() => handleCategorySelection(category)}
                >
                  <input
                    type="checkbox"
                    checked={selectedFilters.includes(category)}
                    onChange={() => {}}
                    className="h-4 w-4"
                  />
                  <span>{category}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center mb-4 gap-2">
        {/* Category Dropdown */}
        <div className="relative">
          <button
            className="border border-gray-300 rounded-lg p-2 bg-white shadow flex items-center min-w-[120px] justify-between"
            onClick={() => {
              setIsDropdownOpen((prev) => !prev);
              if (isDropdownOpen) {
                setAddingCategory(false);
                setNewCategoryInput('');
                setEditingCategory(null);
                setEditCategoryText('');
              }
            }}
          >
            <span className="truncate">{selectedCategory}</span>
            <span className="ml-2">▼</span>
          </button>
          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 w-[200px] border border-gray-300 rounded-lg bg-white shadow mt-1 z-10 max-h-[200px] overflow-y-auto">
              {categories.map((category, index) => (
                <div
                  key={index}
                  className="p-2 hover:bg-gray-100 cursor-pointer truncate flex items-center justify-between"
                >
                  {editingCategory === category ? (
                    <div className="flex items-center w-full">
                      <input
                        type="text"
                        className="border border-gray-300 rounded-lg p-1 w-full mr-2"
                        value={editCategoryText}
                        onChange={(e) => setEditCategoryText(e.target.value)}
                        onKeyPress={(e) => handleEditCategoryKeyPress(e, category)}
                        autoFocus
                      />
                      <button
                        className="text-green-500 hover:text-green-600 flex-shrink-0"
                        onClick={() => handleEditCategory(category, editCategoryText)}
                        title="Save"
                      >
                        ✓
                      </button>
                      <button
                        className="text-red-600 hover:text-red-700 ml-2 flex-shrink-0"
                        onClick={() => {
                          setEditingCategory(null);
                          setEditCategoryText('');
                        }}
                        title="Cancel"
                      >
                        x
                      </button>
                    </div>
                  ) : (
                    <>
                      <span
                        className="flex-grow"
                        onClick={() => {
                          setSelectedCategory(category);
                          setIsDropdownOpen(false);
                        }}
                      >
                        {category}
                      </span>
                      {category !== 'General' && (
                        <div className="flex items-center">
                          <button
                            className="text-gray-500 hover:text-gray-700 ml-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCategory(category);
                              setEditCategoryText(category);
                            }}
                            title="Edit category"
                          >
                            ✎️
                          </button>
                          <button
                            className="text-red-500 hover:text-red-600 ml-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCategoryToDelete(category);
                              setShowDeleteModal(true);
                            }}
                            title="Delete category"
                          >
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              viewBox="0 0 24 24" 
                              fill="currentColor" 
                              className="w-5 h-5"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
              {/* Add Category Option */}
              {!addingCategory ? (
                <div
                  className="p-2 hover:bg-gray-100 cursor-pointer text-blue-500"
                  onClick={() => {
                    setAddingCategory(true);
                    setTimeout(() => {
                      document.getElementById('newCategoryInput')?.focus();
                    }, 50);
                  }}
                >
                  + Add Category
                </div>
              ) : (
                <div className="p-2 flex items-center">
                  <input
                    id="newCategoryInput"
                    type="text"
                    className="border border-gray-300 rounded-lg p-1 w-full mr-2"
                    placeholder="New category"
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    onKeyPress={handleCategoryKeyPress}
                    autoFocus
                  />
                  <button
                    className="text-green-500 hover:text-green-600 flex-shrink-0"
                    onClick={handleNewCategory}
                    title="Add category"
                  >
                    ✓
                  </button>
                  <button
                    className="text-red-600 hover:text-red-700 ml-2 flex-shrink-0"
                    onClick={() => {
                      setAddingCategory(false);
                      setNewCategoryInput('');
                    }}
                    title="Cancel"
                  >
                    x
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Note Input */}
        <input
          type="text"
          className="border border-gray-300 rounded-lg p-2 flex-grow min-w-0"
          placeholder="Write your note here..."
          value={noteText}
          onChange={handleNoteTextChange}
          disabled={videoPausedAt === null}
        />
        {/* Add Note Button */}
        <button
          onClick={handleAddNote}
          className={`whitespace-nowrap bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300 ${
            videoPausedAt === null ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={videoPausedAt === null}
        >
          Add
        </button>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto">
        <h3 className="text-lg text-gray-800 mb-2">Your Notes:</h3>
        <ul className="list-disc pl-5 max-h-48 overflow-y-auto">
          {getFilteredNotes().map((note, index) => (
            <li key={index} className="mb-2 text-gray-700 flex justify-between items-center group">
              <span className="flex-grow">
                {note.text}{' '}
                <span
                  className="text-blue-500 cursor-pointer"
                  onClick={() => handleSeek(note.timeInSeconds)}
                >
                  [{note.timestamp}]
                </span>
              </span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-lg text-sm bg-gray-200 text-gray-800">
                  {note.category}
                </span>
                <button
                  className="text-red-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    setNoteToDelete(note);
                    setShowDeleteNoteModal(true);
                  }}
                  title="Delete note"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="currentColor" 
                    className="w-5 h-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Modals */}
      {showDeleteModal && (
        <DeleteConfirmationModal
          category={categoryToDelete}
          onConfirm={() => {
            handleDeleteCategory(categoryToDelete);
            setShowDeleteModal(false);
            setCategoryToDelete(null);
          }}
          onCancel={() => {
            setShowDeleteModal(false);
            setCategoryToDelete(null);
          }}
        />
      )}
      {showDeleteNoteModal && (
        <DeleteNoteModal
          onConfirm={() => {
            handleDeleteNote(noteToDelete);
            setShowDeleteNoteModal(false);
            setNoteToDelete(null);
          }}
          onCancel={() => {
            setShowDeleteNoteModal(false);
            setNoteToDelete(null);
          }}
        />
      )}
    </div>
  );
}

Notes.propTypes = {
  videoPausedAt: PropTypes.number,
  onSeekToTime: PropTypes.func.isRequired,
};

DeleteConfirmationModal.propTypes = {
  category: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

DeleteNoteModal.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default Notes;
