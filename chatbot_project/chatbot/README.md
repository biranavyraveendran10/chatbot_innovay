# ChatBot - Web-Based Chatbot Application

A modern web-based chatbot with user authentication, built with Flask and SQLite.

## Features

- ✅ User Registration & Login
- ✅ Secure Password Hashing
- ✅ Clean Modern UI
- ✅ Real-time Chat Interface
- ✅ Chat History
- ✅ Rule-based Chatbot Responses
- ✅ Responsive Design

## Installation

### 1. Install Python Dependencies

```bash
cd chatbot
pip install -r requirements.txt
```

### 2. Run the Application

```bash
python app.py
```

The application will start on `http://localhost:5000`

## Usage

1. **Register**: Create a new account with username and password
2. **Login**: Log in with your credentials
3. **Chat**: Start chatting with the bot
4. **Logout**: Click logout to exit

## Project Structure

```
chatbot/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── chatbot.db            # SQLite database (created on first run)
├── templates/
│   ├── login.html        # Login page
│   ├── register.html     # Registration page
│   └── chat.html         # Chat interface
└── static/               # Static files (CSS, JS)
```

## Default Chatbot Responses

The chatbot recognizes:
- "hello", "hi" → Greetings
- "how are you" → Status check
- "what's your name" → Introduction
- "help" → Help message
- "bye", "thank you", "thanks" → Acknowledgements
- "good morning", "good night" → Time-based greetings

## Customization

To add more bot responses, edit the `get_chatbot_response()` function in `app.py`:

```python
responses = {
    'your_keyword': 'bot_response',
    'another_keyword': 'another_response',
}
```

## Security Notes

- Change the `secret_key` in app.py for production
- Enable HTTPS in production
- Use environment variables for sensitive data
- Consider adding rate limiting for production use

## Troubleshooting

**Port 5000 already in use:**
```bash
python app.py --port 5001
```

**Database errors:**
Delete `chatbot.db` and restart the application to reinitialize.

## Future Enhancements

- AI-powered responses using OpenAI API
- User profile customization
- Chat export functionality
- Admin panel for bot responses management
- Dark mode theme
