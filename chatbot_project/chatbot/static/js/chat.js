const chatBox = document.getElementById('chatBox');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const voiceBtn = document.getElementById('voiceBtn');
const voiceStatus = document.getElementById('voiceStatus');
const langDropdown = document.getElementById('langDropdown');

let selectedLanguage = 'en';  // Default language
let isRecording = false;
let mediaRecorder;
let audioChunks = [];
let micStream = null;

// Language selector event listener
langDropdown.addEventListener('change', (e) => {
    selectedLanguage = e.target.value;
});

// Initialize Web Speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
let isRecognitionRunning = false;

// Speech recognition language mapping
const speechLangMap = {
    'en': 'en-US',
    'ta': 'ta-IN',
    'si': 'si-LK',
    'hi': 'hi-IN'
};

if (recognition) {
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = speechLangMap[selectedLanguage];

    recognition.onstart = () => {
        isRecognitionRunning = true;
    };
    recognition.onend = () => {
        isRecognitionRunning = false;
    };
}

// Handle voice button click
voiceBtn.addEventListener('click', () => {
    if (!isRecording) {
        startVoiceRecording();
    } else {
        stopVoiceRecording();
    }
});

function startVoiceRecording() {
    isRecording = true;
    voiceBtn.classList.add('recording');
    voiceStatus.style.display = 'flex';
    messageInput.value = ''; // Clear input
    audioChunks = [];
    
    // Update language for speech recognition
    if (recognition) {
        recognition.lang = speechLangMap[selectedLanguage];
    }
    
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            micStream = stream;
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };
            mediaRecorder.onstop = () => {
                const mimeType = (mediaRecorder && mediaRecorder.mimeType) ? mediaRecorder.mimeType : 'audio/webm';
                const audioBlob = new Blob(audioChunks, { type: mimeType });
                processVoiceMessage(audioBlob);
            };
            mediaRecorder.start();

            // Start browser speech recognition (best-effort).
            // Guard to avoid: "recognition has already started"
            if (recognition) {
                try {
                    if (isRecognitionRunning) {
                        recognition.stop();
                    }
                    recognition.start();
                } catch (e) {
                    console.warn('SpeechRecognition start failed:', e);
                }
            }
        })
        .catch(error => {
            console.error('Microphone access denied:', error);
            addMessage('❌ Microphone access denied. Please allow microphone access.', false);
            stopVoiceRecording();
        });
}

function stopVoiceRecording() {
    if (isRecording) {
        isRecording = false;
        voiceBtn.classList.remove('recording');
        voiceStatus.style.display = 'none';
        
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }

        // Stop microphone stream tracks
        if (micStream) {
            try {
                micStream.getTracks().forEach(t => t.stop());
            } catch (e) {
                console.warn('Failed to stop mic tracks:', e);
            }
            micStream = null;
        }

        // Stop speech recognition safely
        if (recognition && isRecognitionRunning) {
            try {
                recognition.stop();
            } catch (e) {
                console.warn('SpeechRecognition stop failed:', e);
            }
        }
    }
}

// Handle speech recognition results
if (recognition) {
    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }

        // If the browser produces a final transcript, show it in the input box.
        // (The server-side transcription is still the source of truth.)
        if (event.results && event.results[event.results.length - 1] && event.results[event.results.length - 1].isFinal) {
            messageInput.value = transcript;
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        // "network" often means the browser's speech service can't be reached.
        // We can still try server-side transcription.
        if (event.error !== 'network') {
            addMessage('❌ Speech recognition error: ' + event.error, false);
        } else {
            console.warn('Browser speech network error; continuing with server transcription.');
        }
    };
}

async function processVoiceMessage(audioBlob) {
    try {
        const formData = new FormData();
        const fileExt = (audioBlob.type && audioBlob.type.includes('ogg')) ? 'ogg' : 'webm';
        formData.append('audio', audioBlob, `voice_message.${fileExt}`);
        formData.append('language', selectedLanguage);
        
        const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData
        });
        
        const contentType = response.headers.get('content-type') || '';
        let data;
        if (contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            throw new Error(`Server returned non-JSON response (${response.status}). ${text.slice(0, 200)}`);
        }
        
        if (response.ok) {
            messageInput.value = data.transcribed_text;
            // Auto-send the message
            await sendMessage();
        } else {
            addMessage('❌ ' + (data.error || 'Failed to transcribe audio'), false);
            console.error('Transcribe API error:', data);
        }
    } catch (error) {
        console.error('Error processing voice message:', error);
        addMessage('❌ Error processing voice message. Please try again.', false);
    }
}

