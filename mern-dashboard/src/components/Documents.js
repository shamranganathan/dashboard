import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Questions from './Questions';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      const userId = localStorage.getItem('userId');
      const response = await axios.get(`http://localhost:5000/documents/${userId}`);
      setDocuments(response.data.documents);
    };

    fetchDocuments();
  }, []);

  return (
    <div>
      <h2>My Documents</h2>
      <ul>
        {documents.map(doc => (
          <li key={doc._id}>
            {doc.filename}
            <button onClick={() => setSelectedDocId(doc._id)}>Ask Questions</button>
          </li>
        ))}
      </ul>
      {selectedDocId && <Questions docId={selectedDocId} />}
    </div>
  );
};

export default Documents;
