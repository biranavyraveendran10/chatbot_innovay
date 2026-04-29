# 🎤 Chatbot Voice Reply System - Complete Documentation

## System Architecture Overview

```
User Input → NLP Processing → Text Response → Audio Generation → Browser Playback
```

---

## 1. BACKEND FLOW (Python/Flask)

### Step 1: User Sends Message
- User types "hi" and clicks Send button
- Message sent to `/api/message` endpoint via JSON                                                

### Step 2: NLP Processing
```python 
def get_chatbot_response(user_message):
    # Convert to lowercase for matching
    user_message = user_message.lower()
    
    # Vectorize the input using trained vectorizer
    vect = vectorizer.transform([user_message])
    
    # Predict intent using Naive Bayes model
    intent_idx = model.predict(vect)[0]
    
    # Convert index back to intent label (e.g., "greeting")
    intent_label = encoder.inverse_transform([intent_idx])[0]
    
    # Return random response from matching intent
    return random.choice(responses_dict[intent_label])
```

**Example:** "hi" → Intent: "greeting" → Response: "Hello! How can I help you today?"

### Step 3: Text-to-Speech Conversion    
```python
def text_to_speech(text):
    # Initialize pyttsx3 engine
    engine = pyttsx3.init()
    
    # Set speech speed (150 words per minute)
    engine.setProperty('rate', 150)
    
    # Create unique audio filename with timestamp
    audio_file = f'uploads/response_{datetime.now().strftime("%Y%m%d%H%M%S%f")}.mp3'
    
    # Convert text to speech and save as MP3 file
    engine.save_to_file(text, audio_file)
    engine.runAndWait()
    
    return audio_file  # Returns: "uploads/response_20260129110254123456.mp3"
```

### Step 4: Send Response to Frontend
```python
@app.route('/api/message', methods=['POST'])
def send_message():
    response = get_chatbot_response(user_message)
    audio_file = text_to_speech(response)
    
    # Return JSON with both text and audio file path
    return jsonify({
        'response': response,      # Text reply
        'audio': audio_file        # Audio file path
    })
```

### Step 5: Serve Audio Files
```python
@app.route('/uploads/<path:filename>')
def download_file(filename):
    return send_file(os.path.join('uploads', filename), as_attachment=False)
```
Allows browser to access audio files from `/uploads/` folder

---

## 2. FRONTEND FLOW (JavaScript)

### Step 1: Send Message on Button Click
```javascript
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') sendMessage();
});
```

### Step 2: Fetch API Request
```javascript
async function sendMessage() {
    const message = messageInput.value.trim();
    
    // Send POST request to backend
    const response = await fetch('/api/message', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ message })
    });
    
    // Get JSON response with text + audio path
    const data = await response.json();
    // data = { response: "Hello! How can I help you today?", audio: "uploads/response_xxx.mp3" }
    
    addMessage(data.response, false, data.audio);
}
```

### Step 3: Display Message with Audio Player
```javascript
function addMessage(text, isUser, audioFile = null) {
    // Create message div
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
    
    // Add text
    messageDiv.appendChild(messageText);
    
    // If bot message has audio, add audio player
    if (!isUser && audioFile) {
        const audio = document.createElement('audio');
        audio.controls = true;  // Show play/pause buttons
        audio.src = '/' + audioFile;  // Path: /uploads/response_xxx.mp3
        audio.preload = 'auto';
        
        messageDiv.appendChild(audio);
    }
    
    // Add timestamp
    messageDiv.appendChild(timestamp);
    
    // Display in chat
    chatBox.appendChild(messageDiv);
}
```

---