function createBotAvatar() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'bot-avatar');
    svg.setAttribute('viewBox', '0 0 100 100');
    
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', 'neon-gradient');
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '100%');
    gradient.setAttribute('y2', '100%');
    
    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('style', 'stop-color:#10a37f;stop-opacity:1');
    
    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('style', 'stop-color:#0d9d70;stop-opacity:1');
    
    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    svg.appendChild(defs);
    
    // Brain center
    const centerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    centerCircle.setAttribute('cx', '50');
    centerCircle.setAttribute('cy', '50');
    centerCircle.setAttribute('r', '15');
    centerCircle.setAttribute('fill', 'url(#neon-gradient)');
    svg.appendChild(centerCircle);
    
    // Neural connections
    const connections = [
        { x1: 50, y1: 50, x2: 25, y2: 25 },
        { x1: 50, y1: 50, x2: 75, y2: 25 },
        { x1: 50, y1: 50, x2: 25, y2: 75 },
        { x1: 50, y1: 50, x2: 75, y2: 75 }
    ];
    
    connections.forEach(conn => {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', conn.x1);
        line.setAttribute('y1', conn.y1);
        line.setAttribute('x2', conn.x2);
        line.setAttribute('y2', conn.y2);
        line.setAttribute('stroke', '#10a37f');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('opacity', '0.7');
        svg.appendChild(line);
    });
    
    // Outer nodes
    const nodes = [
        { cx: 25, cy: 25 },
        { cx: 75, cy: 25 },
        { cx: 25, cy: 75 },
        { cx: 75, cy: 75 }
    ];
    
    nodes.forEach(node => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', node.cx);
        circle.setAttribute('cy', node.cy);
        circle.setAttribute('r', '6');
        circle.setAttribute('fill', '#10a37f');
        circle.setAttribute('opacity', '0.8');
        svg.appendChild(circle);
    });
    
    return svg;
}

function addMessage(text, isUser, audioFile = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
    
    // Add bot avatar for bot messages
    if (!isUser) {
        messageDiv.appendChild(createBotAvatar());
    }
    
    const messageText = document.createElement('div');
    messageText.className = 'message-text typing-effect';
    messageText.textContent = '';
    
    // Typing animation for bot messages
    if (!isUser) {
        let charIndex = 0;
        const typingSpeed = 20; // milliseconds
        
        const typeChar = () => {
            if (charIndex < text.length) {
                messageText.textContent += text[charIndex];
                charIndex++;
                setTimeout(typeChar, typingSpeed);
            } else {
                messageText.classList.remove('typing-effect');
                if (audioFile) {
                    playAudio(audioFile);
                }
            }
        };
        typeChar();
    } else {
        messageText.textContent = text;
        messageText.classList.remove('typing-effect');
    }
    
    messageDiv.appendChild(messageText);
    
    const now = new Date();
    const sriLankaTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000) - (now.getTimezoneOffset() * 60 * 1000));
    const timeStr = sriLankaTime.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });

    const timestamp = document.createElement('div');
    timestamp.className = 'message-timestamp';
    timestamp.textContent = timeStr;

    messageDiv.appendChild(timestamp);
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;  
}

function playAudio(audioFile) {
    const audio = new Audio('/' + audioFile);
    audio.autoplay = true;
}

function showThinkingIndicator() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot';
    messageDiv.id = 'thinking-message';
    
    messageDiv.appendChild(createBotAvatar());
    
    const thinkingBubble = document.createElement('div');
    thinkingBubble.className = 'thinking-bubble';
    
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'thinking-dot';
        thinkingBubble.appendChild(dot);
    }
    
    const thinkingText = document.createElement('span');
    thinkingText.className = 'thinking-text';
    thinkingText.textContent = 'thinking...';
    thinkingBubble.appendChild(thinkingText);
    
    messageDiv.appendChild(thinkingBubble);
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function removeThinkingIndicator() {
    const thinkingMessage = document.getElementById('thinking-message');
    if (thinkingMessage) {
        thinkingMessage.remove();
    }
}

async function sendMessage() { 
    const message = messageInput.value.trim();
    if (!message) return;

    addMessage(message, true);
    messageInput.value = '';
    messageInput.focus();

    try {
        showThinkingIndicator();
        
        const response = await fetch('/api/message', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ message, language: selectedLanguage })
        });

        const data = await response.json();
        removeThinkingIndicator();
        addMessage(data.response, false, data.audio);
    } catch (error) {
        removeThinkingIndicator();
        addMessage('Oops! Something went wrong. Please try again.', false);
        console.error('Error:', error);
    }
}

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') sendMessage();
});

messageInput.focus();

