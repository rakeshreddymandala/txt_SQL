import React, { useState } from 'react';
import axios from 'axios';

function QueryInterface({ schema, schemaText, onBack }) {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState(null);
  const [sql, setSql] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Convert schema format to match backend expectation
      const formattedSchema = {};
      for (const [tableName, columns] of Object.entries(schema)) {
        // Ensure each column is an array of [name, type]
        formattedSchema[tableName] = columns.map(col => 
          Array.isArray(col) ? col : [col.name || col[0], col.type || col[1]]
        );
      }

      console.log("Sending schema:", formattedSchema); // Debug log

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/query`, { 
        question,
        db_schema: formattedSchema,
        connection: {
          host: localStorage.getItem('db_host') || '127.0.0.1',
          port: localStorage.getItem('db_port') || '3306',
          user: localStorage.getItem('db_user') || '',
          password: localStorage.getItem('db_password') || '',
          database: localStorage.getItem('db_database') || ''
        }
      });

      setResult(response.data.results);
      setSql(response.data.sql);
    } catch (error) {
      console.error('Query error:', error);
      alert('Query failed: ' + (error.response?.data?.detail || error.message));
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-700 text-gray-100 rounded hover:bg-gray-600"
        >
          ← Back to Connection
        </button>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-lg rounded-lg p-4">
        <h3 className="text-gray-100 font-semibold mb-2">Database Schema:</h3>
        <pre className="bg-gray-900/50 p-3 rounded text-gray-300 overflow-x-auto text-sm">
          {schemaText}
        </pre>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Ask a question in English..."
          className="w-full p-3 rounded bg-gray-700 text-gray-100 placeholder-gray-400"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-gray-600 text-gray-100 rounded hover:bg-gray-500 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Generate SQL & Execute'}
        </button>
      </form>

      {sql && (
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-lg p-4">
          <h3 className="text-gray-100 font-semibold mb-2">Generated SQL:</h3>
          <pre className="bg-gray-900/50 p-3 rounded text-gray-300 overflow-x-auto">
            {sql}
          </pre>
        </div>
      )}

      {result && (
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-lg p-4 overflow-x-auto">
          <h3 className="text-gray-100 font-semibold mb-2">Results:</h3>
          <table className="min-w-full text-gray-100">
            <thead>
              <tr>
                {Object.keys(result[0] || {}).map((key) => (
                  <th key={key} className="px-4 py-2 text-left bg-gray-700/50">{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.map((row, i) => (
                <tr key={i} className="hover:bg-gray-700/30">
                  {Object.values(row).map((value, j) => (
                    <td key={j} className="px-4 py-2 border-t border-gray-700">
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default QueryInterface;
