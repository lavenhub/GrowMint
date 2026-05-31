import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { simulateZKProofGeneration } from '../utils/zkProofSimulator';
import {
  loadAssignments,
  getStarterCode,
  getSubmission,
} from '../utils/studentStorage';
import { ZKBadge } from '../components/Badge';
import { ChevronLeft, Code, Save, Play, ShieldAlert, Cpu, CheckCircle, Mic, MicOff, AlertTriangle } from 'lucide-react';

export default function AssignmentWork() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const assignments = loadAssignments();
  const assignment = assignments.find((a) => a.id === id);

  const [code, setCode] = useState(() => {
    if (!assignment) return '';
    const saved = localStorage.getItem(`code_${assignment.id}`);
    return saved || getStarterCode(assignment);
  });

  const [typingLogs, setTypingLogs] = useState([]);
  const [pasteCount, setPasteCount] = useState(0);
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [keystrokeCount, setKeystrokeCount] = useState(0);
  
  const [compiling, setCompiling] = useState(false);
  const [compileProgress, setCompileProgress] = useState(0);
  const [compileStep, setCompileStep] = useState('');
  
  const [proofResult, setProofResult] = useState(() =>
    assignment ? getSubmission(assignment.id) : null
  );

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState('');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceAnalysis, setVoiceAnalysis] = useState(null);
  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);
  const recordingTimerRef = useRef(null);

  const recognitionAvailable = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

  if (!assignment) {
    return (
      <div className="assignment-work-page">
        <header className="page-header">
          <button className="btn-back" onClick={() => navigate('/student')}>
            <ChevronLeft size={20} />
          </button>
          <h1>Assignment not found</h1>
        </header>
        <p className="text-muted margin-top-md">Return to the dashboard and pick an active task.</p>
      </div>
    );
  }

    useEffect(() => {
      if (!assignment) return;
      const savedClip = localStorage.getItem(`voice_clip_${assignment.id}`);
      const savedTranscript = localStorage.getItem(`voice_transcript_${assignment.id}`);
      const savedAnalysis = localStorage.getItem(`voice_analysis_${assignment.id}`);
      if (savedClip) {
        setAudioURL(savedClip);
      }
      if (savedTranscript) {
        setVoiceTranscript(savedTranscript);
      }
      if (savedAnalysis) {
        try {
          setVoiceAnalysis(JSON.parse(savedAnalysis));
        } catch {
          setVoiceAnalysis(null);
        }
      }
    }, [assignment?.id]);

    useEffect(() => {
      return () => {
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
        }
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      };
    }, []);

    const normalizeText = (text) => text.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ');

    const analyzeVoiceTranscript = (transcript, assignment) => {
      const normalized = normalizeText(transcript);
      const keywords = [assignment.title, assignment.trapQuestion]
        .filter(Boolean)
        .flatMap((item) => item.split(/\W+/))
        .filter((word) => word.length > 3)
        .map((word) => word.toLowerCase());

      const uniqueKeywords = [...new Set(keywords)];
      const matches = uniqueKeywords.filter((word) => normalized.includes(word));
      const matchCount = matches.length;
      const baseScore = Math.min(100, Math.max(30, Math.floor(40 + matchCount * 12)));
      const lengthScore = Math.min(30, Math.floor(Math.min(transcript.split(/\s+/).length, 30) * 1.5));
      const score = Math.min(100, baseScore + lengthScore);
      const passed = score >= 65;
      const reason = passed
        ? 'Explanation includes assignment-specific context and logic trap reasoning.'
        : 'Explanation does not include enough assignment-specific or trap-aware details.';

      return {
        passed,
        score,
        reason,
        matchedKeywords: matches.slice(0, 5),
      };
    };

    const saveVoiceAnalysis = (transcript) => {
      if (!assignment) return;
      const analysis = analyzeVoiceTranscript(transcript, assignment);
      setVoiceAnalysis(analysis);
      localStorage.setItem(`voice_transcript_${assignment.id}`, transcript);
      localStorage.setItem(`voice_analysis_${assignment.id}`, JSON.stringify(analysis));
      return analysis;
    };

    const handleTranscriptChange = (e) => {
      const value = e.target.value;
      setVoiceTranscript(value);
      saveVoiceAnalysis(value);
    };

    const startSpeechRecognition = () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) return;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = true;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join(' ');
        setVoiceTranscript(transcript);
        saveVoiceAnalysis(transcript);
      };
      recognition.onerror = () => {
        recognition.stop();
        recognitionRef.current = null;
      };
      recognition.onend = () => {
        recognitionRef.current = null;
      };
      recognition.start();
      recognitionRef.current = recognition;
    };

    const stopVoiceCapture = () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };

    const processAudioBlob = (blob) => {
      if (!assignment) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result;
        setAudioURL(dataUrl);
        localStorage.setItem(`voice_clip_${assignment.id}`, dataUrl);
      };
      reader.readAsDataURL(blob);
    };

    const handleStartRecording = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert('Microphone access is required for voice explanation recording.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          processAudioBlob(blob);
          stream.getTracks().forEach((track) => track.stop());
          stopVoiceCapture();
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
        setRecordingTime(0);
        recordingTimerRef.current = window.setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
        if (recognitionAvailable) {
          startSpeechRecognition();
        }
      } catch (error) {
        alert('Unable to access microphone. Please allow audio recording.');
      }
    };

    const handleStopRecording = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      } else {
        stopVoiceCapture();
      }
    };

  // Track keystrokes
  const handleKeyDown = (e) => {
    if (proofResult) return; // Locked on submission
    
    setKeystrokeCount(prev => prev + 1);
    
    if (e.key === 'Backspace') {
      setBackspaceCount(prev => prev + 1);
    }

    const logEntry = {
      type: 'keydown',
      key: e.key,
      timestamp: Date.now()
    };
    
    setTypingLogs(prev => [...prev, logEntry]);
  };

  const handlePaste = (e) => {
    if (proofResult) return; // Locked on submission
    
    setPasteCount(prev => prev + 1);
    
    const logEntry = {
      type: 'paste',
      key: 'PasteAction',
      timestamp: Date.now()
    };

    setTypingLogs(prev => [...prev, logEntry]);
  };

  const handleTextChange = (e) => {
    setCode(e.target.value);
    localStorage.setItem(`code_${assignment.id}`, e.target.value);
  };

  const handleCompileProof = () => {
    if (typingLogs.length === 0) {
      alert("Please type some code in the editor first to log telemetry!");
      return;
    }
        if (!audioURL) {
          alert('Please record and save your voice explanation before submitting.');
          return;
        }

        if (!voiceTranscript || !voiceAnalysis?.passed) {
          alert('Your voice explanation must include assignment-specific details and logic trap reasoning before submission.');
          return;
        }

    setCompiling(true);
    setCompileProgress(0);

    const steps = [
      "Calculating circuit witness signals...",
      "Generating R1CS arithmetic constraints...",
      "Computing Groth16 cryptographic proof keys...",
      "Executing Zero-Knowledge Proving loop...",
      "Verifying proof locally with institutional key..."
    ];

    let stepIndex = 0;
    const progressInterval = setInterval(() => {
      setCompileProgress(prev => {
        const next = prev + 5;
        if (next % 20 === 0 && stepIndex < steps.length - 1) {
          stepIndex++;
        }
        setCompileStep(steps[stepIndex]);
        return next;
      });
    }, 100);

    // Run the actual telemetry math
    simulateZKProofGeneration(
      typingLogs, 
      () => {}, // handled by custom compiler loop
      (result) => {
        clearInterval(progressInterval);
        setCompileProgress(100);
        setCompileStep("Zero-Knowledge Cryptographic Submission verified!");
        
        setTimeout(() => {
          const submissionInfo = {
            studentId: "std-1",
            studentName: "Aarav Sharma",
            status: result.verified && voiceAnalysis?.passed ? 'verified' : 'suspicious',
            submittedAt: new Date().toISOString().split('T')[0],
            metrics: result,
            voiceReview: voiceAnalysis,
            voiceTranscript,
            voiceClip: audioURL,
          };

          setProofResult(submissionInfo);
          setCompiling(false);

          // Save locally
          localStorage.setItem(`submitted_${assignment.id}`, JSON.stringify(submissionInfo));
          
          // Sync with the main assignments list in localStorage
          const list = loadAssignments();
          const updatedList = list.map(a => {
            if (a.id === assignment.id) {
              const filtered = a.submissions.filter(s => s.studentId !== "std-1");
              return {
                ...a,
                submissions: [...filtered, submissionInfo]
              };
            }
            return a;
          });
          localStorage.setItem('spectra_assignments', JSON.stringify(updatedList));
        }, 800);
      }
    );
  };

  const handleResetSandbox = () => {
    if (confirm("Reset the code editor and clear active typing telemetry?")) {
      setCode(getStarterCode(assignment));
      setTypingLogs([]);
      setPasteCount(0);
      setBackspaceCount(0);
      setKeystrokeCount(0);
      setAudioURL('');
      setVoiceTranscript('');
      setVoiceAnalysis(null);
      setProofResult(null);
      localStorage.removeItem(`code_${assignment.id}`);
      localStorage.removeItem(`submitted_${assignment.id}`);
      localStorage.removeItem(`voice_clip_${assignment.id}`);
      localStorage.removeItem(`voice_transcript_${assignment.id}`);
      localStorage.removeItem(`voice_analysis_${assignment.id}`);
    }
  };

  return (
    <div className="assignment-work-page">
      <header className="page-header flex-align-center">
        <button className="btn-back" onClick={() => navigate('/student')}>
          <ChevronLeft size={20} />
        </button>
        <div className="margin-left-sm">
          <h1>{assignment.title}</h1>
          <p className="subtitle">
            <button type="button" className="link-btn" onClick={() => navigate(`/student/assignment/${assignment.id}/brief`)}>
              View assignment brief
            </button>
            {' · '}
            Trap: <em>{(assignment.trapQuestion || '').slice(0, 60)}…</em>
          </p>
        </div>
      </header>

      <div className="code-workspace-grid">
        {/* Code Editor Column */}
        <section className="dashboard-card glass-panel flex-column code-editor-card">
          <div className="editor-header flex-align-center justify-between">
            <div className="flex-align-center">
              <Code size={16} className="text-purple margin-right-xs" />
              <span>Secure Container Editor</span>
            </div>
            
            <div className="editor-controls">
              <button className="btn-editor-action text-muted" onClick={handleResetSandbox}>
                Reset Sandbox
              </button>
            </div>
          </div>

          <textarea
            className="code-textarea font-mono"
            value={code}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={compiling || !!proofResult}
            spellCheck="false"
          />

          <div className="editor-footer flex-align-center justify-between">
            <span className="editor-chars-lbl">Active Telemetry: {typingLogs.length} events logged</span>
            <span className="secure-tag-lbl">🟢 Sandbox Secured</span>
          </div>
        </section>

        {/* Right Dashboard Controls */}
        <section className="side-controls-column flex-column gap-md">
          {/* Telemetry Tracking Widget */}
          <div className="dashboard-card glass-panel">
            <div className="card-header">
              <Cpu className="card-icon text-cyan" size={18} />
              <h2>Telemetry Telemetry</h2>
            </div>
            
            <div className="telemetry-widget-body">
              <div className="live-metric-row">
                <span>Keystroke Inputs:</span>
                <span className="bold-num text-purple">{keystrokeCount}</span>
              </div>
              <div className="live-metric-row">
                <span>Self-Corrections (Backspace):</span>
                <span className="bold-num text-cyan">{backspaceCount}</span>
              </div>
              <div className="live-metric-row">
                <span>Paste Detections:</span>
                <span className={`bold-num ${pasteCount > 0 ? 'text-red' : ''}`}>{pasteCount}</span>
              </div>

              {pasteCount > 0 && (
                <div className="paste-alert-banner">
                  <ShieldAlert size={14} className="margin-right-xs text-red" />
                  <span><strong>AI Alert:</strong> Bulk pasting detected. ZK proof human score penalized.</span>
                </div>
              )}
            </div>
          </div>

          {/* Voice Explanation & Accuracy Check */}
          <div className="dashboard-card glass-panel">
            <div className="card-header">
              <Mic className="card-icon text-magenta" size={18} />
              <h2>Voice Explanation</h2>
            </div>

            <div className="voice-verify-body">
              <p className="text-sm margin-bottom-sm">Record a short spoken explanation of your solution, your algorithm, and how it satisfies the assignment trap.</p>
              <div className="voice-control-row flex-align-center justify-between">
                <button
                  className={`btn-primary ${isRecording ? 'btn-danger' : ''}`}
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                >
                  {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                  <span>{isRecording ? 'Stop recording' : 'Start recording'}</span>
                </button>
                <span className="text-xs text-muted">{recordingTime}s</span>
              </div>

              {audioURL && (
                <div className="margin-top-md">
                  <audio controls src={audioURL} style={{ width: '100%' }} />
                  <p className="text-xs text-muted margin-top-xs">Saved voice clip is stored locally for this assignment.</p>
                </div>
              )}

              <div className="margin-top-md">
                <label htmlFor="voiceTranscript" className="text-sm">Voice transcript / summary</label>
                <textarea
                  id="voiceTranscript"
                  className="form-textarea"
                  rows={4}
                  value={voiceTranscript}
                  onChange={handleTranscriptChange}
                  placeholder={recognitionAvailable ? 'Speech will transcribe automatically while recording...' : 'Type a short summary of your spoken explanation here.'}
                  disabled={isRecording}
                />
              </div>

              {voiceAnalysis && (
                <div className="margin-top-md voice-analysis-summary">
                  <div className="flex-align-center justify-between">
                    <span className="text-sm">Accuracy score</span>
                    <strong>{voiceAnalysis.score}%</strong>
                  </div>
                  <p className={`text-xs margin-top-xs ${voiceAnalysis.passed ? 'text-green' : 'text-red'}`}>{voiceAnalysis.reason}</p>
                  {voiceAnalysis.matchedKeywords?.length > 0 && (
                    <p className="text-xs text-muted">Matched key terms: {voiceAnalysis.matchedKeywords.join(', ')}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Submission and Proving Status */}
          <div className="dashboard-card glass-panel flex-column justify-center align-center">
            <div className="card-header">
              <Cpu className="card-icon text-purple" size={18} />
              <h2>ZK Compilation & Submit</h2>
            </div>

            <div className="proving-actions-body text-center flex-column flex-align-center w-full pad-sm">
              {compiling ? (
                <div className="compilation-loading-overlay w-full">
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${compileProgress}%` }}></div>
                  </div>
                  <span className="progress-pct font-mono">{compileProgress}%</span>
                  <p className="compiler-step-txt text-xs margin-top-xs">{compileStep}</p>
                </div>
              ) : proofResult ? (
                <div className="proving-success-summary w-full">
                  <div className="flex-align-center justify-center margin-bottom-sm">
                    <CheckCircle className="text-green margin-right-xs" size={24} />
                    <h3>Assignment Submitted</h3>
                  </div>

                  <div className="badge-center margin-bottom-md">
                    <ZKBadge status={proofResult.status} score={proofResult.metrics?.humanScore ?? proofResult.metrics?.confidence} />
                  </div>

                  <div className="proof-details-box text-left">
                    <span className="lbl">Zero-Knowledge Proof:</span>
                    <span className="val font-mono">{proofResult.metrics?.proofHash}</span>
                    <p className="desc text-xs">{proofResult.metrics?.reason}</p>
                  </div>

                  <button className="btn-secondary w-full margin-top-md" onClick={() => navigate('/student')}>
                    Return to Dashboard
                  </button>
                </div>
              ) : (
                <div className="ready-to-submit-box w-full">
                  <p className="widget-p text-sm margin-bottom-md">Generate cryptographic credentials ensuring organic student authorship prior to sending to class records.</p>
                  
                  <button className="btn-primary w-full" onClick={handleCompileProof}>
                    <Play size={16} />
                    <span>Compile ZK Proof & Submit</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
