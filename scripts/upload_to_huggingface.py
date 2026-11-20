"""
SecureAct Horizon v3 — Hugging Face Model Hub Upload Utility
=============================================================
This script uploads the trained SecureAct Horizon v3 (ModernBERT 141M)
weights, tokenizer, and configuration files to Hugging Face Model Hub.

Usage:
    python scripts/upload_to_huggingface.py --repo-id <username>/<model-name> [--token <hf_token>]
"""

import os
import sys
import argparse
from pathlib import Path

# Enable high performance transfer if available without deprecated warnings
os.environ.pop("HF_HUB_ENABLE_HF_TRANSFER", None)
os.environ["HF_XET_HIGH_PERFORMANCE"] = "1"

from huggingface_hub import HfApi, create_repo
from huggingface_hub.utils import HfHubHTTPError

def main():
    parser = argparse.ArgumentParser(description="Upload SecureAct Horizon v3 model to Hugging Face Hub")
    parser.add_argument(
        "--repo-id", 
        required=True, 
        help="Target Hugging Face repository ID (e.g., Mazenalodini/secureact-horizon-v3)"
    )
    parser.add_argument(
        "--token", 
        default=os.environ.get("HF_TOKEN"), 
        help="Hugging Face User Access Token (with Write permissions). Can also be set via HF_TOKEN env variable."
    )
    parser.add_argument(
        "--private", 
        action="store_true", 
        help="Make the repository private (default is public)"
    )

    args = parser.parse_args()

    token = args.token
    if not token:
        print("[!] Error: No Hugging Face token provided.")
        print("    Please provide --token <your_token> or set the HF_TOKEN environment variable.")
        print("    You can create a write token at: https://huggingface.co/settings/tokens")
        sys.exit(1)

    repo_id = args.repo_id

    # Resolve local model directory
    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent
    model_dir = project_root / "SecureAct_DeepShield_Local" / "SecureAct_AI_secureact_horizon_browsesafe_multitask_v3_20261118" / "artifact"

    if not model_dir.exists():
        print(f"[!] Error: Model artifact directory not found at: {model_dir}")
        sys.exit(1)

    print(f"[*] Found model artifact directory at: {model_dir}")
    print(f"[*] Target Hugging Face Hub repo: {repo_id}")

    api = HfApi(token=token)

    # 1. Validate token
    print("[*] Validating access token with Hugging Face...")
    try:
        user_info = api.whoami()
        username = user_info.get("name", "Unknown")
        print(f"[+] Token verified successfully! Authenticated as: @{username}")
    except Exception as e:
        print(f"\n[!] Authentication Error: The provided token is invalid or expired ({e}).")
        print("    Note: When creating a token on Hugging Face (https://huggingface.co/settings/tokens):")
        print("    You MUST copy the full token immediately upon creation before closing the dialog.")
        print("    Once closed, the token is permanently masked (e.g. hf_...XXXX) and cannot be copied again.")
        sys.exit(1)

    # 2. Create or ensure repo exists
    print(f"[*] Ensuring repository '{repo_id}' exists on Hugging Face...")
    try:
        create_repo(repo_id=repo_id, token=token, private=args.private, exist_ok=True, repo_type="model")
        print(f"[+] Repository '{repo_id}' is ready.")
    except Exception as e:
        print(f"[!] Warning during repo creation: {e}")

    # 3. Upload files (ignoring __pycache__)
    print(f"[*] Uploading model files (weights ~536MB, config, tokenizer)... This may take 1-3 minutes depending on your internet connection.")
    try:
        api.upload_folder(
            folder_path=str(model_dir),
            repo_id=repo_id,
            repo_type="model",
            commit_message="feat: upload SecureAct Horizon v3 (ModernBERT 141M) weights & config",
            ignore_patterns=["*__pycache__*", "*.pyc"]
        )
        print(f"\n[SUCCESS] Model successfully uploaded to: https://huggingface.co/{repo_id}")
        print("You can now load this model in python using:")
        print(f"    from transformers import AutoModelForSequenceClassification, AutoTokenizer")
        print(f"    model = AutoModelForSequenceClassification.from_pretrained('{repo_id}')")
        print(f"    tokenizer = AutoTokenizer.from_pretrained('{repo_id}')")
    except Exception as e:
        print(f"[!] Error during upload: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
