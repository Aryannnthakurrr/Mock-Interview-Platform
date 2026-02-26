import { useState, useRef, useCallback, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import './CodeEditor.css'

const API = 'http://localhost:8000'

const LANGUAGES = [
    { id: 'python', label: 'Python', icon: '🐍', defaultCode: '# Write your solution here\n\ndef solution():\n    pass\n\nsolution()\n' },
    { id: 'javascript', label: 'JavaScript', icon: '🟨', defaultCode: '// Write your solution here\n\nfunction solution() {\n    \n}\n\nsolution();\n' },
    { id: 'java', label: 'Java', icon: '☕', defaultCode: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n' },
    { id: 'cpp', label: 'C++', icon: '⚡', defaultCode: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    \n    return 0;\n}\n' },
    { id: 'c', label: 'C', icon: '🔧', defaultCode: '#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    // Write your solution here\n    \n    return 0;\n}\n' },
    { id: 'typescript', label: 'TypeScript', icon: '🔷', defaultCode: '// Write your solution here\n\nfunction solution(): void {\n    \n}\n\nsolution();\n' },
]

export default function CodeEditor({ defaultLanguage = 'python', wsRef = null, onClose = null }) {
    const [language, setLanguage] = useState(defaultLanguage)
    const [code, setCode] = useState(
        LANGUAGES.find(l => l.id === defaultLanguage)?.defaultCode || ''
    )
    const [stdin, setStdin] = useState('')
    const [output, setOutput] = useState(null)
    const [running, setRunning] = useState(false)
    const [showStdin, setShowStdin] = useState(false)
    const [shared, setShared] = useState(false)
    const [autoShare, setAutoShare] = useState(true)
    const editorRef = useRef(null)
    const runRef = useRef(null)
    const shareTimerRef = useRef(null)

    // Share code with AI interviewer via WebSocket
    const shareCodeWithAI = useCallback(() => {
        const currentCode = editorRef.current?.getValue() || code
        if (!currentCode.trim() || !wsRef?.current || wsRef.current.readyState !== WebSocket.OPEN) return
        wsRef.current.send(JSON.stringify({
            type: 'code_share',
            code: currentCode,
            language,
        }))
        setShared(true)
        setTimeout(() => setShared(false), 2000)
    }, [code, language, wsRef])

    // Share execution results with AI
    const shareRunResultWithAI = useCallback((result, sourceCode) => {
        if (!wsRef?.current || wsRef.current.readyState !== WebSocket.OPEN) return
        wsRef.current.send(JSON.stringify({
            type: 'code_run_result',
            code: sourceCode,
            language,
            stdout: result.stdout || '',
            stderr: result.stderr || '',
            compile_output: result.compile_output || '',
            status: result.status || '',
        }))
    }, [language, wsRef])

    const runCode = useCallback(async () => {
        if (running) return
        const currentCode = editorRef.current?.getValue() || code
        if (!currentCode.trim()) return

        setRunning(true)
        setOutput(null)
        try {
            const res = await fetch(`${API}/api/code/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source_code: currentCode,
                    language,
                    stdin,
                }),
            })
            if (!res.ok) {
                const err = await res.json()
                setOutput({ error: err.detail || 'Execution failed' })
                return
            }
            const data = await res.json()
            setOutput(data)

            // Auto-share results with AI interviewer
            if (autoShare) {
                shareRunResultWithAI(data, currentCode)
            }
        } catch (err) {
            setOutput({ error: 'Network error: ' + err.message })
        } finally {
            setRunning(false)
        }
    }, [code, language, stdin, running, autoShare, shareRunResultWithAI])

    // Keep a ref to the latest runCode so the Monaco action always calls current version
    runRef.current = runCode

    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor

        // Ctrl+Enter / Cmd+Enter to run code
        editor.addAction({
            id: 'run-code',
            label: 'Run Code',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
            run: () => runRef.current?.(),
        })

        // Ctrl+Shift+S to share code with AI
        editor.addAction({
            id: 'share-code',
            label: 'Share with AI',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyS],
            run: () => shareCodeWithAI(),
        })
    }

    const handleLanguageChange = (newLang) => {
        setLanguage(newLang)
        const langDef = LANGUAGES.find(l => l.id === newLang)
        // Only reset to template if editor is empty or still has default code
        const current = editorRef.current?.getValue() || code
        const currentLangDef = LANGUAGES.find(l => l.id === language)
        if (langDef && (!current.trim() || current === currentLangDef?.defaultCode)) {
            setCode(langDef.defaultCode)
        }
    }

    const monacoLang = language === 'cpp' ? 'cpp' : language

    return (
        <div className="code-editor-panel">
            {/* Toolbar */}
            <div className="code-editor-toolbar">
                <div className="ce-toolbar-left">
                    <span className="ce-toolbar-title">💻 Code Editor</span>
                    <select
                        className="language-select"
                        value={language}
                        onChange={e => handleLanguageChange(e.target.value)}
                    >
                        {LANGUAGES.map(l => (
                            <option key={l.id} value={l.id}>{l.icon} {l.label}</option>
                        ))}
                    </select>
                </div>
                <div className="ce-toolbar-right">
                    <label className="auto-share-toggle" title="Auto-share results with AI after running">
                        <input
                            type="checkbox"
                            checked={autoShare}
                            onChange={e => setAutoShare(e.target.checked)}
                        />
                        <span className="toggle-label">Auto-share</span>
                    </label>
                    <button
                        className={`btn-share ${shared ? 'shared' : ''}`}
                        onClick={shareCodeWithAI}
                        disabled={!code.trim()}
                        title="Share code with AI (Ctrl+Shift+S)"
                    >
                        {shared ? '✅ Shared!' : '📤 Share with AI'}
                    </button>
                    <button
                        className={`btn-stdin ${showStdin ? 'active' : ''}`}
                        onClick={() => setShowStdin(!showStdin)}
                        title="Toggle stdin input"
                    >
                        📥 Input
                    </button>
                    <button
                        className="btn-run"
                        onClick={runCode}
                        disabled={running || !code.trim()}
                        title="Run code (Ctrl+Enter)"
                    >
                        {running ? (
                            <><span className="spinner-sm"></span> Running...</>
                        ) : (
                            <>▶ Run</>
                        )}
                    </button>
                    {onClose && (
                        <button
                            className="btn-close-editor"
                            onClick={onClose}
                            title="Close code editor"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Editor + Output */}
            <div className="code-editor-body">
                <div className="editor-container">
                    <Editor
                        height="100%"
                        language={monacoLang}
                        value={code}
                        onChange={(value) => setCode(value || '')}
                        onMount={handleEditorDidMount}
                        theme="vs-dark"
                        options={{
                            fontSize: 14,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            padding: { top: 12 },
                            lineNumbers: 'on',
                            roundedSelection: true,
                            automaticLayout: true,
                            tabSize: 4,
                            wordWrap: 'on',
                            suggestOnTriggerCharacters: true,
                            quickSuggestions: true,
                            formatOnPaste: true,
                        }}
                    />
                </div>

                {/* Stdin */}
                {showStdin && (
                    <div className="stdin-section">
                        <div className="stdin-label">📥 Standard Input (stdin)</div>
                        <textarea
                            className="stdin-input"
                            value={stdin}
                            onChange={e => setStdin(e.target.value)}
                            placeholder="Enter input for your program..."
                            rows={3}
                        />
                    </div>
                )}

                {/* Output */}
                <div className="output-section">
                    <div className="output-header">
                        <span className="output-label">📤 Output</span>
                        {output && output.time && (
                            <span className="output-meta">
                                ⏱ {output.time}s
                                {output.memory ? ` · 💾 ${Math.round(output.memory / 1024)} KB` : ''}
                            </span>
                        )}
                    </div>
                    <div className="output-content">
                        {output === null && !running && (
                            <span className="output-placeholder">Run your code to see output... (Ctrl+Enter)</span>
                        )}
                        {running && (
                            <span className="output-running">⏳ Executing...</span>
                        )}
                        {output && output.error && (
                            <pre className="output-error">{output.error}</pre>
                        )}
                        {output && output.compile_output && (
                            <pre className="output-compile">{output.compile_output}</pre>
                        )}
                        {output && output.stderr && (
                            <pre className="output-stderr">{output.stderr}</pre>
                        )}
                        {output && output.stdout !== undefined && !output.error && (
                            <pre className="output-stdout">{output.stdout || '(no output)'}</pre>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
