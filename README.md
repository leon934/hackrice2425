# Project: Insurance Recommendation System

By: Leon Nguyen, Hung Bui, Conan Nguyen

## Inspiration
As young college students, we are often poorly educated about health insurance and their benefits. And for some others like elderly people who are already having difficult times using technology, researching plans that best fits their needs from multiple websites seems impossible. This is where the one-stop shop app about financial healthcare for the best fit insurance and their closest medical facilities idea comes into life.

## What it does
Our key features:

1) Simplify the insurance hunt with an AI-powered chatbot with available plans from most major agencies. 

2) A machine learning model tested on prior users with the cost of their insurance to provide a quote that will give you the most effective plan along with the benefits that you desire.

3) An interactive map with familiar navigation and a search radius to locate the nearest hospitals based on your insurance.

## Target Audience
- Young people (18-35 years old) who do not know about different complicated medical terminology and insurance benefits that go above lower plan premiums.
- Elderly people (65+ years old) who need a lot of medical services on a regular basis but cannot navigate between different insurance sites and perform in-depth analysis for plans on the internet.
- Inclusive groups of people from all races, religions, and cultures can get the same access to different insurance plans.

## How we built it
Since we wanted to implement a machine learning mode, we started our backend in Python, with a React frontend using Typescript. Naturally, we decided to use Flask to bridge the front and backend. To obtain our data, we utilized a hospital API that allowed us to find insurances. Once we finished implementing our machine learning model, we developed an algorithm that would help cater the user's needs in terms of pricing and coverage, and the data obtained from this would then be displayed to the user.

## How this app is beneficial for the startup company of the product
- The startup for this product can work with different third-party insurance companies and offer services that are accessible to the public and the startup company of the product.

## Challenges we ran into
- We had issues finding the correct machine learning model to use for our program to determine what an accurate price is for a user's input. There were also issues with developing an algorithm that will effectively match the user's needs in terms of affordability and insurance benefit coverage. However, we managed to stomp out all of these issues to create our fully functional app.

## Accomplishments that we're proud of
- We're proud of finding the optimal solution to the algorithm and machine learning model stated above in the challenges we ran into, as well as using multiple APIs to obtain and aggregate our data onto our application.

## What we learned
- We learned to implement machine learning models in our full stack application, develop an application while utilizing multiple endpoints, and designing UI and a chat bot to accommodate for the the elderly, along with other people that aren't tech savvy in Figma.

## What's next for MedSure
- For scalability, we can extend our services by partnering with hospitals to provide more information like more about the insurances, benefits, or prices of services like a doctor's clinic. We want to be able to allow everybody to easily access our website to obtain accurate and clear information on the hospitals and clinics around them.
