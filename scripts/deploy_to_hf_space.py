"""
SecureAct Horizon v3 — Hugging Face Space Deployment Utility
============================================================
Packages the FastAPI neural backend and deploys it to a free
Hugging Face Docker Space (16 GB RAM).

Usage:
    python scripts/deploy_to_hf_space.py --space-id lufy77/secureact-horizon-api [--token <hf_token>]
"""

import os
import sys
import shutil
import argparse
import tempfile
from pathlib import Path

from huggingface_hub import HfApi, create_repo

def main():
    parser = argparse.ArgumentParser(description="Deploy SecureAct Horizon Backend to Hugging Face Spaces")
    parser.add_argument(
        "--space-id",
        default="lufy77/secureact-horizon-api",
        help="Target Hugging Face Space ID (default: lufy77/secureact-horizon-api)"
    )
    parser.add_argument(
        "--token",
        default=os.environ.get("HF_TOKEN"),
        help="Hugging Face User Access Token (with Write permissions)"
    )

    args = parser.parse_args()
    token = args.token
    if not token:
        print("[!] Error: No Hugging Face token provided.")
        print("    Please provide --token <your_token> or set the HF_TOKEN environment variable.")
        sys.exit(1)

    space_id = args.space_id
    project_root = Path(__file__).resolve().parent.parent
    deployment_dir = project_root / "deployment" / "hf_space"

    print(f"[*] Target Space: {space_id}")
    print("[*] Validating access token with Hugging Face...")
    api = HfApi(token=token)
    try:
        user_info = api.whoami()
        username = user_info.get("name", "Unknown")
        print(f"[+] Token verified! Authenticated as: @{username}")
    except Exception as e:
        print(f"[!] Authentication Error: {e}")
        sys.exit(1)

    # 1. Ensure Space repo exists
    print(f"[*] Ensuring Space repository '{space_id}' exists...")
    try:
        create_repo(
            repo_id=space_id,
            token=token,
            repo_type="space",
            space_sdk="docker",
            exist_ok=True
        )
        print(f"[+] Space repository '{space_id}' is ready.")
    except Exception as e:
        print(f"[!] Notice during Space creation: {e}")

    # 2. Prepare staging bundle
    print("[*] Staging application bundle (~2.8MB)...")
    with tempfile.TemporaryDirectory() as temp_dir:
        staging_path = Path(temp_dir)

        # Copy deployment files
        shutil.copy2(deployment_dir / "Dockerfile", staging_path / "Dockerfile")
        shutil.copy2(deployment_dir / "requirements.txt", staging_path / "requirements.txt")
        shutil.copy2(deployment_dir / "README.md", staging_path / "README.md")

        # Copy backend directory
        shutil.copytree(
            project_root / "backend",
            staging_path / "backend",
            ignore=shutil.ignore_patterns("__pycache__", "*.pyc")
        )

        # Copy models directory (baseline LinearSVC)
        shutil.copytree(
            project_root / "models",
            staging_path / "models",
            ignore=shutil.ignore_patterns("__pycache__", "*.pyc")
        )

        print(f"[*] Uploading bundle to Hugging Face Spaces (takes ~10 seconds)...")
        api.upload_folder(
            folder_path=str(staging_path),
            repo_id=space_id,
            repo_type="space",
            commit_message="feat: deploy SecureAct Horizon v3 FastAPI neural backend"
        )

    # Format public space URL
    space_user, space_name = space_id.split("/")
    space_url = f"https://huggingface.co/spaces/{space_id}"
    api_url = f"https://{space_user}-{space_name.replace('_', '-')}.hf.space"

    print(f"\n[SUCCESS] Deployment successfully uploaded to Hugging Face Spaces!")
    print(f"   Space Console: {space_url}")
    print(f"   Live API URL:  {api_url}")
    print(f"   Health Check:  {api_url}/health")
    print(f"   Swagger Docs:  {api_url}/docs")

if __name__ == "__main__":
    main()
