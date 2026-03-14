import { useState, useEffect, useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts'

function App() {
  const [activeTab, setActiveTab] = useState('school');

  return (
    <div className="app-container">
      <header>
        <h1>Performance Predictor</h1>
        <p>AI-powered foresight into your academic journey.</p>
      </header>

      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'school' ? 'active' : ''}`} 
          onClick={() => setActiveTab('school')}
        >
          School Dashboard
        </button>
        <button 
          className={`tab-btn ${activeTab === 'college' ? 'active' : ''}`} 
          onClick={() => setActiveTab('college')}
        >
          College Dashboard
        </button>
        <button 
          className={`tab-btn ${activeTab === 'teacher' ? 'active' : ''}`} 
          onClick={() => setActiveTab('teacher')}
        >
          Teacher Dashboard
        </button>
      </div>

      {activeTab === 'teacher' ? <TeacherView /> : <StudentView type={activeTab} />}
    </div>
  )
}

function StudentView({ type }) {
  const [formData, setFormData] = useState({
    study_hours: 20,
    attendance: 85,
    previous_score: 75,
    sleep_hours: 7,
    extracurricular: 1
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [insights, setInsights] = useState(null);
  
  // Ref for debouncing prediction fetch
  const timeoutRef = useRef(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/insights');
        if (response.ok) {
          const data = await response.json();
          setInsights(data.feature_importances);
        }
      } catch (err) {
        console.error("Failed to fetch insights", err);
      }
    };
    fetchInsights();
  }, []);

  // Real-time update logic
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      predictScore();
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timeoutRef.current);
  }, [formData]);

  const predictScore = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://127.0.0.1:5000/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({...formData, student_type: type})
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Prediction failed');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: Number(e.target.value)
    });
  };

  return (
    <>
      <div className="main-content">
        <div className="glass-card">
          <form className="form-grid" onSubmit={(e) => e.preventDefault()}>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label>Study Hours / Week</label>
              <div className="slider-container">
                <input 
                  type="range" name="study_hours" 
                  min="0" max="40" step="1"
                  value={formData.study_hours} onChange={handleChange} 
                />
                <span>{formData.study_hours}h</span>
              </div>
            </div>
            
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label>Attendance (%)</label>
              <div className="slider-container">
                <input 
                  type="range" name="attendance" 
                  min="50" max="100" step="1"
                  value={formData.attendance} onChange={handleChange} 
                />
                <span>{formData.attendance}%</span>
              </div>
            </div>
            
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label>{type === 'college' ? 'Current Academic Progress (%)' : 'Previous Score (%)'}</label>
              <div className="slider-container">
                <input 
                  type="range" name="previous_score" 
                  min="0" max="100" step="1"
                  value={formData.previous_score} onChange={handleChange} 
                />
                <span>{formData.previous_score}</span>
              </div>
            </div>
            
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label>Sleep Hours / Night</label>
              <div className="slider-container">
                <input 
                  type="range" name="sleep_hours" 
                  min="0" max="24" step="1"
                  value={formData.sleep_hours} onChange={handleChange} 
                />
                <span>{formData.sleep_hours}h</span>
              </div>
            </div>

            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label>Extracurricular Activities</label>
              <select name="extracurricular" value={formData.extracurricular} onChange={handleChange}>
                <option value="1">Yes</option>
                <option value="0">No</option>
              </select>
            </div>
          </form>
          {error && <p style={{ color: '#ef4444', marginTop: '1rem', textAlign: 'center' }}>{error}</p>}
        </div>

        <div className="glass-card results-section">
          {!result && !loading && (
            <div className="empty-state">
              <h3>Awaiting Input</h3>
              <p>Adjust the sliders to generate an AI prediction</p>
            </div>
          )}

          {result && (
            <div className="result-card" style={{opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s'}}>
              <div className="grade-badge grade-temp" style={{ backgroundColor: `var(--grade-${result.grade.toLowerCase()})` }}>
                Grade {result.grade}
              </div>
              
              <div className="score-circle">
                <div className="score-value">{type === 'college' ? result.predicted_cgpa : result.predicted_score}</div>
                <div className="score-label">{type === 'college' ? 'Predicted CGPA' : 'Final Score'}</div>
              </div>
              
              <p className="remarks">{result.remarks}</p>
              
              {result.actionable_advice && (
                <div className="advice-box">
                  <span style={{fontSize: '1.2rem', marginTop: '-2px'}}>💡</span>
                  <span>{result.actionable_advice}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {insights && (
        <div className="glass-card graph-section">
          <h3>Feature Importance Analysis</h3>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Understand which factors most heavily influence your predicted score.
          </p>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <BarChart data={insights} layout="vertical" margin={{ top: 20, right: 30, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" horizontal={false} />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                <YAxis dataKey="feature" type="category" stroke="var(--text-main)" fontSize={12} tickLine={false} axisLine={false} width={120} />
                <Tooltip 
                  cursor={{fill: 'rgba(0,0,0,0.05)'}}
                  contentStyle={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}
                  itemStyle={{ color: 'var(--text-main)', fontWeight: 600 }}
                  formatter={(value) => [`${value}%`, 'Impact']}
                />
                <Bar dataKey="importance" radius={[0, 4, 4, 0]} barSize={28}>
                  {insights.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--accent)' : 'var(--accent-hover)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </>
  )
}

function TeacherView() {
  const [batchResults, setBatchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setLoading(true);
    const reader = new FileReader();
    
    reader.onload = async (evt) => {
      try {
        const text = evt.target.result;
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        if (lines.length < 2) throw new Error("CSV must contain headers and at least one row.");
        
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(' ', '_'));
        const data = [];
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(',');
          let obj = { id: i, name: `Student ${i}` };
          headers.forEach((h, idx) => {
            if (row[idx]) obj[h] = row[idx].trim();
          });
          data.push(obj);
        }

        const response = await fetch('http://127.0.0.1:5000/api/batch-predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        const resData = await response.json();
        if (!response.ok) throw new Error(resData.error || 'Batch Prediction failed');
        
        setBatchResults(resData.results);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="glass-card teacher-dashboard">
      <h3>Teacher Batch Prediction Dashboard</h3>
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Upload a CSV file containing columns: <br/> <strong>study_hours, attendance, previous_score, sleep_hours, extracurricular</strong>
      </p>

      <label className="upload-box">
        <input 
          type="file" 
          accept=".csv" 
          onChange={handleFileUpload} 
          style={{ display: 'none' }} 
        />
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{width: 50, height: 50, color: 'var(--accent)', margin: '0 auto 1rem'}}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <h4>{loading ? 'Processing Document...' : 'Click to Upload CSV File'}</h4>
      </label>

      {error && <p style={{ color: '#ef4444' }}>{error}</p>}

      {batchResults.length > 0 && (
        <div className="batch-results" style={{ width: '100%' }}>
          <h4>Batch Results ({batchResults.length} Students)</h4>
          <table className="batch-results-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Predicted Score</th>
                <th>Predicted Grade</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {batchResults.map(res => (
                <tr key={res.id} className={res.at_risk ? 'row-risk' : ''}>
                  <td>#{res.id}</td>
                  <td>{res.name}</td>
                  <td><strong>{res.predicted_score}</strong></td>
                  <td><span style={{ color: `var(--grade-${res.grade.toLowerCase()})`, fontWeight: 'bold' }}>Grade {res.grade}</span></td>
                  <td>
                    {res.at_risk ? <span className="risk-tag">At Risk</span> : <span style={{color: 'var(--grade-a)', fontWeight: 'bold'}}>On Track</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default App;
