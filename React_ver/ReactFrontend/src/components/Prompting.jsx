import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { FaPencilAlt, FaTimes } from 'react-icons/fa';
import logToFile from '../utils/logger';


function Prompting({ isVideoUploaded, onSeekToTime }) {
    const [messages, setMessages] = useState([]);
    const [question, setQuestion] = useState('');
    const [suggestions, setSuggestions] = useState(() => {
        const savedSuggestions = localStorage.getItem('chatSuggestions');
        if (savedSuggestions) {
            try {
                const parsedSuggestions = JSON.parse(savedSuggestions);
                return Array.isArray(parsedSuggestions) && parsedSuggestions.length > 0
                    ? parsedSuggestions
                    : ['Provide a summary of the video', 'What is the main topic of the video?', 'What are the key points discussed in the video?'];
            } catch (error) {
                console.error('Error parsing saved suggestions:', error);
                return ['Provide a summary of the video', 'What is the main topic of the video?', 'What are the key points discussed in the video?'];
            }
        }
        return ['Provide a summary of the video', 'What is the main topic of the video?', 'What are the key points discussed in the video?'];
    });
    const [hoveredMessageIndex, setHoveredMessageIndex] = useState(null);
    const [editMessageIndex, setEditMessageIndex] = useState(null);
    const [editedText, setEditedText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [goal, setGoal] = useState('Goal is to assist researchers in understanding the dataset and providing key insights.');
    const [tempGoal, setTempGoal] = useState('');
    const chatBoxRef = useRef(null);
    const [currentWord, setCurrentWord] = useState('');

    useEffect(() => {
        // Load saved messages, goal, and suggestions from localStorage
        const savedMessages = localStorage.getItem('chatMessages');
        const savedGoal = localStorage.getItem('chatGoal');
        
        if (savedMessages) {
            try {
                const parsedMessages = JSON.parse(savedMessages);
                if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
                    setMessages(parsedMessages);
                } else {
                    setMessages([{ sender: 'bot', text: 'How can I help you?' }]);
                }
            } catch (error) {
                console.error('Error parsing saved messages:', error);
                setMessages([{ sender: 'bot', text: 'How can I help you?' }]);
            }
        } else {
            setMessages([{ sender: 'bot', text: 'How can I help you?' }]);
        }
        
        if (savedGoal) {
            setGoal(savedGoal);
        }
    }, []);

    useEffect(() => {
        // Only save if messages is not empty and is different from initial state
        if (messages && messages.length > 0) {
            try {
                localStorage.setItem('chatMessages', JSON.stringify(messages));
            } catch (error) {
                console.error('Error saving messages:', error);
            }
        }
    }, [messages]);

    useEffect(() => {
        localStorage.setItem('chatGoal', goal);
    }, [goal]);

    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (suggestions && suggestions.length > 0) {
            try {
                localStorage.setItem('chatSuggestions', JSON.stringify(suggestions));
            } catch (error) {
                console.error('Error saving suggestions:', error);
            }
        }
    }, [suggestions]);

    const handleQuestionChange = (e) => {
        const newValue = e.target.value;
        setQuestion(newValue);
        
        if (newValue.endsWith(' ') && currentWord.trim()) {
            logToFile('Prompting', 'Text Input', `Completed word: ${currentWord.trim()}`);
            setCurrentWord('');
        } else {
            setCurrentWord(newValue);
        }
    };

    const handleAskQuestion = async () => {
        if (question.trim() === '') return;
        
        logToFile('Prompting', 'Ask Question', `Asked: ${question.trim()}`);
        const currentQuestion = question;
        const userMessage = { text: question, sender: 'person', color: '#3B82F6' };
        
        // Update messages immediately with user's question
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setQuestion('');
        setIsLoading(true);

        try {
            const response = await fetch('http://127.0.0.1:5000/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: currentQuestion, goal: goal }),
            });

            if (!response.ok) {
                throw new Error(`Request failed with status: ${response.status}`);
            }

            const data = await response.json();
            const llmMessage = { text: data.answer, sender: 'llm' };
            
            // Update messages with bot response
            setMessages(prevMessages => [...prevMessages, llmMessage]);
            setSuggestions(data.suggestions.slice(0, 4) || []);
            // Update suggestions if they exist in the response
            // if (data.suggestions && Array.isArray(data.suggestions)) {
            //     const newSuggestions = data.suggestions.map(suggestion => suggestion.trim()).slice(0, 4);
            //     if (newSuggestions.length > 0) {
            //         setSuggestions(newSuggestions);
            //         // localStorage persistence is handled by the useEffect hook
            //     }
            // }
        } catch (error) {
            console.error('Error fetching response:', error);
            setMessages(prevMessages => [
                ...prevMessages,
                { text: `Error fetching response: ${error.message}`, sender: 'bot' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAskQuestion();
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setQuestion(suggestion);
        logToFile('Prompting', 'Use Suggestion', `Selected suggestion: ${suggestion}`);
    };

    const handleClearChat = () => {
        const initialMessage = [{ sender: 'bot', text: 'How can I help you?' }];
        const initialSuggestions = ['Provide a summary of the video', 'What is the main topic of the video?', 'What are the key points discussed in the video?'];
        
        setMessages(initialMessage);
        setSuggestions(initialSuggestions);
        
        // Clear saved messages and suggestions in localStorage
        localStorage.setItem('chatMessages', JSON.stringify(initialMessage));
        localStorage.setItem('chatSuggestions', JSON.stringify(initialSuggestions));
        
        logToFile('Prompting', 'Clear Chat', 'Cleared chat history and suggestions');
    };

    const handleEditMessage = (index) => {
        setEditMessageIndex(index);
        setEditedText(messages[index].text);
    };

    const handleCancelEdit = () => {
        setEditMessageIndex(null);
        setEditedText('');
    };

    const handleSaveEdit = async (index) => {
        const updatedMessage = { ...messages[index], text: editedText };
        const updatedMessages = messages.slice(0, index + 1);
        updatedMessages[index] = updatedMessage;
        setMessages(updatedMessages);
        setEditMessageIndex(null);
        setEditedText('');

        // Send the updated message to the API
        try {
            const response = await fetch('http://127.0.0.1:5000/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: editedText, goal: goal }),
            });

            if (!response.ok) {
                throw new Error(`Request failed with status: ${response.status}`);
            }

            const data = await response.json();
            const llmMessage = { text: data.answer, sender: 'llm' };
            setMessages((prevMessages) => [...prevMessages, llmMessage]);
            setSuggestions(data.suggestions.slice(0, 4) || []);
        } catch (error) {
            console.error('Error fetching response:', error);
            setMessages((prevMessages) => [
                ...prevMessages,
                { text: `Error fetching response: ${error.message}`, sender: 'bot' },
            ]);
        }
    };

    const handleTimeClick = (startTime) => {
        if (!onSeekToTime) return;
        
        // Log the timestamp click
        logToFile('Prompting', 'Timestamp Click', `Clicked timestamp: ${startTime}`);
        
        try {
            // Check if the time is in HH:MM:SS format
            if (typeof startTime === 'string' && startTime.includes(':')) {
                const parts = startTime.split(':').map(Number);
                let timeInSeconds;
                
                if (parts.length === 3) { // HH:MM:SS
                    timeInSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
                } else if (parts.length === 2) { // MM:SS
                    timeInSeconds = parts[0] * 60 + parts[1];
                } else {
                    console.error('Invalid time format');
                    return;
                }
                
                if (isNaN(timeInSeconds)) {
                    console.error('Invalid time calculation');
                    return;
                }
                
                onSeekToTime(timeInSeconds);
            } else {
                // Handle decimal seconds format
                const seconds = parseFloat(startTime);
                if (isNaN(seconds)) {
                    console.error('Invalid time format');
                    return;
                }
                onSeekToTime(seconds);
            }
        } catch (error) {
            console.error('Error processing time click:', error);
        }
    };

    const openModal = () => {
        setTempGoal(goal);
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    const handleDownloadChat = () => {
        const chatContent = messages.map(message => 
            `[${message.sender.toUpperCase()}]: ${message.text}`
        ).join('\n\n');
        
        const blob = new Blob([chatContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'chat-history.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Log the download action
        logToFile('Prompting', 'Download Chat', 'Chat history downloaded');
    };

    const saveGoal = () => {
        setGoal(tempGoal);
        setIsModalOpen(false);

        // Log the goal adjustment
        logToFile('Prompting', 'Adjust Goal', `Goal adjusted to: ${tempGoal}`);
    };

    const renderMessageWithClickableTimes = (message) => {
        // Updated regex to match both bracketed and unbracketed timestamps
        const timeRegex = /(?:\[)?(\d{2}:\d{2}(?::\d{2})?)\s*-\s*(\d{2}:\d{2}(?::\d{2})?)(?:\])?/g;
        let match;
        let lastIndex = 0;
        const parts = [];
    
        while ((match = timeRegex.exec(message)) !== null) {
            // Add text before the time stamp
            if (match.index > lastIndex) {
                parts.push(<span key={lastIndex}>{message.substring(lastIndex, match.index)}</span>);
            }
    
            const startTime = match[1];
            const endTime = match[2];
            const hadBrackets = message[match.index] === '[';
    
            parts.push(
                <span
                    key={match.index}
                    onClick={() => handleTimeClick(startTime)}
                    className="text-blue-500 cursor-pointer hover:text-blue-700 hover:underline"
                >
                    {hadBrackets ? `[${startTime}-${endTime}]` : `${startTime}-${endTime}`}
                </span>
            );
            lastIndex = match.index + match[0].length;
        }
    
        // Add remaining text after the last time stamp
        if (lastIndex < message.length) {
            parts.push(<span key={lastIndex}>{message.substring(lastIndex)}</span>);
        }
    
        return parts;
    };
    
    

    return (
        <div className="flex flex-col justify-between px-5 text-gray-800 relative">
            <div className="mb-3 flex justify-between items-center relative">
                <button
                    onClick={handleClearChat}
                    disabled={messages.length <= 1}
                        className={`bg-red-500 text-white px-2 py-1 rounded-md text-xs hover:bg-red-600 transition duration-300 ml-2 ${
                            messages.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        Clear Chat
                    </button>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={handleDownloadChat}
                        className={`px-2 py-1 rounded-md hover:bg-gray-100 transition-colors ${
                            messages.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={messages.length <= 1}
                        title="Download chat"
                    >
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 24 24" 
                            fill="currentColor" 
                            className="w-4 h-4"
                        >
                            <path
                                fillRule="evenodd"
                                d="M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75zm-9 13.5a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                    <button
                        onClick={openModal}
                        className="bg-green-500 text-white px-2 py-1 rounded-md text-xs hover:bg-green-600 transition duration-300"
                    >
                        Adjust Goal
                    </button>
                </div>
            </div>

            <div className="chat-box flex-1 overflow-y-auto p-5 border border-gray-300 bg-white rounded-lg shadow-lg mb-3" ref={chatBoxRef}>
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`message flex w-full ${
                            message.sender === 'person' ? 'justify-end relative' : 'justify-start'
                        }`}
                        onMouseEnter={() => message.sender === 'person' && setHoveredMessageIndex(index)}
                        onMouseLeave={() => setHoveredMessageIndex(null)}
                    >
                        {message.sender === 'person' && hoveredMessageIndex === index && editMessageIndex !== index && (
                            <FaPencilAlt
                                className="mr-2 mt-4 cursor-pointer text-red-500 hover:text-red-700"
                                size={14}
                                onClick={() => handleEditMessage(index)}
                            />
                        )}
                        <div
                            className={`p-3 rounded-2xl shadow-md my-1 max-w-[75%] break-words ${
                                message.sender === 'person' ? 'text-white' : 'bg-gray-200 text-gray-800'
                            }`}
                            style={{
                                backgroundColor: message.sender === 'person' ? message.color || '#3B82F6' : '',
                                whiteSpace: 'pre-wrap',
                            }}
                        >
                            {editMessageIndex === index ? (
                                <div>
                                    <input
                                        type="text"
                                        value={editedText}
                                        onChange={(e) => setEditedText(e.target.value)}
                                        className="bg-slate-200 border text-black border-gray-300 p-1 rounded-md w-full"
                                    />
                                    <div className="flex justify-end mt-2">
                                        <button
                                            onClick={handleCancelEdit}
                                            className="bg-black text-white px-2 py-1 rounded-md mr-2"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => handleSaveEdit(index)}
                                            className="bg-white text-black px-2 py-1 rounded-md"
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>
                            ) : message.sender === 'llm' ? (
                                renderMessageWithClickableTimes(message.text)
                            ) : (
                                <span>{message.text}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="input-box flex bg-white p-3 border border-gray-300 rounded-lg shadow-md">
                <input
                    type="text"
                    value={question}
                    onChange={handleQuestionChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask a question..."
                    className="flex-1 p-2 border border-gray-300 rounded-md mr-2 text-sm"
                    disabled={!isVideoUploaded || isLoading}
                />
                <button
                    onClick={handleAskQuestion}
                    disabled={!isVideoUploaded || isLoading || question.trim() === ''}
                    className={`bg-blue-500 text-white px-3 py-1 rounded-md text-xs hover:bg-blue-600 transition duration-300 ${
                        !isVideoUploaded || isLoading || question.trim() === '' ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                    {isLoading ? (
                        <div className="flex justify-center items-center">
                            <svg
                                className="animate-spin h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v8H4z"
                                ></path>
                            </svg>
                        </div>
                    ) : (
                        'Ask'
                    )}
                </button>
            </div>

            {suggestions.length > 0 && isVideoUploaded && (
                <div className="suggestions-container flex gap-2 mt-2 flex-wrap justify-center overflow-x-auto">
                    {suggestions.map((suggestion, index) => (
                        <div
                            key={index}
                            className="suggestion-bubble bg-gray-200 px-3 py-1 rounded-full shadow-sm cursor-pointer text-xs transition-colors hover:bg-gray-300"
                            onClick={() => handleSuggestionClick(suggestion)}
                        >
                            {suggestion}
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg p-6 shadow-lg w-96">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Adjust Goal</h3>
                            <FaTimes
                                className="cursor-pointer text-gray-600 hover:text-gray-800"
                                onClick={closeModal}
                            />
                        </div>
                        <textarea
                            value={tempGoal}
                            onChange={(e) => setTempGoal(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md resize-none min-h-[100px]"
                            placeholder="Enter your goal"
                            style={{
                                height: 'auto',
                                overflow: 'hidden'
                            }}
                            onInput={(e) => {
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                        />
                        <div className="flex justify-end mt-4">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 bg-gray-300 rounded-md text-sm mr-2"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveGoal}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

Prompting.propTypes = {
    isVideoUploaded: PropTypes.bool.isRequired,
    onSeekToTime: PropTypes.func.isRequired,
};

export default Prompting;
