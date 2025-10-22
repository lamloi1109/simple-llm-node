import gradio as gr
import requests

API_URL = "http://localhost:8080/ask"

def ask_backend(question, history):
    payload = {
        "question": question,
        "use_rag": True,
        "top_k": 4
    }
    try:
        r = requests.post(API_URL, json=payload)
        res = r.json()
        if res.get("ok"):
            return res["answer"]
        return "❌ Error: " + res.get("error", "Unknown")
    except Exception as e:
        return f"⚠️ Lỗi kết nối: {str(e)}"

ui = gr.ChatInterface(ask_backend, title="Node.js LLM via Gradio UI")

if __name__ == "__main__":
    ui.launch()