## 3. DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Browser)                      │
│  ┌───────────────┐                                              │
│  │ User types    │ → Click Send                                 │
│  │ "hi"          │                                              │
│  └───────────────┘                                              │
│         ↓                                                         │
│  ┌──────────────────────────────────────────┐                   │
│  │ POST /api/message                        │                   │
│  │ { message: "hi" }                        │                   │
│  └──────────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND (Flask)                           │
│  ┌──────────────────────────────────────────┐                   │
│  │ NLP Processing:                          │                   │
│  │ "hi" → Intent: "greeting"                │                   │
│  └──────────────────────────────────────────┘                   │
│         ↓                                                         │
│  ┌──────────────────────────────────────────┐                   │
│  │ Get Response:                            │                   │
│  │ "Hello! How can I help you today?"       │                   │
│  └──────────────────────────────────────────┘                   │
│         ↓                                                         │
│  ┌──────────────────────────────────────────┐                   │
│  │ Text-to-Speech (pyttsx3):                │                   │
│  │ Generate MP3 file                        │                   │
│  │ Save to: uploads/response_xxx.mp3        │                   │
│  └──────────────────────────────────────────┘                   │
│         ↓                                                         │
│  ┌──────────────────────────────────────────┐                   │
│  │ Return JSON:                             │                   │
│  │ {                                        │                   │
│  │   response: "Hello! How can I help...",  │                   │
│  │   audio: "uploads/response_xxx.mp3"      │                   │
│  │ }                                        │                   │
│  └──────────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Browser)                      │
│  ┌──────────────────────────────────────────┐                   │
│  │ Display Message + Audio Player:          │                   │
│  │ "Hello! How can I help you today?"       │                   │
│  │ [▶ Play] [⏸ Pause] [Volume: ═══]        │                   │
│  └──────────────────────────────────────────┘                   │
│         ↓                                                         │
│  User clicks Play button to listen 🔊                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Key Technologies Used

| Component |             Technology                                   | Purpose |
|-----------|              -----------                                  |---------|
| **NLP Engine**        | Scikit-learn (Naive Bayes) |                 Intent classification |
| **Text-to-Speech**    |  pyttsx3 |                                   Convert text to audio |
| **Web Framework**     | Flask |                                      Backend API |
| **Database**          | SQLite |                                     Store chat history |
| **Frontend**          | HTML/CSS/JavaScript |                        User interface |

---

## 5. File Structure

```
uploads/
├── response_20260129110254123456.mp3  ← Generated audio files
├── response_20260129110312456789.mp3
└── ...

responses.json
├── intent: "greeting"
│   patterns: ["hello", "hi", "hey"]
│   responses: ["Hello! How can I help you today?", ...]
└── ...
```

---

## 6. Configuration Settings

```python
# Speech Speed
engine.setProperty('rate', 150)  # 150 words per minute

# Audio Format
Output format: MP3 (pyttsx3 on Windows uses system TTS)

# Storage
Location: /uploads/ folder
Naming: response_YYYYMMDDHHMMSS.mp3 (unique timestamp)
```

---

## 7. Error Handling

```javascript
try {
    // Make request
    const response = await fetch('/api/message', {...});
    const data = await response.json();
    addMessage(data.response, false, data.audio);
} catch (error) {
    // If error occurs, show fallback message
    addMessage('Oops! Something went wrong. Please try again.', false);
}
```

---

## 8. Summary: Complete Voice Reply Flow

1. **User types message** → "hi"
2. **JavaScript sends** → POST request to `/api/message`
3. **Backend processes** → NLP finds matching intent
4. **Backend generates** → Text response + MP3 audio file
5. **Backend returns** → JSON with text & audio path
6. **Frontend displays** → Message text + audio player
7. **User listens** → Clicks play button to hear voice response 🔊

---

## 9. API Endpoints

### POST /api/message
**Request:**
```json
{
    "message": "hi"
}
```

**Response:**
```json
{
    "response": "Hello! How can I help you today?",
    "audio": "uploads/response_20260129110254123456.mp3"
}
```

### GET /uploads/<filename>
- Serves audio files generated by text-to-speech
- Example: `/uploads/response_20260129110254123456.mp3`

---

## 10. How to Use the Voice System

### For Users:
1. Type a message in the chatbox (e.g., "hi", "hello", "what is AI?")
2. Click the **Send** button or press **Enter**
3. Bot responds with text message
4. Audio player appears below the text response
5. Click the **Play button** (▶) to listen to the voice response
6. Adjust volume or pause as needed

### For Developers:
- Modify speech speed in `app.py`: `engine.setProperty('rate', 150)`
- Change audio output format in pyttsx3 settings
- Add more intents/responses in `responses.json`
- Customize voice in pyttsx3: `engine.setProperty('voice', voice_id)`

