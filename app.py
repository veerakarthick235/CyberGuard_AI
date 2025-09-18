# app.py
import os
import google.generativeai as genai
from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv
import json

load_dotenv()

app = Flask(__name__)

try:
    genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
    model = genai.GenerativeModel('gemini-1.5-flash')
except KeyError:
    print("ERROR: Google API Key not found. Please set it in the .env file.")
    exit()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/generate-email', methods=['POST'])
def generate_email():
    """Generates a new phishing email with adaptive difficulty."""
    try:
        data = request.get_json()
        score = data.get('score', 0)

        # Determine difficulty based on score
        if score < 50:
            difficulty = "easy, with obvious red flags like spelling mistakes or generic greetings."
        elif score < 150:
            difficulty = "medium, with more subtle red flags. The sender and branding should look more legitimate."
        else:
            difficulty = "hard and sophisticated, mimicking a targeted spear-phishing attack with very subtle, clever red flags."

        prompt = f"""
        Generate a phishing email for a university student. The difficulty must be {difficulty}
        The email must be in a clean JSON format with four keys:
        1. "sender": The fake sender's email address.
        2. "subject": The email subject line.
        3. "body": The email content, using newline characters (\\n).
        4. "category": The type of phishing attack (e.g., 'Urgency Scam', 'Credential Harvesting', 'Fake Invoice', 'Malware Link').
        """
        response = model.generate_content(prompt)
        cleaned_text = response.text.strip().replace('```json', '').replace('```', '')
        email_data = json.loads(cleaned_text)
        return jsonify(email_data)
    except Exception as e:
        print(f"Error generating email: {e}")
        return jsonify({"error": "Failed to generate email"}), 500

@app.route('/api/analyze-choice', methods=['POST'])
def analyze_choice():
    """Analyzes the user's choice and provides feedback."""
    try:
        data = request.get_json()
        email = data.get('email')
        user_choice = data.get('choice')

        prompt = f"""
        Analyze the following email. The email is a phishing attempt.
        The user was shown an email from '{email['sender']}' with the subject '{email['subject']}'.
        The user decided this email was '{user_choice}'.
        Is the user's choice correct?
        Provide your analysis as a clean JSON object with two keys:
        1. "is_correct": a boolean (true or false).
        2. "explanation": A brief, one or two-sentence explanation for why the user was right or wrong, highlighting the key red flags.
        """
        response = model.generate_content(prompt)
        cleaned_text = response.text.strip().replace('```json', '').replace('```', '')
        analysis_data = json.loads(cleaned_text)
        return jsonify(analysis_data)
    except Exception as e:
        print(f"Error analyzing choice: {e}")
        return jsonify({"error": "Failed to analyze choice"}), 500

if __name__ == '__main__':
    app.run(debug=True)