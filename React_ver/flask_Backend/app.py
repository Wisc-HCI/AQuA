from flask import Flask, request, jsonify
import os

app = Flask(__name__)

@app.route('/')
def home():
    return "VLM Backend is Running"

if __name__ == '__main__':
    app.run(debug=True)
