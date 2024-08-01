import React, { useState, useEffect, useRef } from 'react';
import { loadCSV } from './utils/csvLoader'; // Adjust the path as necessary
import './css/Prompting.css';

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
        let response = combinedData.find(entry => entry.Person && entry.Person.toLowerCase().includes(question.toLowerCase()));

        if (response) {
            return { text: response.LLM, sender: 'llm' }; // Adjusting the response field as per the CSV structure
        } else {
            return { text: "I'm sorry, I don't have an answer for that.", sender: 'bot' };
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
