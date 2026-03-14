from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os

app = Flask(__name__)
# Enable CORS for all routes so the frontend can easily communicate
CORS(app)

model_path = 'model/student_model.pkl'

if os.path.exists(model_path):
    model = joblib.load(model_path)
    features = joblib.load('model/features.pkl')
else:
    model = None
    features = []

@app.route('/api/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({'error': 'Prediction model not trained yet. Run train.py first.'}), 500
        
    try:
        data = request.json
        input_data = []
        for feature in features:
            if feature not in data:
                # Defaulting to 0 or we can send an error
                return jsonify({'error': f'Missing feature: {feature}'}), 400
            input_data.append(float(data[feature]))
            
        prediction = model.predict([input_data])[0]
        prediction_clamped = min(max(prediction, 0.0), 100.0)
        
        # Determine academic outcome / grade
        if prediction_clamped >= 90:
            grade = 'A'
            remarks = 'Excellent Performance'
        elif prediction_clamped >= 80:
            grade = 'B'
            remarks = 'Good Performance'
        elif prediction_clamped >= 70:
            grade = 'C'
            remarks = 'Average Performance'
        elif prediction_clamped >= 60:
            grade = 'D'
            remarks = 'Below Average'
        else:
            grade = 'F'
            remarks = 'Needs Improvement'
            
        actionable_advice = None
        if grade != 'A':
            # Try Study Hours
            test_study = list(input_data)
            idx = features.index('study_hours')
            test_study[idx] = min(test_study[idx] + 5, 40.0)
            if model.predict([test_study])[0] > prediction_clamped + 2:
                actionable_advice = "Boost your study time by ~5 hours a week for a noticeable grade improvement."
            else:
                test_att = list(input_data)
                idx_a = features.index('attendance')
                test_att[idx_a] = min(test_att[idx_a] + 10, 100.0)
                if model.predict([test_att])[0] > prediction_clamped + 2:
                    actionable_advice = "Focus on attendance! Attending 10% more classes could significantly raise your score."
                else:
                    actionable_advice = "Keep maintaining consistency across all areas, particularly sleep and attendance."
            
        student_type = data.get('student_type', 'school')
        
        return jsonify({
            'predicted_score': round(prediction_clamped, 2),
            'predicted_cgpa': round(prediction_clamped / 10, 2) if student_type == 'college' else None,
            'grade': grade,
            'remarks': remarks,
            'actionable_advice': actionable_advice
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/status', methods=['GET'])
def status():
    return jsonify({
        'status': 'online',
        'model_loaded': model is not None
    })

@app.route('/api/insights', methods=['GET'])
def get_insights():
    if model is None:
        return jsonify({'error': 'Prediction model not trained yet.'}), 500
    
    # Random Forest feature importances
    importances = model.feature_importances_.tolist()
    
    importance_data = [{"feature": f.replace('_', ' ').title(), "importance": round(i * 100, 2)} for f, i in zip(features, importances)]
    importance_data = sorted(importance_data, key=lambda x: x['importance'], reverse=True)
    
    return jsonify({
        'feature_importances': importance_data
    })

@app.route('/api/batch-predict', methods=['POST'])
def batch_predict():
    if model is None:
        return jsonify({'error': 'Prediction model not trained yet.'}), 500
    try:
        students = request.json
        results = []
        for i, s_data in enumerate(students):
            input_data = []
            for feature in features:
                input_data.append(float(s_data.get(feature, 0)))
            
            prediction = model.predict([input_data])[0]
            prediction_clamped = min(max(prediction, 0.0), 100.0)
            
            if prediction_clamped >= 90: grade = 'A'
            elif prediction_clamped >= 80: grade = 'B'
            elif prediction_clamped >= 70: grade = 'C'
            elif prediction_clamped >= 60: grade = 'D'
            else: grade = 'F'
            
            student_type = s_data.get('student_type', 'school')
            predicted_cgpa = round(prediction_clamped / 10, 2) if student_type == 'college' else None
            
            results.append({
                'id': s_data.get('id', i+1),
                'name': s_data.get('name', f'Student {i+1}'),
                'predicted_score': round(prediction_clamped, 2),
                'predicted_cgpa': predicted_cgpa,
                'grade': grade,
                'at_risk': grade in ['D', 'F']
            })
        return jsonify({'results': results})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)
