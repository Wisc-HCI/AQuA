import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const tailwindColors = [
    { name: 'red', hex: '#EF4444' },
    { name: 'blue', hex: '#3B82F6' },
    { name: 'green', hex: '#10B981' },
    { name: 'yellow', hex: '#F59E0B' },
    { name: 'purple', hex: '#8B5CF6' },
    { name: 'pink', hex: '#EC4899' },
    { name: 'gray', hex: '#6B7280' },
    { name: 'indigo', hex: '#6366F1' },
    { name: 'orange', hex: '#F97316' },
    { name: 'teal', hex: '#14B8A6' },
    { name: 'cyan', hex: '#06B6D4' },
    { name: 'lime', hex: '#84CC16' },
    { name: 'amber', hex: '#F59E0B' },
];

function Prompting() {
    const [messages, setMessages] = useState([]);
    const [question, setQuestion] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
    const [selectedColor, setSelectedColor] = useState(null); // Store the currently selected color
    const [availableColors, setAvailableColors] = useState(tailwindColors); // Store available colors for the picker
    const chatBoxRef = useRef(null);

    useEffect(() => {
        setMessages([{ sender: 'bot', text: 'How can I help you?' }]);
    }, []);

    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [messages]);

    const handleQuestionChange = (e) => {
        setQuestion(e.target.value);
    };

    const handleAskQuestion = async () => {
        if (question.trim() === '') return;

        const userMessage = { text: question, sender: 'person', color: selectedColor ? selectedColor.hex : '#3B82F6' };
        setMessages([...messages, userMessage]);

        try {
            const response = await axios.post('http://127.0.0.1:5000/chat', { prompt: question });
            const llmMessage = { text: response.data.answer, sender: 'llm' };
            setMessages(prevMessages => [...prevMessages, llmMessage]);
            setSuggestions(response.data.suggestions.slice(0, 3) || []);
        } catch (error) {
            console.error('Error fetching response:', error);
            setMessages(prevMessages => [...prevMessages, { text: `Error fetching response: ${error.message}`, sender: 'bot' }]);
        }

        setQuestion('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAskQuestion();
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setQuestion(suggestion);
    };

    const toggleColorPicker = () => {
        setIsColorPickerOpen(!isColorPickerOpen);
    };

    const handleColorSelect = (color) => {
        // Remove the selected color from available colors
        setAvailableColors(availableColors.filter(c => c.name !== color.name));

        // Re-add the previously selected color back to the picker (if there is one)
        if (selectedColor) {
            setAvailableColors(prevColors => [...prevColors, selectedColor]);
        }

        // Set the new selected color
        setSelectedColor(color);
        setIsColorPickerOpen(false); // Close the color picker after selecting a color
    };

    return (
        <div className="flex flex-col justify-between px-5 h-2/3 text-gray-800 relative">
            {/* Button to toggle the Color Picker */}
            <div className="mb-3 flex justify-end relative">

                {isColorPickerOpen && (
                    <div className="mr-2 p-1 border border-gray-300 rounded-lg shadow-md bg-white overflow-x-auto whitespace-nowrap flex gap-2 items-center">
                        {availableColors.map((color, index) => (
                            <div 
                                key={index}
                                className="flex flex-col items-center cursor-pointer mx-2 my-1"
                                onClick={() => handleColorSelect(color)}
                            >
                                <div 
                                    className="w-5 h-5 rounded-full shadow-md"
                                    style={{ backgroundColor: color.hex }}
                                />
                                <span className="text-xs mt-1">{color.name}</span>
                            </div>
                        ))}
                    </div>
                )}
                <button 
                    onClick={toggleColorPicker} 
                    className="bg-blue-500 text-white px-2 py-1 rounded-md text-xs hover:bg-blue-600 transition duration-300"
                >
                    {isColorPickerOpen ? 'Close Picker' : 'Pick Color'}
                </button>
            </div>

            {/* Chat Box Displaying Messages */}
            <div className="chat-box flex-1 overflow-y-auto p-5 border border-gray-300 bg-white rounded-lg shadow-lg mb-3" ref={chatBoxRef}>
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`message flex w-full ${
                            message.sender === 'person'
                            ? 'justify-end' // Aligns person’s messages to the right
                            : 'justify-start' // Aligns bot's messages to the left
                        }`}
                    >
                        <div
                            className={`p-3 rounded-2xl shadow-md my-1 max-w-[75%] break-words ${
                            message.sender === 'person' ? '' : 'bg-gray-200 text-gray-800'
                            }`}
                            style={{ 
                                backgroundColor: message.sender === 'person' ? message.color || '#3B82F6' : '', 
                                whiteSpace: 'pre-wrap' 
                            }} // Ensures the text wraps correctly and applies the user-selected color
                        >
                            {message.text}
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Box for Typing and Submitting Questions */}
            <div className="input-box flex bg-white p-3 border border-gray-300 rounded-lg shadow-md">
                <input 
                    type="text" 
                    value={question} 
                    onChange={handleQuestionChange} 
                    onKeyPress={handleKeyPress}
                    placeholder="Ask a question..."
                    className="flex-1 p-2 border border-gray-300 rounded-md mr-2 text-sm"
                />
                <button 
                    onClick={handleAskQuestion}
                    className="bg-blue-500 text-white px-3 py-1 rounded-md text-xs hover:bg-blue-600 transition duration-300"
                >
                    Ask
                </button>
            </div>

            {/* Displaying Suggestion Bubbles if there are any suggestions */}
            {suggestions.length > 0 && (
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
        </div>
    );
}

export default Prompting;
