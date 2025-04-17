import React, { lazy, Suspense, useState } from 'react';
import './App.css';

const DatabaseConnection = lazy(() => import('./components/DatabaseConnection'));
const QueryInterface = lazy(() => import('./components/QueryInterface'));

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [dbSchema, setDbSchema] = useState(null);
  const [schemaText, setSchemaText] = useState('');

  const handleConnect = (data) => {
    setDbSchema(data.schema);
    setSchemaText(data.schema_text);
    setIsConnected(true);
  };

  const handleBack = () => {
    setIsConnected(false);
    setDbSchema(null);
    setSchemaText('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-700 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-100 mb-8 text-center">
          SQL Query Generator
        </h1>

        <Suspense fallback={<div className="text-gray-100">Loading...</div>}>
          {!isConnected ? (
            <DatabaseConnection onConnect={handleConnect} />
          ) : (
            <QueryInterface 
              schema={dbSchema} 
              schemaText={schemaText} 
              onBack={handleBack}
            />
          )}
        </Suspense>
      </div>
    </div>
  );
}

export default App;
