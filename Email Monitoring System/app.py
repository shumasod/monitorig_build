Email Monitoring System

# app.py
import boto3
from botocore.exceptions import ClientError
from flask import Flask, jsonify
import logging

app = Flask(__name__)
