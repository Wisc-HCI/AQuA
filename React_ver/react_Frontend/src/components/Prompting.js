import React, { useState, useEffect, useRef } from 'react';
import './css/Prompting.css';
import axios from 'axios';

function Prompting() {
    const [messages, setMessages] = useState([]);
    const [question, setQuestion] = useState('');
    const [suggestions, setSuggestions] = useState([]); // State for suggestions
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

        const userMessage = { text: question, sender: 'person' };
        setMessages([...messages, userMessage]);

        try {
            const response = await axios.post('http://127.0.0.1:5000/chat', { prompt: question });
            
            const llmMessage = { text: response.data.answer, sender: 'llm' };
            setMessages(prevMessages => [...prevMessages, llmMessage]);

            // Set new suggestions from the LLM response
            setSuggestions(response.data.suggestions || []);
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
        setQuestion(suggestion); // Autofill the suggestion into the input box
    };

    return (
        <div className="prompting-container">
            <h2>Chat with Language Model</h2>
            <div className="chat-box" ref={chatBoxRef}>
                {messages.map((message, index) => (
                    <div key={index} className={`message ${message.sender}`}>
                        {message.text}
                    </div>
                ))}
            </div>
            <div className="input-box">
                <input 
                    type="text" 
                    value={question} 
                    onChange={handleQuestionChange} 
                    onKeyPress={handleKeyPress}
                    placeholder="Ask a question..."
                />
                <button onClick={handleAskQuestion}>Ask</button>
            </div>

            {/* Suggestion Bubbles */}
            {suggestions.length > 0 && (
                <div className="suggestions-container">
                    {suggestions.map((suggestion, index) => (
                        <div 
                            key={index} 
                            className="suggestion-bubble" 
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
