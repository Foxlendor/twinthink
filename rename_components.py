import os
import re

replacements = {
    "KineticForgeBar": "FundingProgress",
    "RealityProvenanceDrawer": "ProvenancePanel",
    "DisclosureGateModal": "AccessModal",
    "CrowdfundingBar": "CampaignBar",
    "TwizzLockViewer": "PistonViewer",
}

base_dir = r"c:\Users\Foxle\Downloads\twinth.ink\apps\web\src"

# 1. Rename files and directories
for root, dirs, files in os.walk(base_dir, topdown=False):
    for name in files:
        new_name = name
        for old, new in replacements.items():
            if old in new_name:
                new_name = new_name.replace(old, new)
        if new_name != name:
            old_path = os.path.join(root, name)
            new_path = os.path.join(root, new_name)
            print(f"Renaming {old_path} -> {new_path}")
            os.rename(old_path, new_path)
            
    for name in dirs:
        new_name = name
        for old, new in replacements.items():
            if old in new_name:
                new_name = new_name.replace(old, new)
        if new_name != name:
            old_path = os.path.join(root, name)
            new_path = os.path.join(root, new_name)
            print(f"Renaming {old_path} -> {new_path}")
            os.rename(old_path, new_path)

# 2. Update file contents
for root, dirs, files in os.walk(base_dir):
    for name in files:
        if name.endswith(('.ts', '.tsx', '.css')):
            filepath = os.path.join(root, name)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            original = content
            for old, new in replacements.items():
                content = content.replace(old, new)
            if content != original:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated content in {filepath}")
