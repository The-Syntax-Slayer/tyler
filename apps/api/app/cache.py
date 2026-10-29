"""
In-memory cache loader for bundled Elexon data snapshots.
Reads committed public data files from apps/api/app/data/.
In production (Vercel serverless), the filesystem is read-only, so this cache
is bundled directly with the application code.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional
import json
import os


class CacheNotLoadedError(Exception):
    """Raised when bundled Elexon cache is missing or corrupt."""
    pass


_DATA_DIR = Path(os.getenv("CACHE_DIR", Path(__file__).resolve().parent / "data"))

_fuelhh_cache: Optional[List[Dict[str, Any]]] = None
_windfor_cache: Optional[List[Dict[str, Any]]] = None
_provenance_cache: Optional[Dict[str, Any]]] = None


def get_data_dir() -> Path:
    return Path(os.getenv("CACHE_DIR", Path(__file__).resolve().parent / "data"))


def load_fuelhh(data_dir: Optional[Path] = None) -> List[Dict[str, Any]]:
    global _fuelhh_cache
    if _fuelhh_cache is not None and data_dir is None:
        return _fuelhh_cache

    dir_path = data_dir or get_data_dir()
    file_path = dir_path / "fuelhh.json"
    if not file_path.exists():
        raise CacheNotLoadedError(f"FUELHH cache not found at {file_path}. Run fetch_january.py.")

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if data_dir is None:
                _fuelhh_cache = data
            return data
    except Exception as e:
        raise CacheNotLoadedError(f"Error reading FUELHH cache: {e}") from e


def load_windfor(data_dir: Optional[Path] = None) -> List[Dict[str, Any]]:
    global _windfor_cache
    if _windfor_cache is not None and data_dir is None:
        return _windfor_cache

    dir_path = data_dir or get_data_dir()
    file_path = dir_path / "windfor.json"
    if not file_path.exists():
        raise CacheNotLoadedError(f"WINDFOR cache not found at {file_path}. Run fetch_january.py.")

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if data_dir is None:
                _windfor_cache = data
            return data
    except Exception as e:
        raise CacheNotLoadedError(f"Error reading WINDFOR cache: {e}") from e


def load_provenance(data_dir: Optional[Path] = None) -> Dict[str, Any]:
    global _provenance_cache
    if _provenance_cache is not None and data_dir is None:
        return _provenance_cache

    dir_path = data_dir or get_data_dir()
    file_path = dir_path / "provenance.json"
    if not file_path.exists():
        raise CacheNotLoadedError(f"Provenance cache not found at {file_path}.")

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if data_dir is None:
                _provenance_cache = data
            return data
    except Exception as e:
        raise CacheNotLoadedError(f"Error reading provenance cache: {e}") from e


def is_cache_ready(data_dir: Optional[Path] = None) -> bool:
    try:
        load_fuelhh(data_dir)
        load_windfor(data_dir)
        load_provenance(data_dir)
        return True
    except CacheNotLoadedError:
        return False


def clear_cache() -> None:
    """Clear in-memory cache (used primarily for test isolation)."""
    global _fuelhh_cache, _windfor_cache, _provenance_cache
    _fuelhh_cache = None
    _windfor_cache = None
    _provenance_cache = None