---

## 11. Troubleshooting

| Issue | Solution |
|-------|----------|
| Send button not working | Clear browser cache (Ctrl+F5) and refresh |
| No audio file generated | Check if `/uploads` folder exists and is writable |
| Audio file not playing | Verify browser supports HTML5 audio element |
| Speech too fast/slow | Adjust `engine.setProperty('rate', X)` value |
| NLP not recognizing intent | Add more patterns to `responses.json` |

---

## 12. Dependencies

```
Flask==2.3.0
Werkzeug==2.3.0
pyttsx3==2.90
scikit-learn
googletrans==4.0.2
```

Install with:
```bash
pip install -r requirements.txt
```

---

## 13. 🌍 MULTILINGUAL VOICE SUPPORT (NEW FEATURE)

### Supported Languages
- **English** (en)
- **Tamil** (ta)
- **Sinhala** (si)
- **Hindi** (hi)

### How Multilingual Voice Works

#### Frontend - Language Selection
```javascript
let selectedLanguage = 'en';  // Default language

// Language selector event listeners
const langButtons = document.querySelectorAll('.lang-btn');
langButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        langButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        selectedLanguage = e.target.dataset.lang;
    });
});
```

**UI Components:**
```html
<div class="language-selector">
    <label>🌍 Language:</label>
    <div class="language-buttons">
        <button class="lang-btn active" data-lang="en">English</button>
        <button class="lang-btn" data-lang="ta">Tamil</button>
        <button class="lang-btn" data-lang="si">Sinhala</button>
        <button class="lang-btn" data-lang="hi">Hindi</button>
    </div>
</div>
```

**Styling:**
```css
.lang-btn {
    padding: 6px 14px;
    background: #333;
    border: 2px solid #444;
    border-radius: 6px;
    cursor: pointer;
    transition: 0.3s;
}

.lang-btn.active {
    background: #10a37f;
    color: white;
    box-shadow: 0 0 12px rgba(16, 163, 127, 0.4);
}
```

#### Backend - Translation and TTS

```python
# Translation function
def translate_text(text, target_lang):
    if target_lang == 'en' or translator is None:
        return text
    try:
        translation = translator.translate(text, src_language='en', dest_language=target_lang)
        return translation['text']
    except Exception as e:
        print(f"Translation error: {e}")
        return text

# Multilingual Text-to-Speech
def text_to_speech(text, language='en'):
    try:
        engine = pyttsx3.init()
        engine.setProperty('rate', 150)
        
        voices = engine.getProperty('voices')
        lang_code = language.lower()
        voice_found = False
        
        # Find voice matching selected language
        for voice in voices:
            if lang_code in voice.languages or lang_code in voice.id.lower():
                engine.setProperty('voice', voice.id)
                voice_found = True
                break
        
        # Create and save audio file
        audio_file = f'uploads/response_{datetime.now().strftime("%Y%m%d%H%M%S%f")}.mp3'
        engine.save_to_file(text, audio_file)
        engine.runAndWait()
        return audio_file
    except Exception as e:
        print(f"Error generating speech: {e}")
        return None
```

#### Updated API Endpoint

```python
@app.route('/api/message', methods=['POST'])
@login_required
def send_message():
    data = request.get_json()
    user_message = data.get('message', '').strip()
    language = data.get('language', 'en').lower()  # New: language parameter
    
    if not user_message:
        return jsonify({'error': 'Message cannot be empty'}), 400
    
    # Get chatbot response (always in English first)
    response = get_chatbot_response(user_message)
    
    # Translate response to target language if needed
    translated_response = response
    if language != 'en' and translator:
        try:
            translation = translator.translate(response, src_language='en', dest_language=language)
            translated_response = translation['text']
        except Exception as e:
            print(f"Translation error: {e}")
            translated_response = response
    
    # Generate audio for the translated response
    audio_file = text_to_speech(translated_response, language)
    
    # Save to chat history
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('INSERT INTO chat_history (user_id, message, response) VALUES (?, ?, ?)',
              (session['user_id'], user_message, translated_response))
    conn.commit()
    conn.close()
    
    return jsonify({'response': translated_response, 'audio': audio_file})
```

#### Updated JavaScript - Send with Language

