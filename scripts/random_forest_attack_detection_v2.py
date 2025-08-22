import nbformat as nbf

nb = nbf.v4.new_notebook()
cells = []

# Title and intro
cells.append(nbf.v4.new_markdown_cell("# Detector de ataques a API REST con Random Forest + GridSearchCV\n\nEste cuaderno entrena y evalúa un modelo **Random Forest** para clasificar peticiones como **normales** o **ataques** a partir de un CSV preprocesado (`/mnt/data/api_logs_ml_ready.csv`). Incluye:\n\n- Carga y validación de datos\n- Análisis exploratorio breve\n- Preprocesado con `ColumnTransformer` + `OneHotEncoder`\n- Entrenamiento con `GridSearchCV` para ajustar hiperparámetros\n- Métricas (accuracy, precision, recall, F1, ROC-AUC)\n- Matriz de confusión y curva ROC\n- Importancias de características (Permutation Importance)\n- Guardado del pipeline entrenado con `joblib`\n"))

# Setup
cells.append(nbf.v4.new_code_cell("""
# Dependencias
import os
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, RocCurveDisplay
from sklearn.inspection import permutation_importance

import matplotlib.pyplot as plt

from joblib import dump

CSV_PATH = 'api_logs_ml_ready.csv'  # Ajusta si tu CSV está en otro sitio
assert os.path.exists(CSV_PATH), f'No se encontró el CSV en {CSV_PATH}'
df = pd.read_csv(CSV_PATH)
print('Shape:', df.shape)
df.head()
"""))

# Basic EDA
cells.append(nbf.v4.new_markdown_cell("## 1) Análisis exploratorio rápido"))
cells.append(nbf.v4.new_code_cell("""
# Tipos y valores faltantes
display(df.dtypes)
display(df.isna().mean().sort_values(ascending=False).head(20))

# Distribución de la etiqueta
if 'label_attack' not in df.columns:
    raise ValueError("No se encontró la columna 'label_attack' en el CSV. Asegúrate de que existe y es 0/1.")
print(df['label_attack'].value_counts(dropna=False))
df['label_attack'].value_counts(normalize=True).mul(100).round(2)
"""))

# Feature selection
cells.append(nbf.v4.new_markdown_cell("## 2) Selección de variables\n\nAjusta las listas si tu dataset tiene columnas distintas."))
cells.append(nbf.v4.new_code_cell("""
# Definimos columnas candidatas
potential_features = [
    'http_method',
    'endpoint',
    'query_params_count',
    'user_agent',
    'authorization_present',
    'ip_hash',
    'content_length_bytes',
    'num_fields',
    'avg_field_length',
    'failed_auth_attempts_last_10min',
    'suspicious_patterns_detected',
    'statusCode',
    'duration_ms',
    'responseSize'
]

existing_features = [c for c in potential_features if c in df.columns]
missing = set(potential_features) - set(existing_features)
print("Usando features:", existing_features)
if missing:
    print("Aviso: no se encontraron estas columnas y serán ignoradas:", missing)

X = df[existing_features].copy()
y = df['label_attack'].astype(int)

# Convertimos tipos: booleanos a int, listas/strings a string
for col in X.columns:
    if X[col].dtype == bool:
        X[col] = X[col].astype(int)
    if X[col].dtype == object:
        X[col] = X[col].astype(str)
"""))

# Train/test split
cells.append(nbf.v4.new_markdown_cell("## 3) Split entrenamiento / validación"))
cells.append(nbf.v4.new_code_cell("""
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.25, random_state=42, stratify=y
)
X_train.shape, X_test.shape
"""))

# Preprocessing and pipeline
cells.append(nbf.v4.new_markdown_cell("## 4) Pipeline de preprocesado + modelo con GridSearchCV"))
cells.append(nbf.v4.new_code_cell("""
# Definimos columnas numéricas y categóricas de forma automática
numeric_cols = [c for c in X.columns if pd.api.types.is_numeric_dtype(X[c])]
categorical_cols = [c for c in X.columns if c not in numeric_cols]

preprocess = ColumnTransformer(
    transformers=[
        ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_cols),
        ('num', 'passthrough', numeric_cols)
    ]
)

clf = RandomForestClassifier(random_state=42, n_jobs=-1, class_weight='balanced')

pipe = Pipeline(steps=[('prep', preprocess), ('rf', clf)])

# Grid de hiperparámetros
param_grid = {
    'rf__n_estimators': [100, 200, 300],
    'rf__max_depth': [None, 10, 20],
    'rf__min_samples_split': [2, 5],
    'rf__min_samples_leaf': [1, 2, 4]
}

grid_search = GridSearchCV(
    pipe,
    param_grid,
    cv=3,
    scoring='f1',
    n_jobs=-1,
    verbose=2
)

grid_search.fit(X_train, y_train)

print("Mejores hiperparámetros encontrados:")
print(grid_search.best_params_)
print("Mejor score medio en CV:", grid_search.best_score_)

best_pipe = grid_search.best_estimator_
"""))

