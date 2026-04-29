import json
import random
import pickle
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.preprocessing import LabelEncoder
from sklearn.naive_bayes import MultinomialNB

# Load intents
with open('responses.json', 'r') as f:
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

# Vectorizer & Encoder
vectorizer = CountVectorizer()
X = vectorizer.fit_transform(patterns)

encoder = LabelEncoder()
y = encoder.fit_transform(labels)

# Train Naive Bayes model
model = MultinomialNB()
model.fit(X, y)

# Save all objects
with open('model.pkl', 'wb') as f:
    pickle.dump(model, f)

with open('vectorizer.pkl', 'wb') as f:
    pickle.dump(vectorizer, f)

with open('encoder.pkl', 'wb') as f:
    pickle.dump(encoder, f)

with open('responses_dict.pkl', 'wb') as f:
    pickle.dump(responses_dict, f)

print("Training done! .pkl files created successfully.")
