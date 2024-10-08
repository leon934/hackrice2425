from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import csv
import onnxruntime as ort
import numpy as np
import google.generativeai as genai
from dotenv import load_dotenv
import os
import json
import pandas as pd

app = Flask(__name__)

load_dotenv()

genai.configure(api_key=os.environ.get("GEMINI"))
model = genai.GenerativeModel("gemini-1.5-flash", generation_config=genai.GenerationConfig(response_mime_type="application/json"))

CORS(app)

def query_insurance(income, gender, age, zip_data, smoker = False, pregnant = False, parent = False, married = False):

    if not smoker:
        smoker = False
    if not pregnant:
        pregnant = False
    if not parent:
        parent = False
    if not married:
        married = False



    body = {"household":{"income":income,"people":[{"aptc_eligible":False,"age":age,"has_mec":False, "is_pregnant": pregnant,"is_parent":parent,"uses_tobacco":smoker,"gender": "Male" if gender else "Female"}],"has_married_couple":married,"unemployment_received":"None"},"market":"Individual","place":{"countyfips":zip_data.get("county_fips"),"state":zip_data.get("state_abbreviation"),"zipcode":zip_data["zipcode"]},"year":2024,"filter":{"division":"HealthCare","metal_design_types":None},"limit":10,"offset":0,"order":"asc","suppressed_plan_ids":[],"sort":"premium","aptc_override":None}


    response = requests.post("https://marketplace-int.api.healthcare.gov/api/v1/plans/search?year=2024", json=body)

    return response.json()

def predict_insurance(age, sex, bmi, children, smoker, region):
    ortf = ort.InferenceSession("etr_model.onnx")
    input_name = ortf.get_inputs()[0].name
    output_name = ortf.get_outputs()[0].name

    iarr = np.array([[age,bmi,children,not sex,sex,not smoker, smoker, region == "northeast", region == "northwest", region == "southeast", region == "southwest"]]).astype(np.float32)

    prediction = ortf.run([output_name], {input_name: iarr})[0]
    return prediction

def calculate_score(predicted_price, actual_price, wp, user_need,plan_offering):
    matches = np.logical_and(user_need, plan_offering)

    match_count = np.sum(matches)
    user_need_count = np.sum(user_need)

    if user_need_count == 0:
        coverage_alignment = 1
    else:
        coverage_alignment = match_count / user_need_count
    wc = 1 - wp
    price_deviation = abs(actual_price - predicted_price) / predicted_price
    score = wc * price_deviation + (1 - wc) * coverage_alignment
    return score


@app.route("/")
def index():
    return "hello world"

@app.route("/api/insuranceRequest", methods=["POST"])
def insuranceRequest():

    input_data = request.json

    def get_zip_data():
            res = requests.get(f"https://us-zipcode.api.smarty.com/lookup?auth-id=7137fd41-70ad-59cb-9d17-650cfb93946b&zipcode={input_data.get('zipCode')}&auth-token=1bosOieBykQ7fmiFf2RW")
            if res.status_code == 200 and res.json():
                return res
            return get_zip_data()
    
    zip_data = get_zip_data().json()[0]

    res = query_insurance(input_data.get("income"), input_data.get("gender"), input_data.get("age"), zip_data.get("zipcodes")[0], input_data.get("smoker", False), input_data.get("pregnant", False), input_data.get("dependents") != 0, input_data.get("married", False))

    predicted_price = 0
    data = pd.read_csv("hospital.csv").to_records()
    return {
        "predicted_price": predicted_price,
        "data": data.tolist()
    }

@app.route("/hospitalRanking", methods=["GET"])
def hospitalRanking():
    input_data = request.json

    # Example usage
    predicted_price = 100  # Example predicted price
    insurance_prices = [90, 110, 95]  # Example insurance prices
    weight_price = 0.3  # Example weight for price

    # Example dataset will just consist of True, False, True, ...
    user_req_coverage = [True, False, True, False, True, False, True, False]
    insurance_coverage = [
        [True, False, True, False, True, False, True, False],
        [True, False, True, False, True, False, True, False],
        [True, False, True, False, True, False, True, False]
    ]

    # This will be equal to the size of insurance_coverage.
    insurance_prices = []

    def convert_to_deviation(insurance_prices, predicted_price):
        # Finds the deviations of all the prices from the inputted predicted price.
        deviations = [abs(price - predicted_price) for price in insurance_prices]

        min_deviation = min(deviations)
        max_deviation = max(deviations)

        normalized_deviations = [(deviation - min_deviation) / (max_deviation - min_deviation) for deviation in deviations]
        
        return normalized_deviations

    # TODO: find the deviations from the predicted budget and normalize all of the values.
    def calculate_match(user_req_coverage, insurance_coverage, weight_price, predicted_price, insurance_prices):
        total = 0
        percentage_array = []

        # The weights sum up to 1.
        weight_coverage = 1 - weight_price

        # Normalize the price deviations
        normalized_deviations = convert_to_deviation(insurance_prices, predicted_price)

        # To find the coverage percentage.
        for i in range(len(insurance_coverage)):
            for j in range(len(user_req_coverage)):
                if user_req_coverage[j] == insurance_coverage[i][j]:
                    total += 1

            # Adds the weight of the coverage times the percentage of overlapping coverage.
            coverage_percentage = weight_coverage * total / len(user_req_coverage)
            total = 0
        
            # Adds the weight of the price.
            price_weighted = weight_price * normalized_deviations[i]
            percentage_array.append(coverage_percentage + price_weighted)

        # Finds the highest value in the array with all of the values.
        highest = max(percentage_array)

        return highest

    highest_match = calculate_match(user_req_coverage, insurance_coverage, weight_price, predicted_price, insurance_prices)
    print(highest_match)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0")
    print("Running on port 5000", flush=True)