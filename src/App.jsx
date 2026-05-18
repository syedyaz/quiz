import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [appState, setAppState] = useState('loading'); // loading, start, test, result
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const [error, setError] = useState(null);
  
  // Student Identity State
  const [studentName, setStudentName] = useState('');
  const [registrationId, setRegistrationId] = useState('');

  // Parse custom text format into JSON
  const parseQuestions = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    const parsed = lines.map(line => {
      const questionText = line.replace(/^\d+\.\s*/, '');
      return {
        question: questionText,
        options: []
      };
    });
    return parsed;
  };

  useEffect(() => {
    // Get the test name from the URL parameter, default to 'questions'
    const searchParams = new URLSearchParams(window.location.search);
    const testName = searchParams.get('test') || 'questions';
    const testFileName = `${import.meta.env.BASE_URL}${testName}.txt`;

    fetch(testFileName)
      .then(res => {
        if (!res.ok) throw new Error(`Could not find ${testFileName}`);
        return res.text();
      })
      .then(text => {
        const parsed = parseQuestions(text);
        if (parsed.length === 0) {
          throw new Error("No valid questions found in the file.");
        }
        setQuestions(parsed);
        setAppState('start');
      })
      .catch(err => {
        setError(err.message);
        setAppState('error');
      });
  }, []);

  // Timer logic
  useEffect(() => {
    let timer;
    if (appState === 'test') {
      timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setAppState('result');
            alert("Time is up! Your test has been automatically submitted.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [appState]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleAnswerChange = (e) => {
    setAnswers({
      ...answers,
      [currentIndex]: e.target.value
    });
  };

  const clearResponse = () => {
    const newAnswers = { ...answers };
    newAnswers[currentIndex] = '';
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    if (window.confirm("Are you sure you want to submit your test?")) {
      setAppState('result');
    }
  };

  if (appState === 'loading') {
    return <div className="app-container"><h2 className="text-center">Loading Assessment...</h2></div>;
  }

  if (appState === 'error') {
    return (
      <div className="app-container">
        <div className="surface text-center">
          <h2 className="text-primary">Failed to Load Questions</h2>
          <p>{error}</p>
          <p className="text-muted">Please ensure the test text file exists in the public directory and follows the correct format.</p>
        </div>
      </div>
    );
  }

  if (appState === 'start') {
    const isFormValid = studentName.trim() !== '' && registrationId.trim() !== '';
    return (
      <div className="app-container">
        <div className="surface text-center" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h1 className="text-primary">Online Computer Based Test</h1>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
            This quiz contains <strong>{questions.length}</strong> questions.
          </p>
          
          <div style={{ padding: '0 1rem', marginBottom: '2rem' }}>
            <div className="input-group">
              <label>Full Name</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Enter your name"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Registration ID</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Enter your Student / Registration ID"
                value={registrationId}
                onChange={e => setRegistrationId(e.target.value)}
              />
            </div>
          </div>

          <button 
            className="btn btn-primary" 
            style={{ fontSize: '1.25rem', padding: '1rem 3rem', opacity: isFormValid ? 1 : 0.5 }}
            disabled={!isFormValid}
            onClick={() => setAppState('test')}
          >
            Start Test Now
          </button>
          {!isFormValid && <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '1rem' }}>Please enter your details to begin.</p>}
        </div>
      </div>
    );
  }

  if (appState === 'result') {
    // No automatic scoring for short answer questions

    const handleDownloadReceipt = () => {
      let content = `=======================================\n`;
      content += `          QUIZ RESPONSE SHEET          \n`;
      content += `=======================================\n\n`;
      content += `Student Name: ${studentName}\n`;
      content += `Registration ID: ${registrationId}\n`;
      content += `Date Completed: ${new Date().toLocaleString()}\n`;
      content += `Time Taken: ${formatTime(elapsedTime)}\n\n`;
      
      content += `------- Student Responses -------\n\n`;
      questions.forEach((q, i) => {
        const studentAnswer = answers[i] || "Not attempted";
        content += `Q${i+1}: ${q.question}\n`;
        content += `Answer: ${studentAnswer}\n\n`;
      });
      content += `=======================================\n`;

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${studentName.replace(/\s+/g, '_')}_Response.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    return (
      <div className="app-container">
        <div className="surface">
          <div className="result-summary">
            <h2>Quiz Submitted Successfully</h2>
            <div style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
              <strong>Name:</strong> {studentName} <br/>
              <strong>Registration ID:</strong> {registrationId}
            </div>
            <div className="text-muted">Time taken: {formatTime(elapsedTime)}</div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
              <button className="btn btn-success" onClick={handleDownloadReceipt}>Download Response Sheet</button>
            </div>
            <p className="text-muted" style={{ marginTop: '1rem' }}>Please download your response sheet and upload it to Google Classroom.</p>
          </div>

          <h3 style={{ marginTop: '3rem', marginBottom: '1.5rem' }}>Your Responses:</h3>
          {questions.map((q, i) => {
            const notAttempted = !answers[i] || answers[i].trim() === '';
            return (
              <div key={i} className="review-item">
                <div style={{ fontWeight: 600 }}>Q{i+1}. {q.question}</div>
                <div style={{ marginTop: '1rem', color: 'var(--text-main)', background: 'var(--bg-main)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
                  {notAttempted ? <em>Not attempted</em> : answers[i]}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="app-container">
      <div className="cbt-layout">
        
        {/* Main Question Panel */}
        <div className="surface">
          <div className="question-header">
            <h2 style={{ margin: 0 }}>Question {currentIndex + 1} of {questions.length}</h2>
          </div>
          
          <div className="question-text">
            {currentQ.question}
          </div>

          <div className="answer-section" style={{ marginTop: '2rem' }}>
            <textarea
              className="input-field"
              style={{ minHeight: '150px', resize: 'vertical' }}
              placeholder="Type your answer here..."
              value={answers[currentIndex] || ''}
              onChange={handleAnswerChange}
            />
          </div>

          <div className="nav-buttons">
            <button 
              className="btn btn-secondary"
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
            >
              &larr; Previous
            </button>
            
            <button 
              className="btn btn-secondary"
              onClick={clearResponse}
              disabled={answers[currentIndex] === undefined}
            >
              Clear Response
            </button>

            {currentIndex < questions.length - 1 ? (
              <button 
                className="btn btn-primary"
                onClick={() => setCurrentIndex(prev => prev + 1)}
              >
                Save & Next &rarr;
              </button>
            ) : (
              <button 
                className="btn btn-success"
                onClick={handleSubmit}
              >
                Submit Test
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Panel */}
        <div className="sidebar">
          <div className="timer" style={{ color: timeLeft < 60 ? 'var(--danger)' : 'var(--primary)' }}>
            ⏱ {formatTime(timeLeft)} left
          </div>
          
          <div style={{ marginBottom: '1rem', fontWeight: 600 }}>Question Palette:</div>
          <div className="grid-palette">
            {questions.map((_, i) => (
              <button
                key={i}
                className={`palette-btn ${answers[i] !== undefined ? 'attempted' : ''} ${currentIndex === i ? 'current' : ''}`}
                onClick={() => setCurrentIndex(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', background: 'var(--secondary)', borderRadius: '2px' }}></div> Attempted
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', background: 'white', border: '1px solid var(--border)', borderRadius: '2px' }}></div> Unattempted
            </div>
          </div>
          
          <button 
            className="btn btn-success" 
            style={{ width: '100%', marginTop: '2rem' }}
            onClick={handleSubmit}
          >
            Submit Test
          </button>
        </div>

      </div>
    </div>
  );
}

export default App;
