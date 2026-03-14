import pandas as pd
import numpy as np

def regenerate_realistic_students(n_samples=1000):
    np.random.seed(42)  # For reproducibility
    
    # 300 Excellent Students (High probability of A or B grade)
    n_excellent = 300
    study_hours_exc = np.clip(np.random.normal(32, 5, n_excellent), 25, 40).round(2)
    attendance_exc = np.clip(np.random.normal(95, 3, n_excellent), 85, 100).round(2)
    previous_score_exc = np.clip(np.random.normal(90, 5, n_excellent), 80, 100).round(2)
    sleep_hours_exc = np.clip(np.random.normal(8, 1, n_excellent), 6, 10).round(2)
    extracurricular_exc = np.random.choice([0, 1], n_excellent, p=[0.2, 0.8])
    
    # 700 Regular Students
    n_regular = n_samples - n_excellent
    study_hours_reg = np.clip(np.random.normal(16, 10, n_regular), 0, 40).round(2)
    attendance_reg = np.clip(np.random.normal(75, 15, n_regular), 50, 100).round(2)
    previous_score_reg = np.clip(np.random.normal(70, 15, n_regular), 30, 95).round(2)
    sleep_hours_reg = np.clip(np.random.normal(6.5, 1.5, n_regular), 4, 10).round(2)
    extracurricular_reg = np.random.choice([0, 1], n_regular, p=[0.6, 0.4])

    df_exc = pd.DataFrame({
        'study_hours': study_hours_exc,
        'attendance': attendance_exc,
        'previous_score': previous_score_exc,
        'sleep_hours': sleep_hours_exc,
        'extracurricular': extracurricular_exc
    })
    
    df_reg = pd.DataFrame({
        'study_hours': study_hours_reg,
        'attendance': attendance_reg,
        'previous_score': previous_score_reg,
        'sleep_hours': sleep_hours_reg,
        'extracurricular': extracurricular_reg
    })
    
    # Combine and shuffle
    df = pd.concat([df_exc, df_reg]).sample(frac=1, random_state=42).reset_index(drop=True)

    df.to_csv('test_students.csv', index=False)
    print(f"Regenerated test_students.csv with {n_excellent} high performing students and {n_regular} regular students.")

if __name__ == '__main__':
    regenerate_realistic_students()
