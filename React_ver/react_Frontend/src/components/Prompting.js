import React, { useState, useEffect, useRef } from 'react';
import { loadCSV } from './utils/csvLoader'; // Adjust the path as necessary
import './css/Prompting.css';
import axios from 'axios';

function Prompting() {
    const [messages, setMessages] = useState([]);
    const [question, setQuestion] = useState('');
    const [dataWithSuggestions, setDataWithSuggestions] = useState([]);
    const [dataNoSuggestions, setDataNoSuggestions] = useState([]);
    const chatBoxRef = useRef(null);

    useEffect(() => {
        // Load the CSV data when the component mounts
        loadCSV('/mnt/data/with suggestions.csv').then(data => setDataWithSuggestions(data));
        loadCSV('/mnt/data/no suggestions.csv').then(data => setDataNoSuggestions(data));

        // Automatically start the conversation with the LLM greeting
        setMessages([{ sender: 'bot', text: 'How can I help you?' }]);
    }, []);

    useEffect(() => {
        // Scroll to the bottom of the chat box whenever messages change
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
            
            // Log the full response object to check for additional information
            console.log('Full response:', response);
            
            const llmMessage = { text: response.data.choices[0].message.content, sender: 'llm' };
            setMessages(prevMessages => [...prevMessages, llmMessage]);
        } catch (error) {
            console.error('Error fetching response:', error);
            const errorMessage = error.response ? `${error.message}: ${error.response.data.error}` : error.message;
            setMessages(prevMessages => [...prevMessages, { text: `Error fetching response: ${errorMessage}`, sender: 'bot' }]);
        }

        setQuestion('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAskQuestion();
        }
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
        </div>
    );
}

export default Prompting;
