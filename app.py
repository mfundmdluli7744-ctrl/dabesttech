import sys
import os

# Add the backend directory to the Python path so that imports like 
# 'from models import db' work correctly when run from the root.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from main import app

if __name__ == "__main__":
    # Start the application
    app.run()
