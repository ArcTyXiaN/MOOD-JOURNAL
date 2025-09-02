from flask import Flask, render_template, request, jsonify
import mysql.connector
import requests
from datetime import datetime, timedelta
from collections import Counter

app = Flask(__name__, static_folder="static", template_folder="templates")

# Database config
db_config = {
    'host': 'localhost',
    'user': 'moodjournal',
    'password': '1234',
    'database': 'mood_journal'
}

HF_API_KEY = "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"  # your key here
HF_API_URL = "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english"
HF_HEADERS = {"Authorization": f"Bearer {HF_API_KEY}"}


def get_db_connection():
    return mysql.connector.connect(**db_config)

def analyze_mood_hf(text):
    try:
        print(f"Analyzing mood for text: {text[:50]}...")  # Debug log
        
        headers = {"Authorization": f"Bearer {HF_API_KEY}"}
        payload = {"inputs": text}
        
        response = requests.post(HF_API_URL, headers=headers, json=payload, timeout=30)
        print(f"HuggingFace API response status: {response.status_code}")  # Debug log
        
        result = response.json()
        print(f"HuggingFace API result: {result}")  # Debug log
        
        # If the API returns an error
        if isinstance(result, dict) and result.get("error"):
            print(f"HuggingFace API error: {result.get('error')}")
            return {"mood": "Neutral", "confidence": 0}

        # Handle the case where the model is still loading
        if isinstance(result, dict) and "estimated_time" in result:
            print("Model is loading, returning neutral mood")
            return {"mood": "Neutral", "confidence": 0}

        # Example: result = [{'label': 'POSITIVE', 'score': 0.95}]
        if isinstance(result, list) and len(result) > 0:
            label = result[0]['label']
            score = result[0]['score'] * 100
            mood = "Happy" if label == "POSITIVE" else "Sad"
            return {"mood": mood, "confidence": round(score, 2)}
        else:
            print("Unexpected result format from HuggingFace API")
            return {"mood": "Neutral", "confidence": 0}
            
    except requests.exceptions.Timeout:
        print("HuggingFace API timeout")
        return {"mood": "Neutral", "confidence": 0}
    except Exception as e:
        print(f"Error in mood analysis: {str(e)}")
        return {"mood": "Neutral", "confidence": 0}

# Routes
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

# API Endpoints for Dashboard Data
@app.route('/api/dashboard-summary')
def dashboard_summary():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get entries from this week
        week_ago = datetime.now() - timedelta(days=7)
        cursor.execute("SELECT COUNT(*) as count FROM entries WHERE created_at >= %s", (week_ago,))
        entries_week = cursor.fetchone()['count']
        
        # Get most common mood
        cursor.execute("SELECT mood FROM entries WHERE mood IS NOT NULL")
        moods = [row['mood'] for row in cursor.fetchall()]
        most_common = Counter(moods).most_common(1)
        common_mood = most_common[0][0] if most_common else "No data"
        
        # Calculate streak (consecutive days with entries)
        cursor.execute("""
            SELECT DATE(created_at) as entry_date 
            FROM entries 
            ORDER BY created_at DESC
        """)
        dates = [row['entry_date'] for row in cursor.fetchall()]
        
        streak = 0
        current_date = datetime.now().date()
        for i, entry_date in enumerate(dates):
            if entry_date == current_date - timedelta(days=i):
                streak += 1
            else:
                break
        
        # Get days logged this month
        cursor.execute("""
            SELECT COUNT(DISTINCT DATE(created_at)) as days 
            FROM entries 
            WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) 
            AND YEAR(created_at) = YEAR(CURRENT_DATE())
        """)
        days_logged = cursor.fetchone()['days']
        
        conn.close()
        
        return jsonify({
            'entries_week': entries_week,
            'common_mood': common_mood,
            'streak': streak,
            'days_logged': days_logged
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/mood-trends')
def mood_trends():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get last 7 days of mood data
        cursor.execute("""
            SELECT DATE(created_at) as date, AVG(mood_scale) as avg_mood
            FROM entries 
            WHERE created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date
        """)
        
        results = cursor.fetchall()
        conn.close()
        
        # Prepare data for Chart.js
        labels = []
        data = []
        
        # Fill in the last 7 days
        for i in range(6, -1, -1):
            date = datetime.now().date() - timedelta(days=i)
            day_name = date.strftime('%a')
            labels.append(day_name)
            
            # Find matching data or use 0
            found_data = next((r['avg_mood'] for r in results if r['date'] == date), 0)
            data.append(float(found_data) if found_data else 0)
        
        return jsonify({
            'labels': labels,
            'data': data
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/recent-entries')
def recent_entries():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT entry_text, mood, DATE_FORMAT(created_at, '%M %e') as formatted_date
            FROM entries 
            ORDER BY created_at DESC 
            LIMIT 5
        """)
        
        entries = cursor.fetchall()
        conn.close()
        
        return jsonify({'entries': entries})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/entry', methods=['GET', 'POST'])
def entry():
    if request.method == 'POST':
        try:
            print("POST request received")  # Debug log
            
            text = request.form.get('journal_text')
            tags = request.form.get('tags')
            mood_scale = request.form.get('mood_scale')
            
            print(f"Received data: text={text}, tags={tags}, mood_scale={mood_scale}")  # Debug log
            
            if not text:
                return jsonify({"success": False, "error": "No journal text provided"}), 400
            
            mood_scale = int(mood_scale) if mood_scale else 5
            user_id = 1  # Default user for now

            print("Starting mood analysis...")  # Debug log
            
            # Analyze mood via Hugging Face
            analysis = analyze_mood_hf(text)
            mood = analysis["mood"]
            confidence = analysis["confidence"]
            
            print(f"Mood analysis result: mood={mood}, confidence={confidence}")  # Debug log

            # Save to MySQL
            print("Saving to database...")  # Debug log
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO entries (user_id, entry_text, mood, confidence, tags, mood_scale)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (user_id, text, mood, confidence, tags, mood_scale))
            conn.commit()
            conn.close()
            
            print("Entry saved successfully!")  # Debug log

            return jsonify({"success": True, "mood": mood, "confidence": confidence})
            
        except Exception as e:
            print(f"Error in entry route: {str(e)}")  # Debug log
            return jsonify({"success": False, "error": str(e)}), 500

    return render_template('entry.html')

@app.route('/settings')
def settings():
    return render_template('settings.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/privacy')
def privacy():
    return render_template('privacy.html')

if __name__ == '__main__':
    app.run(debug=True)
