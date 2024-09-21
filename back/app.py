from flask import Flask, jsonify, request
from flask_cors import CORS
import requests

app = Flask(__name__)

CORS(app)

def query_insurance(income, gender, age, zipCode, smoker = False, pregnant = False, parent = False, married = False):

    if not smoker:
        smoker = False
    if not pregnant:
        pregnant = False
    if not parent:
        parent = False
    if not married:
        married = False

    res = requests.get(f"https://us-zipcode.api.smarty.com/lookup?auth-id=3e85486c-0bf0-58c6-bc58-285fd49fc589&zipcode={zipCode}&auth-token=SDDsxsqYifk9rBLERYRE")

    zip_data = res.json()[0].get("zipcodes")[0]

    print(zip_data)

    body = {"household":{"income":income,"people":[{"aptc_eligible":False,"age":age,"has_mec":False, "is_pregnant": pregnant,"is_parent":parent,"uses_tobacco":smoker,"gender": "Male" if gender else "Female"}],"has_married_couple":married,"unemployment_received":"None"},"market":"Individual","place":{"countyfips":zip_data.get("county_fips"),"state":zip_data.get("state_abbreviation"),"zipcode":zipCode},"year":2024,"filter":{"division":"HealthCare","metal_design_types":None},"limit":10,"offset":0,"order":"asc","suppressed_plan_ids":[],"sort":"premium","aptc_override":None}

    print(body)

    response = requests.post("https://marketplace-int.api.healthcare.gov/api/v1/plans/search?year=2024", json=body)

    print(response.json())

    return 0

@app.route("/")
def index():
    return "hello world"

@app.route("/api/insuranceRequest", methods=["POST"])
def insuranceRequest():

    input_data = request.json

    query_insurance(input_data.get("income"), input_data.get("gender"), input_data.get("age"), input_data.get("zipCode"), input_data.get("smoker", False), input_data.get("pregnant", False), input_data.get("dependents") != 0, input_data.get("married", False))

    return jsonify({})

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0")
    print("Running on port 5000", flush=True)