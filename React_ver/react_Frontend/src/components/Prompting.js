import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { loadCSV } from './utils/csvLoader'; // Adjust the path as necessary
import './css/Prompting.css';

function Prompting() {
    const [messages, setMessages] = useState([]);
    const [question, setQuestion] = useState('');
    const [dataWithSuggestions, setDataWithSuggestions] = useState([]);
    const [dataNoSuggestions, setDataNoSuggestions] = useState([]);

    useEffect(() => {
        // Load the CSV data when the component mounts
        loadCSV('/with_suggestions.csv').then(data => setDataWithSuggestions(data));
        loadCSV('/no_suggestions.csv').then(data => setDataNoSuggestions(data));

        // Automatically start the conversation with the LLM greeting
        setMessages([{ sender: 'bot', text: 'How can I help you?' }]);
    }, []);

    const handleQuestionChange = (e) => {
        setQuestion(e.target.value);
    };

    const handleAskQuestion = () => {
        if (question.trim() === '') return;

        const userMessage = { text: question, sender: 'person' };
        setMessages([...messages, userMessage]);

        // Simulate searching for the best response from the dataset
        const response = findBestResponse(question);
        setMessages(prevMessages => [...prevMessages, response]);

        setQuestion('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAskQuestion();
        }
    };

    const findBestResponse = (question) => {
        // Simple search for a related response in the datasets
        const combinedData = [...dataWithSuggestions, ...dataNoSuggestions];
        const response = combinedData.find(entry => entry.Message && entry.Message.toLowerCase().includes(question.toLowerCase()));

        if (response) {
            return { text: response.Message, sender: 'llm' };
        } else {
            return { text: "I'm sorry, I don't have an answer for that.", sender: 'bot' };
        }
    };

    return (
        <div className="prompting-container">
            <h2>Chat with Language Model</h2>
            <div className="chat-box">
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