# Evaluation
cells.append(nbf.v4.new_markdown_cell("## 5) Evaluación del mejor modelo"))
cells.append(nbf.v4.new_code_cell("""
y_pred = best_pipe.predict(X_test)
y_proba = best_pipe.predict_proba(X_test)[:, 1]

print("\\nClassification report:\\n")
print(classification_report(y_test, y_pred, digits=4))

cm = confusion_matrix(y_test, y_pred)
print("Matriz de confusión:\\n", cm)

try:
    auc = roc_auc_score(y_test, y_proba)
    print(f"ROC-AUC: {auc:.4f}")
except Exception as e:
    print("No se pudo calcular ROC-AUC:", e)

# Plot matriz de confusión
fig, ax = plt.subplots()
im = ax.imshow(cm)
ax.set_title('Matriz de confusión')
ax.set_xlabel('Predicción')
ax.set_ylabel('Real')
ax.set_xticks([0,1]); ax.set_yticks([0,1])
ax.set_xticklabels(['Normal (0)', 'Ataque (1)'])
ax.set_yticklabels(['Normal (0)', 'Ataque (1)'])
for (i, j), val in np.ndenumerate(cm):
    ax.text(j, i, int(val), ha='center', va='center')
plt.show()

# Plot curva ROC
try:
    RocCurveDisplay.from_estimator(best_pipe, X_test, y_test)
    plt.title('Curva ROC')
    plt.show()
except Exception as e:
    print("No se pudo trazar la curva ROC:", e)
"""))

# Feature importance
cells.append(nbf.v4.new_markdown_cell("## 6) Importancia de características (Permutation Importance)"))
cells.append(nbf.v4.new_code_cell("""
# Calculamos permutation importance en el conjunto de test
result = permutation_importance(best_pipe, X_test, y_test, n_repeats=5, random_state=42, n_jobs=-1)

# Extraemos nombres de las features transformadas
prep = best_pipe.named_steps['prep']
feature_names = []
for name, trans, cols in prep.transformers_:
    if name == 'remainder' and trans == 'drop':
        continue
    if hasattr(trans, 'get_feature_names_out'):
        fn = trans.get_feature_names_out(cols)
        feature_names.extend(fn)
    elif cols is not None:
        feature_names.extend(cols)

print("Nombres de features generados:", len(feature_names))
print("Importancias calculadas:", len(result.importances_mean))

min_len = min(len(feature_names), len(result.importances_mean))

imp_df = pd.DataFrame({
    'feature': feature_names[:min_len],
    'importance_mean': result.importances_mean[:min_len]
}).sort_values('importance_mean', ascending=False)

imp_df.head(20)
"""))

# Save model
cells.append(nbf.v4.new_markdown_cell("## 7) Guardar el pipeline entrenado"))
cells.append(nbf.v4.new_code_cell("""
MODEL_PATH = '/mnt/data/random_forest_api_attack_detector_tuned.joblib'
dump(best_pipe, MODEL_PATH)
print(f'Modelo guardado en: {MODEL_PATH}')
"""))

# Next steps
cells.append(nbf.v4.new_markdown_cell("## 8) Próximos pasos\n\n- Ajustar el grid de hiperparámetros (más valores, RandomizedSearchCV para eficiencia).\n- Añadir más señales (ventanas temporales, tasas por IP, ASN, geolocalización).\n- Reentrenar periódicamente con datos recientes.\n- Monitorizar drift y métricas en producción.\n"))

nb['cells'] = cells

path = "RandomForest_API_Attack_Detector_GridSearch.ipynb"
with open(path, "w", encoding="utf-8") as f:
    nbf.write(nb, f)

path
