import argparse
import json
from pathlib import Path

import httpx


DEFAULT_API_URL = "http://localhost:8000/api/v1/predictions/ingest"


def load_payload(payload_path: Path) -> dict:
    raw = payload_path.read_text(encoding="utf-8")
    return json.loads(raw)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Send trained model predictions to the Charlotte backend ingest endpoint."
    )
    parser.add_argument(
        "--payload",
        type=Path,
        default=Path("predictions_payload.json"),
        help="Path to a JSON file containing the ingest payload.",
    )
    parser.add_argument(
        "--api-url",
        default=DEFAULT_API_URL,
        help="Backend ingest endpoint URL.",
    )
    args = parser.parse_args()

    payload = load_payload(args.payload)
    print(f"Posting {len(payload.get('predictions', []))} predictions to {args.api_url}")

    with httpx.Client(timeout=20.0) as client:
        response = client.post(args.api_url, json=payload)
        response.raise_for_status()
        result = response.json()

    print("Ingest completed. Server returned:")
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
