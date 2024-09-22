import requests
import random
import csv

# Used to generate test cases based on the given random input data.
def generate_random_test_cases(num_cases=50):
    test_cases = []
    for _ in range(num_cases):
        income = random.randint(10, 500) * 1000
        gender = random.choice([True, False])
        age = random.randint(18, 100)
        smoker = random.choice([True, False])
        pregnant = random.choice([True, False])
        dependents = random.choice([True, False])
        married = random.choice([True, False])
        zip_code = random.randint(10000, 99999)  # Random 5-digit zip code
        test_cases.append({
            "income": income,
            "gender": gender,
            "age": age,
            "zipCode": zip_code,
            "smoker": smoker,
            "pregnant": pregnant,
            "dependents": dependents,
            "married": married
        })
    return test_cases

def query_insurance(income, gender, age, zip_data, smoker=False, pregnant=False, parent=False, married=False):
    body = {
        "household": {
            "income": income,
            "people": [{
                "aptc_eligible": False,
                "age": age,
                "has_mec": False,
                "is_pregnant": pregnant,
                "is_parent": parent,
                "uses_tobacco": smoker,
                "gender": "Male" if gender else "Female"
            }],
            "has_married_couple": married,
            "unemployment_received": "None"
        },
        "market": "Individual",
        "place": {
            "countyfips": zip_data.get("county_fips"),
            "state": zip_data.get("state_abbreviation"),
            "zipcode": zip_data["zipcode"]
        },
        "year": 2024,
        "filter": {
            "division": "HealthCare",
            "metal_design_types": None
        },
        "limit": 10,
        "offset": 0,
        "order": "asc",
        "suppressed_plan_ids": [],
        "sort": "premium",
        "aptc_override": None
    }

    response = requests.post("https://marketplace-int.api.healthcare.gov/api/v1/plans/search?year=2024", json=body)
    response_data = response.json()
    
    # Extract the first premium value
    if response_data and "plans" in response_data:
        for plan in response_data["plans"]:
            if "premium" in plan:
                return plan["premium"]
    
    return None

def main():
    test_cases = generate_random_test_cases(200)
    results = []

    for input_data in test_cases:
        res = requests.get(f"https://us-zipcode.api.smarty.com/lookup?auth-id=3e85486c-0bf0-58c6-bc58-285fd49fc589&zipcode={input_data.get('zipCode')}&auth-token=SDDsxsqYifk9rBLERYRE")
        
        if res.status_code == 200 and res.json():
            try:
                zip_data = res.json()[0].get("zipcodes")[0]
            except (IndexError, TypeError) as e:
                print(f"Error processing zip code data: {e}")
                continue
        else:
            print(f"Failed to retrieve data for ZIP code: {input_data.get('zipCode')}")
            continue

        premium = query_insurance(
            input_data.get("income"),
            input_data.get("gender"),
            input_data.get("age"),
            zip_data,
            input_data.get("smoker", False),
            input_data.get("pregnant", False),
            input_data.get("dependents") != 0,
            input_data.get("married", False)
        )

        results.append({
            "income": input_data.get("income"),
            "gender": "Male" if input_data.get("gender") else "Female",
            "age": input_data.get("age"),
            "zipCode": input_data.get("zipCode"),
            "smoker": input_data.get("smoker"),
            "pregnant": input_data.get("pregnant"),
            "dependents": input_data.get("dependents"),
            "married": input_data.get("married"),
            "premium": premium
        })

    with open('insurance_test_results.csv', mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(["Income", "Gender", "Age", "ZipCode", "Is_Smoker", "Not_Smoker", "Is_Pregnant", "Not_Pregnant", "Is_Dependents", "Not_Dependents", "Is_Married", "Not_Married", "Premium"])
        for result in results:
            writer.writerow([
                result["income"],
                result["gender"],
                result["age"],
                result["zipCode"],
                int(result["smoker"]),
                int(not result["smoker"]),
                int(result["pregnant"]),
                int(not result["pregnant"]),
                int(result["dependents"]),
                int(not result["dependents"]),
                int(result["married"]),
                int(not result["married"]),
                result["premium"]
            ])

if __name__ == "__main__":
    main()