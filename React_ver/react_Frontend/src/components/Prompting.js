import React, { useState } from 'react';
import axios from 'axios';
import './css/Prompting.css';

function Prompting() {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');

    const handleQuestionChange = (e) => {
        setQuestion(e.target.value);
    };

    const handleAskQuestion = () => {
        axios.post('http://localhost:5000/ask-question', { question })
            .then(response => {
                setAnswer(response.data.answer);
            })
            .catch(error => {
                console.error('There was an error asking the question!', error);
            });
    };

    return (
        <div className="prompting-container">
            <h2>Prompting</h2>
            <input 
                type="text" 
                value={question} 
                onChange={handleQuestionChange} 
                placeholder="Ask a question..."
            />
            <button onClick={handleAskQuestion}>Ask</button>
            {answer && <p>{answer}</p>}
        </div>
    );
}

export default Prompting;