```javascript
async function sendMessage() { 
    const message = messageInput.value.trim();
    if (!message) return;

    addMessage(message, true);
    messageInput.value = '';
    messageInput.focus();

    try {
        const response = await fetch('/api/message', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
                message,
                language: selectedLanguage  // Include selected language
            })
        });

        const data = await response.json();
        addMessage(data.response, false, data.audio);
    } catch (error) {
        addMessage('Oops! Something went wrong. Please try again.', false);
        console.error('Error:', error);
    }
}
```

### Multilingual Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                     FRONTEND (Browser)                       │
│                                                              │
│  User clicks language: Tamil 🌍                             │
│  ↓                                                           │
│  selectedLanguage = 'ta'                                    │
│                                                              │
│  User types: "hi"                                           │
│  ↓                                                           │
│  POST /api/message                                          │
│  { message: "hi", language: "ta" }                          │
└──────────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────────┐
│                    BACKEND (Flask)                           │
│                                                              │
│  Step 1: Process Message (English)                          │
│  "hi" → NLP → Intent: "greeting"                            │
│  Response: "Hello! How can I help you today?"               │
│                                                              │
│  Step 2: Translate to Tamil                                 │
│  English: "Hello! How can I help you today?"                │
│  ↓ (Google Translate)                                       │
│  Tamil: "வணக்கம்! நான் உங்களுக்கு எப்படி உதவ முடியும்?" │
│                                                              │
│  Step 3: Generate Tamil TTS Audio                           │
│  "வணக்கம்! நான் உங்களுக்கு..." → MP3 Audio File           │
│                                                              │
│  Step 4: Return Response                                    │
│  {                                                           │
│    response: "வணக்கம்! நான் உங்களுக்கு...",               │
│    audio: "uploads/response_xxx.mp3"                        │
│  }                                                           │
└──────────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────────┐
│                    FRONTEND (Browser)                        │
│                                                              │
│  Display:                                                   │
│  - Text in Tamil: "வணக்கம்! நான் உங்களுக்கு..."           │
│  - Auto-plays Tamil voice 🔊                                │
│  - User hears Tamil response                                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Key Features of Multilingual Support

1. **Automatic Translation**: Backend translates English responses to selected language
2. **Language-Specific Voice**: TTS generates audio in the selected language
3. **Auto-Play**: Voice automatically plays without user clicking
4. **No Play Button**: Audio player is hidden, responses are seamless
5. **Language Persistence**: Selected language remains active during session
6. **Visual Feedback**: Active language button highlighted in green (#10a37f)

### Example Scenarios

**Scenario 1: Tamil Speaker**
```
User selects: Tamil
User types: "hi"
Bot responds in Tamil: "வணக்கம்! நான் உங்களுக்கு எப்படி உதவ முடியும்?"
Voice plays: Tamil TTS automatically
```

**Scenario 2: Sinhala Speaker**
```
User selects: Sinhala
User types: "what is python"
Bot responds in Sinhala: "පයිතන් ඉතා සරල සහ ව්‍යාප්ත භාෂාවක්..."
Voice plays: Sinhala TTS automatically
```

**Scenario 3: Hindi Speaker**
```
User selects: Hindi
User types: "thank you"
Bot responds in Hindi: "आपका स्वागत है!"
Voice plays: Hindi TTS automatically
```

### Configuration for Multilingual Support

```python
# Language codes used
LANGUAGE_CODES = {
    'en': 'English',
    'ta': 'Tamil',
    'si': 'Sinhala',
    'hi': 'Hindi'
}

# Translation service
from googletrans import Translator
translator = Translator()

# Speech rate (applies to all languages)
engine.setProperty('rate', 150)  # Words per minute
```

### Troubleshooting Multilingual Features

| Issue | Solution |
|-------|----------|
| Translation not working | Check internet connection (Google Translate API needs it) |
| Language voice not available | Falls back to default system voice |
| Audio in wrong language | Clear browser cache and refresh |
| Translation inaccurate | Add context hints or rephrase bot responses in responses.json |

---

**Document Generated:** February 3, 2026
**Chatbot Version:** 2.0 with Multilingual Voice Support
**Status:** Fully Functional ✅
