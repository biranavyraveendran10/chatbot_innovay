
from flask import Flask, render_template, request, jsonify, session, redirect, url_for, send_file
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import sqlite3
import os
from functools import wraps
from datetime import datetime, timedelta, timezone
import json
import random
from gtts import gTTS
import tempfile
import uuid

# NLP imports
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.preprocessing import LabelEncoder
from sklearn.naive_bayes import MultinomialNB

# Translation imports
import requests
import json    

print("✓ Translation module ready (using MyMemory API)")

# Language code mapping
LANGUAGE_MAP = {
    'en': 'en',
    'ta': 'ta',
    'si': 'si',
    'hi': 'hi'
}

app = Flask(__name__)
app.secret_key = 'your-secret-key-change-this'
DATABASE = 'chatbot.db'
RESPONSES_FILE = 'responses.json'  # JSON file with intents

# ---------------- Initialize database ----------------
def init_db():
    if not os.path.exists(DATABASE):
        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()
        c.execute('''CREATE TABLE users
                     (id INTEGER PRIMARY KEY AUTOINCREMENT,
                      username TEXT UNIQUE NOT NULL,
                      password TEXT NOT NULL,
                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
        
        c.execute('''CREATE TABLE chat_history
                     (id INTEGER PRIMARY KEY AUTOINCREMENT,
                      user_id INTEGER NOT NULL,
                      message TEXT NOT NULL,
                      response TEXT NOT NULL,
                      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                      FOREIGN KEY(user_id) REFERENCES users(id))''')
        conn.commit()
        conn.close()

init_db()

# ---------------- Login required decorator ----------------
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# ---------------- Load chatbot responses from JSON ----------------
with open(RESPONSES_FILE, 'r') as f:
    data = json.load(f)

patterns = []
labels = []
responses_dict = {}

for item in data:
    intent = item['intent']
    responses_dict[intent] = item['responses']
    for pattern in item['patterns']:
        patterns.append(pattern.lower())
        labels.append(intent)

# Vectorizer and Encoder
vectorizer = CountVectorizer()
X = vectorizer.fit_transform(patterns)

encoder = LabelEncoder()
y = encoder.fit_transform(labels)

# Train Naive Bayes model
model = MultinomialNB()
model.fit(X, y)

# Create uploads folder if it doesn't exist
if not os.path.exists('uploads'):
    os.makedirs('uploads')

# ---------------- NLP Chatbot function ----------------
def get_chatbot_response(user_message):
    user_message = user_message.lower()
    vect = vectorizer.transform([user_message])
    intent_idx = model.predict(vect)[0]
    intent_label = encoder.inverse_transform([intent_idx])[0]
    return random.choice(responses_dict[intent_label])

# Function to translate text to target language using MyMemory API
def translate_text(text, language):
    """Translate text using MyMemory Translation API"""
    if language == 'en':
        return text
    
    try:
        # Language mapping for MyMemory API
        lang_map = {
            'ta': 'ta',   # Tamil
            'si': 'si',   # Sinhala  
            'hi': 'hi'    # Hindi
        }
        
        target_lang = lang_map.get(language)
        if not target_lang:
            print(f"✗ Unknown language: {language}")
            return text
        
        # Use MyMemory Translation API
        url = f'https://api.mymemory.translated.net/get'
        params = {
            'q': text,
            'langpair': f'en|{target_lang}'
        }
        
        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        
        data = response.json()
        if data['responseStatus'] == 200:
            result = data['responseData']['translatedText']
            print(f"✓ [MyMemory] Translated to {language}: {result[:60]}...")
            return result
        else:
            print(f"✗ Translation API error: {data['responseStatus']}")
            return text
            
    except Exception as e:
        print(f"✗ Translation error for '{language}': {str(e)}")
        return text
        return text

# Function to generate voice audio in multiple languages
def text_to_speech(text, language='en'):
    try:
        # gTTS language codes
        gtts_lang_map = {
            'en': 'en',
            'ta': 'ta',
            'si': 'si',
            'hi': 'hi'
        }

        lang_code = gtts_lang_map.get(language, 'en')

        audio_file = f'uploads/response_{datetime.now().strftime("%Y%m%d%H%M%S%f")}.mp3'
        
        tts = gTTS(text=text, lang=lang_code, slow=False)
        tts.save(audio_file)

        print(f"🔊 Voice generated in {language}")
        return audio_file

    except Exception as e:
        print(f"Voice generation error: {e}")
        return None

# ---------------- Routes ----------------
@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('chat'))
    return redirect(url_for('login'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        confirm_password = request.form['confirm_password']
        if not username or not password:
            return render_template('register.html', error='Username and password required')
        if password != confirm_password:
            return render_template('register.html', error='Passwords do not match')
        if len(password) < 4:
            return render_template('register.html', error='Password must be at least 4 characters')
        try:
            conn = sqlite3.connect(DATABASE)
            c = conn.cursor()
            hashed_password = generate_password_hash(password)
            c.execute('INSERT INTO users (username, password) VALUES (?, ?)', (username, hashed_password))
            conn.commit()
            conn.close()
            return redirect(url_for('login'))
        except sqlite3.IntegrityError:
            return render_template('register.html', error='Username already exists')
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()
        c.execute('SELECT id, password FROM users WHERE username = ?', (username,))
        user = c.fetchone()
        conn.close()
        if user and check_password_hash(user[1], password):
            session['user_id'] = user[0]
            session['username'] = username
            return redirect(url_for('chat'))
        return render_template('login.html', error='Invalid username or password')
    return render_template('login.html')

@app.route('/chat')
@login_required
def chat():
    return render_template('chat.html', username=session.get('username'))

@app.route('/api/transcribe', methods=['POST'])
@login_required
def transcribe_audio():
    """Transcribe audio using Speech Recognition"""
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    audio_file = request.files['audio']
    language = (request.form.get('language', 'en') or 'en').lower()

    # Import speech recognition inside the route so the app can still start
    # even if the package isn't installed yet.
    import speech_recognition as sr

    # Language code mapping for Google Speech Recognition
    lang_code_map = {
        'en': 'en-US',
        'ta': 'ta-IN',
        'si': 'si-LK',
        'hi': 'hi-IN'
    }
    lang_code = lang_code_map.get(language, 'en-US')

    raw_path = None
    wav_path = None

    try:
        original_name = secure_filename(audio_file.filename or '')
        _, ext = os.path.splitext(original_name)
        ext = (ext or '').lower()
        if ext not in {'.wav', '.flac', '.aiff', '.aif', '.webm', '.ogg', '.m4a', '.mp3'}:
            # Browser MediaRecorder commonly sends webm/ogg without an extension.
            ext = '.webm'

        # Save into a real temp folder (not uploads) and use a unique name
        tmp_dir = tempfile.gettempdir()
        raw_path = os.path.join(tmp_dir, f'voice_{uuid.uuid4().hex}{ext}')
        audio_file.save(raw_path)

        # SpeechRecognition's AudioFile supports WAV/AIFF/FLAC only.
        # If the upload is not one of those, convert to WAV.
        if ext in {'.wav', '.flac', '.aiff', '.aif'}:
            wav_path = raw_path
        else:
            try:
                from pydub import AudioSegment
            except Exception:
                return jsonify({
                    'error': 'Server is missing audio conversion support. Please install pydub (and ffmpeg) or use text input.'
                }), 500

            wav_path = os.path.join(tmp_dir, f'voice_{uuid.uuid4().hex}.wav')
            try:
                audio_seg = AudioSegment.from_file(raw_path)
                audio_seg = audio_seg.set_channels(1).set_frame_rate(16000)
                audio_seg.export(wav_path, format='wav')
            except Exception as e:
                print(f"✗ Audio conversion failed: {e}")
                return jsonify({
                    'error': 'Could not read/convert the recorded audio. On Windows, install ffmpeg and try again.'
                }), 400

        recognizer = sr.Recognizer()
        with sr.AudioFile(wav_path) as source:
            audio_data = recognizer.record(source)

        try:
            transcribed_text = recognizer.recognize_google(audio_data, language=lang_code)
        except sr.UnknownValueError:
            return jsonify({'error': 'Could not understand audio. Please try again.'}), 400
        except sr.RequestError as e:
            # This is usually network / Google service issues
            print(f"✗ Speech recognition request error: {e}")
            return jsonify({'error': 'Speech recognition service error. Please check internet and try again.'}), 502

        return jsonify({'transcribed_text': transcribed_text})

    except Exception as e:
        # IMPORTANT: always return JSON, never an HTML error page
        print(f"✗ Transcription error: {e}")
        return jsonify({'error': 'Transcription failed on server. Please try again.'}), 500

    finally:
        # Always clean up temp files
        for path in {raw_path, wav_path}:
            try:
                if path and os.path.exists(path):
                    os.remove(path)
            except Exception:
                pass

@app.route('/api/message', methods=['POST'])

@login_required
def send_message():
    data = request.get_json()
    user_message = data.get('message', '').strip()
    language = data.get('language', 'en').lower()
    
    if not user_message:
        return jsonify({'error': 'Message cannot be empty'}), 400
    
    print(f"\n📨 User: {user_message} | Language: {language}")
    
    # Get chatbot response (always in English first)
    response = get_chatbot_response(user_message)
    print(f"🤖 Bot (EN): {response[:60]}...")
    
    # Translate response to target language if needed
    translated_response = response
    if language != 'en':
        print(f"🌍 Translating to {language}...")
        translated_response = translate_text(response, language)
        print(f"✅ Final Response ({language}): {translated_response[:60]}...")
    
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

@app.route('/api/history')
@login_required
def get_history():
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('SELECT message, response, timestamp FROM chat_history WHERE user_id = ? ORDER BY timestamp DESC LIMIT 10',
             (session['user_id'],))
    messages = c.fetchall()
    conn.close()
    return jsonify({'messages': messages})

@app.route('/history')
@login_required
def history():
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('SELECT message, response, timestamp FROM chat_history WHERE user_id = ? ORDER BY timestamp DESC',
             (session['user_id'],))
    messages = c.fetchall()
    conn.close()
    from collections import defaultdict
    history_by_date = defaultdict(list)
    for message, response, timestamp in messages:
        date_obj = datetime.strptime(timestamp, '%Y-%m-%d %H:%M:%S')
        sri_lanka_tz = timezone(timedelta(hours=5, minutes=30))
        utc_time = date_obj.replace(tzinfo=timezone.utc)
        sri_lanka_time = utc_time.astimezone(sri_lanka_tz)
        date_str = sri_lanka_time.strftime('%A, %B %d, %Y')
        time_str = sri_lanka_time.strftime('%I:%M:%S %p')
        history_by_date[date_str].append({
            'message': message,
            'response': response,
            'time': time_str,
            'timestamp': timestamp
        })
    return render_template('history.html', username=session.get('username'), history_by_date=history_by_date)

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

# Serve uploaded audio files
@app.route('/uploads/<path:filename>')
def download_file(filename):
    return send_file(os.path.join('uploads', filename), as_attachment=False)

# ---------------- Run server ----------------
if __name__ == '__main__':
    app.run(debug=True, port=5000)

