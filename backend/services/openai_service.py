import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL = "gpt-4o-mini"


def _chat(system_prompt: str, user_prompt: str) -> str:
    """Send a chat completion request and return the content."""
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.7,
        max_tokens=800,
    )
    return response.choices[0].message.content


def analyze_sleep(bmi: float, bmi_category: str, weight_kg: float,
                  sleep_time: str, wake_time: str, duration_hours: float) -> str:
    """Analyze sleep quality based on BMI and sleep data."""
    system_prompt = (
        "You are a certified sleep health expert and fitness consultant. "
        "Provide a concise, personalized sleep quality analysis with actionable suggestions. "
        "Use markdown formatting with headers, bullet points, and emojis for readability. "
        "Keep the response under 400 words."
    )
    user_prompt = (
        f"Analyze this person's sleep:\n"
        f"- BMI: {bmi:.1f} ({bmi_category})\n"
        f"- Weight: {weight_kg} kg\n"
        f"- Went to sleep at: {sleep_time}\n"
        f"- Woke up at: {wake_time}\n"
        f"- Total sleep duration: {duration_hours:.1f} hours\n\n"
        f"Please provide:\n"
        f"1. Sleep quality rating (out of 10)\n"
        f"2. Analysis of sleep duration and timing\n"
        f"3. How their BMI affects sleep quality\n"
        f"4. Personalized suggestions for better sleep tonight\n"
        f"5. Recommended ideal sleep schedule for their body type"
    )
    return _chat(system_prompt, user_prompt)


def analyze_workout(bmi: float, bmi_category: str, weight_kg: float,
                    workout_type: str, duration_min: float,
                    intensity: str, calories: float) -> str:
    """Analyze workout effectiveness based on BMI and workout data."""
    system_prompt = (
        "You are a certified personal trainer and fitness expert. "
        "Provide a concise, personalized workout analysis with actionable suggestions. "
        "Use markdown formatting with headers, bullet points, and emojis for readability. "
        "Keep the response under 400 words."
    )
    user_prompt = (
        f"Analyze this person's workout:\n"
        f"- BMI: {bmi:.1f} ({bmi_category})\n"
        f"- Weight: {weight_kg} kg\n"
        f"- Workout type: {workout_type}\n"
        f"- Duration: {duration_min} minutes\n"
        f"- Intensity: {intensity}\n"
        f"- Estimated calories burnt: {calories:.0f}\n\n"
        f"Please provide:\n"
        f"1. Workout effectiveness rating (out of 10)\n"
        f"2. Calories analysis\n"
        f"3. Recommendations tailored to their BMI category\n"
        f"4. Suggested next workout\n"
        f"5. Recovery tips"
    )
    return _chat(system_prompt, user_prompt)


def get_fitness_suggestions(bmi: float, bmi_category: str, weight_kg: float,
                            water_glasses: int, recent_activities: str) -> str:
    """Generate hydration and fitness suggestions."""
    system_prompt = (
        "You are a certified nutritionist and fitness expert. "
        "Provide personalized hydration and fitness tips. "
        "Use markdown formatting with headers, bullet points, and emojis for readability. "
        "Keep the response under 400 words."
    )
    user_prompt = (
        f"Provide fitness and hydration suggestions for this person:\n"
        f"- BMI: {bmi:.1f} ({bmi_category})\n"
        f"- Weight: {weight_kg} kg\n"
        f"- Water intake today: {water_glasses} glasses\n"
        f"- Recent activities: {recent_activities}\n\n"
        f"Please provide:\n"
        f"1. Daily water intake recommendation\n"
        f"2. Hydration tips throughout the day\n"
        f"3. Quick fitness practices they can add today\n"
        f"4. Nutrition tips based on their BMI\n"
        f"5. Miscellaneous wellness suggestions"
    )
    return _chat(system_prompt, user_prompt)
