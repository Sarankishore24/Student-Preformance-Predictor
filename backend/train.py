import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os

def generate_data(n_samples=5000):
    np.random.seed(42)
    # Features
    study_hours = np.random.uniform(0, 40, n_samples)
    attendance = np.random.uniform(50, 100, n_samples)
    previous_score = np.random.uniform(30, 100, n_samples)
    sleep_hours = np.random.uniform(4, 10, n_samples)
    extracurricular = np.random.choice([0, 1], n_samples)
    
    # Calculate score based on some correlations + noise
    # Calculate more realistic and fair score based on correlations with a baseline
    base_score = (
        38 +  # Fair grading baseline
        (study_hours / 40) * 20 +
        (attendance / 100) * 22 +
        (previous_score / 100) * 15 +
        ((sleep_hours - 4) / 6) * 5
    )
    
    noise = np.random.normal(0, 5, n_samples)
    final_score = base_score + noise
    
    # Cap at 100 and floor at 0
    final_score = np.clip(final_score, 0, 100)
    
    df = pd.DataFrame({
        'study_hours': study_hours,
        'attendance': attendance,
        'previous_score': previous_score,
        'sleep_hours': sleep_hours,
        'extracurricular': extracurricular,
        'final_score': final_score
    })
    
    return df

def main():
    print("Generating synthetic student data...")
    df = generate_data()
    
    print("\nExploratory Data Analysis:")
    print(df.describe())
    print("\nTraining Model...")
    
    X = df.drop('final_score', axis=1)
    y = df['final_score']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"\nModel Evaluation")
    print(f"Mean Squared Error: {mse:.2f}")
    print(f"R2 Score: {r2:.4f}")
    
    # Save the model
    os.makedirs('model', exist_ok=True)
    joblib.dump(model, 'model/student_model.pkl')
    # Save the feature names
    joblib.dump(X.columns.tolist(), 'model/features.pkl')
    print("\nModel saved successfully to model/student_model.pkl")

if __name__ == '__main__':
    main()
