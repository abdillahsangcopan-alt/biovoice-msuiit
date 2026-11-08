"""
PythonAnywhere Free Tier WSGI Entrypoint for BioVoice (MSU-IIT)
Point your PythonAnywhere WSGI configuration file to:
    from wsgi_app import application
"""
import os
import sys

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
if PROJECT_DIR not in sys.path:
    sys.path.insert(0, PROJECT_DIR)

from server import application  # noqa: E402, F401
