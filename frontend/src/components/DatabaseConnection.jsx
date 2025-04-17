import React, { useState } from 'react';
import axios from 'axios';

function DatabaseConnection({ onConnect }) {
  const [connectionType, setConnectionType] = useState('credentials');
  const [credentials, setCredentials] = useState({
    host: '127.0.0.1',
    port: '3306',
    user: '',
    password: '',
    database: ''
  });

  const handleConnect = async (e) => {
    e.preventDefault();
    try {
      // Store credentials in localStorage
      localStorage.setItem('db_host', credentials.host);
      localStorage.setItem('db_port', credentials.port);
      localStorage.setItem('db_user', credentials.user);
      localStorage.setItem('db_password', credentials.password);
      localStorage.setItem('db_database', credentials.database);

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/connect`|| 'https://txt2sql.onrender.com/connect', credentials);
      onConnect(response.data);
    } catch (error) {
      alert('Connection failed: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    
    // Add connection parameters to formData
    formData.append('host', credentials.host);
    formData.append('port', credentials.port);
    formData.append('user', credentials.user);
    formData.append('password', credentials.password);
    formData.append('database', credentials.database);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/upload-sql`, formData);
      onConnect(response.data);
    } catch (error) {
      alert('Upload failed: ' + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div className="bg-gray-700/50 backdrop-blur-lg rounded-lg p-6 space-y-6">
      <div className="flex justify-center space-x-4">
        <button
          className={`px-4 py-2 rounded ${
            connectionType === 'credentials' ? 'bg-gray-600 text-gray-100' : 'bg-gray-700/50 text-gray-300'
          }`}
          onClick={() => setConnectionType('credentials')}
        >
          Use Credentials
        </button>
        <button
          className={`px-4 py-2 rounded ${
            connectionType === 'file' ? 'bg-gray-600 text-gray-100' : 'bg-gray-700/50 text-gray-300'
          }`}
          onClick={() => setConnectionType('file')}
        >
          Upload SQL File
        </button>
      </div>

      {connectionType === 'credentials' ? (
        <form onSubmit={handleConnect} className="space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Host"
              className="flex-1 p-2 rounded bg-gray-700/50 text-gray-100 placeholder-gray-400"
              value={credentials.host}
              onChange={(e) => setCredentials({...credentials, host: e.target.value})}
            />
            <input
              type="text"
              placeholder="Port"
              className="w-24 p-2 rounded bg-gray-700/50 text-gray-100 placeholder-gray-400"
              value={credentials.port}
              onChange={(e) => setCredentials({...credentials, port: e.target.value})}
            />
          </div>
          {['user', 'password', 'database'].map((field) => (
            <input
              key={field}
              type={field === 'password' ? 'password' : 'text'}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              className="w-full p-2 rounded bg-gray-700/50 text-gray-100 placeholder-gray-400"
              value={credentials[field]}
              onChange={(e) => setCredentials({...credentials, [field]: e.target.value})}
            />
          ))}
          <button
            type="submit"
            className="w-full py-2 bg-gray-600 text-gray-100 rounded hover:bg-gray-500"
          >
            Connect
          </button>
        </form>
      ) : (
        <div className="text-center">
          <label className="block mb-4 text-gray-100">
            Upload .sql file
            <input
              type="file"
              accept=".sql"
              className="mt-2 block w-full text-gray-100"
              onChange={handleFileUpload}
            />
          </label>
          <button
            onClick={() => setConnectionType('credentials')}
            className="mt-4 px-4 py-2 bg-gray-600 text-gray-100 rounded hover:bg-gray-500"
          >
            Back to Credentials
          </button>
        </div>
      )}
    </div>
  );
}

export default DatabaseConnection;
