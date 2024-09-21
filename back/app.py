from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import csv

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
    print(res.json())
    zip_data = res.json()[0].get("zipcodes")[0]

    print(zip_data)

    body = {"household":{"income":income,"people":[{"aptc_eligible":False,"age":age,"has_mec":False, "is_pregnant": pregnant,"is_parent":parent,"uses_tobacco":smoker,"gender": "Male" if gender else "Female"}],"has_married_couple":married,"unemployment_received":"None"},"market":"Individual","place":{"countyfips":zip_data.get("county_fips"),"state":zip_data.get("state_abbreviation"),"zipcode":zipCode},"year":2024,"filter":{"division":"HealthCare","metal_design_types":None},"limit":10,"offset":0,"order":"asc","suppressed_plan_ids":[],"sort":"premium","aptc_override":None}

    response = requests.post("https://marketplace-int.api.healthcare.gov/api/v1/plans/search?year=2024", json=body)

    plans = response.json().get("plans")
    extracted_data = []
    for plan in plans:
        # Initialize plan info
        plan_info = {
            "plan_id": plan.get("id"),
            "name": plan.get("name"),
            "premium": plan.get("premium"),
            "deductible": next((d["amount"] for d in plan.get("deductibles", []) if
                                d["type"] == "Combined Medical and Drug EHB Deductible"), None),
            "moop": next((m["amount"] for m in plan.get("moops", []) if
                          m["type"] == "Maximum Out of Pocket for Medical and Drug EHB Benefits (Total)"), None),
            "network_type": plan.get("type"),
            "urgent_care_coverage": 0,
            "specialist_visit_coverage": 0,
            "generic_drug_coverage": 0,
            "mental_health_outpatient_coverage": 0,
            "emergency_coverage": 0,
            "primary_care_copay": 0,
            "mental_health_inpatient_coverage": 0,
            "disease_management_count": len(plan.get("disease_mgmt_programs", []))
        }

        # Check for coverage based on benefits
        benefit_types = {benefit["type"]: benefit for benefit in plan.get("benefits", [])}

        if "URGENT_CARE_CENTERS_OR_FACILITIES" in benefit_types:
            plan_info["urgent_care_coverage"] = 1
        if "SPECIALIST_VISIT" in benefit_types:
            plan_info["specialist_visit_coverage"] = 1
        if "GENERIC_DRUGS" in benefit_types:
            plan_info["generic_drug_coverage"] = 1
        if "MENTAL_BEHAVIORAL_HEALTH_OUTPATIENT_SERVICES" in benefit_types:
            plan_info["mental_health_outpatient_coverage"] = 1
        if "EMERGENCY_ROOM_SERVICES" in benefit_types:
            plan_info["emergency_coverage"] = 1
        if "PRIMARY_CARE_VISIT_TO_TREAT_AN_INJURY_OR_ILLNESS" in benefit_types:
            plan_info["primary_care_copay"] = 1
        if "MENTAL_BEHAVIORAL_HEALTH_INPATIENT_SERVICES" in benefit_types:
            plan_info["mental_health_inpatient_coverage"] = 1

        extracted_data.append(plan_info)
    print(extracted_data)
    csv_file_path = "insurance_plans.csv"
    with open(csv_file_path, mode='w', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=extracted_data[0].keys())
        writer.writeheader()
        writer.writerows(extracted_data)

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