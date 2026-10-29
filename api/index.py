import sys
from pathlib import Path

# Add apps/api to path so app.main can be imported
api_dir = Path(__file__).resolve().parent.parent / "apps" / "api"
if str(api_dir) not in sys.path:
    sys.path.insert(0, str(api_dir))

from app.main import app
