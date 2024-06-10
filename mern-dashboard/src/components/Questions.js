import React, { useState } from 'react';
import axios from 'axios';

const Questions = ({ docId }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem('userId');

    try {
      const response = await axios.post('http://localhost:5000/questions', { userId, docId, question });
      setAnswer(response.data.answer);
    } catch (error) {
      setAnswer('Error processing question');
    }
  };

  return (
    <div>
      <h3>Ask a Question</h3>
      <form onSubmit={handleAskQuestion}>
        <div>
          <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask a question..." />
        </div>
        <button type="submit">Ask</button>
      </form>
      {answer && <p>{answer}</p>}
    </div>
  );
};

export default Questions;
