import React, { useState } from 'react';
import axios from 'axios';

const Upload = () => {
  const [document, setDocument] = useState(null);
  const [message, setMessage] = useState('');

  const handleUpload = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem('userId');
    const formData = new FormData();
    formData.append('document', document);
    formData.append('userId', userId);

    try {
      await axios.post('http://localhost:5000/upload', formData);
      setMessage('Document uploaded successfully');
    } catch (error) {
      setMessage('Error uploading document');
    }
  };

  return (
    <div>
      <h2>Upload Document</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleUpload}>
        <div>
          <input type="file" onChange={(e) => setDocument(e.target.files[0])} />
        </div>
        <button type="submit">Upload</button>
      </form>
    </div>
  );
};

export default Upload;
