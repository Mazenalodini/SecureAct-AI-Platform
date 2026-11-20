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
from huggingface_hub import HfApi, create_repo

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

    # 1. Create or ensure repo exists
    print(f"[*] Ensuring repository '{repo_id}' exists on Hugging Face...")
    try:
        create_repo(repo_id=repo_id, token=token, private=args.private, exist_ok=True, repo_type="model")
        print(f"[+] Repository '{repo_id}' is ready.")
    except Exception as e:
        print(f"[!] Warning during repo creation: {e}")

    # 2. Upload folder
    print(f"[*] Uploading model files (weights ~536MB, config, tokenizer)... This may take 1-3 minutes depending on your internet connection.")
    try:
        api.upload_folder(
            folder_path=str(model_dir),
            repo_id=repo_id,
            repo_type="model",
            commit_message="feat: upload SecureAct Horizon v3 (ModernBERT 141M) weights & config"
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
