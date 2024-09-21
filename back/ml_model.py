from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.ensemble import ExtraTreesRegressor
from sklearn.model_selection import train_test_split
from skl2onnx import to_onnx
from skl2onnx.common.data_types import FloatTensorType
import onnxruntime as ort
import numpy as np
import pandas as pd

def build_model(dataset):
    try:
        df = pd.read_csv(dataset)
        print(f"Dataset loaded successfully: {dataset}")
    except FileNotFoundError:
        print(f"File not found: {dataset}")
    except Exception as e:
        print(f"Error loading dataset: {e}")


    # Update the charges column to account for children
    df['charges'] = df['charges'].add(df['children'].mul(df['charges'])) / 12

    # One-hot-encode the categorical columns
    x = pd.get_dummies(df.iloc[:, :6], columns=['sex', 'smoker', 'region'], dtype=int)

    # Applying log transformation to 'charges' to reduce skewness
    y = np.log1p(df['charges'])

    # Split the data into training and testing sets
    x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.3, random_state=36)

    etr = ExtraTreesRegressor(bootstrap=True, max_depth=8, min_samples_leaf=2, min_samples_split=2, n_estimators=383)
    etr.fit(x_train, y_train)

    initial_type = [('float_input', FloatTensorType([None, x_train.shape[1]]))]

    onnx_file = to_onnx(etr, initial_types=initial_type)

    print(type(onnx_file))

    with open("etr_model.onnx", "wb") as file:
        file.write(onnx_file.SerializeToString())

    return etr, x_test, y_test

def make_prediction(model, x_test, y_test):
    # Make predictions on the test set
    predictions_etr = model.predict(x_test)

    # Calculate and print the Mean Squared Error and Mean Absolute Error for RandomForestRegressor
    mse_rf = mean_squared_error(y_test, predictions_etr)
    mae_rf = mean_absolute_error(y_test, predictions_etr)
    # r_sq_score = r2_score(predictions_etr, y_test)
    print(f'RandomForestRegressor - MSE: {mse_rf}, MAE: {mae_rf}, PREDICTED VALUE: {predictions_etr}')

    return predictions_etr

def test_onnx(onnx_filepath, x_test_sample):
    ortf = ort.InferenceSession(onnx_filepath)

    input_name = ortf.get_inputs()[0].name
    output_name = ortf.get_outputs()[0].name

    prediction = ortf.run([output_name], {input_name: x_test_sample.astype(np.float32)})[0]

    print(f"ONNX model prediction: {prediction}")

    return prediction

def main():
    dataset_directory = r"C:\Users\leonl\Documents\GitHub\hackrice2425\back\insurance.csv"

    model, x_test, y_test = build_model(dataset_directory)
    
    # make_prediction(model, x_test, y_test)

    X_test_sample = x_test[:1]
    Y_test_sample = y_test[:1]

    print(f"{X_test_sample}\n")

    test_onnx("./etr_model.onnx", X_test_sample.to_numpy()) 
    model_prediction = make_prediction(model, X_test_sample, Y_test_sample)
    actual_prediction = Y_test_sample

    print(model_prediction.astype(np.float32), actual_prediction.to_numpy().astype(np.float32))

if __name__ == "__main__":
    main()