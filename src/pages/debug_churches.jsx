import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const DebugChurches = () => {
  const [tableInfo, setTableInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTableInfo = async () => {
      try {
        // First, try to get a row to see structure
        const { data: churchData, error: churchError } = await supabase
          .from('churches')
          .select('*')
          .limit(1);
          
        if (churchError) throw churchError;
        
        // Get column names
        let columns = [];
        if (churchData && churchData.length > 0) {
          columns = Object.keys(churchData[0]);
        }
        
        setTableInfo({
          sample: churchData,
          columns: columns
        });
      } catch (err) {
        console.error('Error inspecting churches table:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTableInfo();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Churches Table Debug</h1>
      
      {loading ? (
        <p>Loading table information...</p>
      ) : error ? (
        <div className="bg-red-100 p-4 rounded text-red-700">
          <p>{error}</p>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-semibold mt-6 mb-2">Table Columns</h2>
          <div className="bg-gray-100 p-4 rounded overflow-auto">
            <pre>{JSON.stringify(tableInfo.columns, null, 2)}</pre>
          </div>
          
          <h2 className="text-xl font-semibold mt-6 mb-2">Sample Row</h2>
          <div className="bg-gray-100 p-4 rounded overflow-auto">
            <pre>{JSON.stringify(tableInfo.sample, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugChurches;
