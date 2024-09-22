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


    res = requests.get(f"https://us-zipcode.api.smarty.com/lookup?auth-id=3e85486c-0bf0-58c6-bc58-285fd49fc589&zipcode={input_data.get("zipCode")}&auth-token=SDDsxsqYifk9rBLERYRE")

    zip_data = res.json()[0]

    res = query_insurance(input_data.get("income"), input_data.get("gender"), input_data.get("age"), zip_data.get("zipcodes")[0], input_data.get("smoker", False), input_data.get("pregnant", False), input_data.get("dependents") != 0, input_data.get("married", False))

    model_response = model.generate_content("Given this city and state, catergorize whether this location is 'northeast', 'northwest', 'southeast', or 'southwest' of the US. Output it with this json format: {'region': one of the four regions}")

    region = json.loads(model_response.text)["region"]
    bmi = float(input_data.get("weight")) / float(input_data.get("height")) ** 2 

    print(predict_insurance(input_data.get("age"), input_data.get('gender'), bmi, input_data.get('dependents'), input_data.get('smoker'), region))

    return jsonify(res)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0")
    print("Running on port 5000", flush=True)