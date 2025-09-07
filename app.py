from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

# Quiz Questions
quiz_questions = [
    {
        "question": "Do you enjoy solving puzzles or logical problems?",
        "options": ["Yes", "No"],
        "scores": {"Science": 2, "Commerce": 1}
    },
    {
        "question": "Do you prefer creative activities like art, writing, or music?",
        "options": ["Yes", "No"],
        "scores": {"Arts": 2}
    },
    {
        "question": "Are you interested in how businesses or money work?",
        "options": ["Yes", "No"],
        "scores": {"Commerce": 2}
    },
    {
        "question": "Do you enjoy working with computers or technology?",
        "options": ["Yes", "No"],
        "scores": {"Science": 2}
    },
    {
        "question": "Would you prefer a hands-on job over a desk job?",
        "options": ["Yes", "No"],
        "scores": {"Vocational": 2}
    }
]

# Stream → Courses & Careers Map
stream_course_career_map = {
    "Science": {
        "courses": ["BSc", "B.Tech", "MBBS"],
        "careers": ["Engineer", "Doctor", "Scientist"]
    },
    "Arts": {
        "courses": ["BA", "BFA", "BJMC"],
        "careers": ["Journalist", "Designer", "Writer"]
    },
    "Commerce": {
        "courses": ["BCom", "BBA", "CA Foundation"],
        "careers": ["Accountant", "Entrepreneur", "Banker"]
    },
    "Vocational": {
        "courses": ["ITI", "Diploma in Electrical", "Health Assistant"],
        "careers": ["Technician", "Paramedic", "Field Officer"]
    }
}

# Government Colleges
gov_colleges = [
    {
        "name": "Govt Degree College - Vijayawada",
        "courses": ["BSc", "BCom", "BA"],
        "lat": 16.5062,
        "lng": 80.6480
    },
    {
        "name": "Govt Polytechnic College - Guntur",
        "courses": ["Diploma in Electrical", "ITI"],
        "lat": 16.3067,
        "lng": 80.4365
    }
]

# Calculate score and recommend stream
def calculate_stream_recommendation(answers):
    scores = {"Science": 0, "Arts": 0, "Commerce": 0, "Vocational": 0}
    for i, answer in enumerate(answers):
        question = quiz_questions[i]
        if answer == "Yes":
            for stream, pts in question["scores"].items():
                scores[stream] += pts
    recommended_stream = max(scores, key=scores.get)
    return recommended_stream, scores

# Return pathway data for stream
def generate_pathway(stream):
    return stream_course_career_map.get(stream, {})

# Log user sessions (for debugging/logging)
def log_user_session(user_id, answers, recommended_stream):
    session_data = {
        "user_id": user_id,
        "answers": answers,
        "recommended_stream": recommended_stream
    }
    print("Session logged:", session_data)

# ✅ Serve the frontend page
@app.route("/")
def index():
    return render_template("index.html")

# ✅ API: Get quiz questions
@app.route("/quiz", methods=["GET"])
def get_quiz():
    return jsonify({"questions": quiz_questions})

# ✅ API: Recommend stream
@app.route("/recommend", methods=["POST"])
def recommend():
    data = request.get_json(force=True)
    if not data:
        return jsonify({"error": "Invalid or missing JSON"}), 400

    answers = data.get("answers")
    user_id = data.get("user_id", "anonymous")

    if not answers or len(answers) != len(quiz_questions):
        return jsonify({"error": "Invalid number of answers"}), 400

    stream, scores = calculate_stream_recommendation(answers)
    pathway = generate_pathway(stream)

    log_user_session(user_id, answers, stream)

    return jsonify({
        "recommended_stream": stream,
        "score_breakdown": scores,
        "pathway": pathway,
        "govt_colleges": gov_colleges
    })

# ✅ Start the Flask app
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
