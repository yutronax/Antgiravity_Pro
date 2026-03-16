import os
import re
import shutil
from datetime import datetime

# Universally target the real application path in AppData
REAL_APP_PATH = r'C:\Users\YUSUF ÇİNAR\AppData\Local\Programs\Antigravity\resources\app\out\jetskiAgent\main.js'
RULES_PATH = r'C:/Users/YUSUF ÇİNAR/.gemini/GEMINI.md' # Using forward slashes for JS safety
REAL_BACKUP_DIR = r'C:\Users\YUSUF ÇİNAR\AppData\Local\Programs\Antigravity\resources\app\out\jetskiAgent\backups'

def apply_patch(target_file, backup_dir):
    print(f"\n--- PATCHING: {target_file} ---")
    
    if not os.path.exists(target_file):
        print(f"[!] Error: File not found: {target_file}")
        return False

    # 1. Create backup
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = os.path.join(backup_dir, f"{os.path.basename(target_file)}.{timestamp}.bak")
    shutil.copy2(target_file, backup_file)
    print(f"[+] Backup created: {backup_file}")

    # 2. Dynamic Injection Logic
    injection = f"""((...args) => {{
        try {{
            const fs = require('fs');
            const path = '{RULES_PATH}';
            if (fs.existsSync(path)) {{
                const rules = fs.readFileSync(path, 'utf8');
                args[0] = rules + "\\n\\n" + args[0];
            }}
        }} catch(e) {{
            console.error("Dynamic rules injection failed:", e);
        }}
        return e(...args);
    }})"""

    # 3. Apply patch using a robust Regex
    with open(target_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern for original code
    original_target = r'e\(kr,\{media:ar,artifactComments:q,fileDiffComments:xe\}\)'
    
    # Pattern for any existing patch (static or dynamic)
    patched_pattern = r'\(\(\.\.\.args\) => \{.*?Rules injection failed.*?\)\}\(kr,\{media:ar,artifactComments:q,fileDiffComments:xe\}\)'
    
    replacement = f'{injection}(kr,{{media:ar,artifactComments:q,fileDiffComments:xe}})'

    if re.search(patched_pattern, content, re.DOTALL):
        print("[+] Existing patch detected. Upgrading to Dynamic System...")
        new_content = re.sub(patched_pattern, replacement, content, flags=re.DOTALL)
    elif re.search(original_target, content):
        print("[+] Original code detected. Applying Dynamic System...")
        new_content = re.sub(original_target, replacement, content)
    else:
        print("[!] Error: Target pattern not found. This file might already have a different structure.")
        return False

    with open(target_file, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("[+] Patch applied successfully!")
    return True

def main():
    print("=== ANTIGRAVITY UNIVERSAL DYNAMIC SYSTEM INSTALLER ===")
    
    # Attempt to patch real AppData first
    success = apply_patch(REAL_APP_PATH, REAL_BACKUP_DIR)
    
    # Also patch workspace copy if present (for consistency)
    workspace_path = r'jetskiAgent_source\main.js'
    if os.path.exists(workspace_path):
        apply_patch(workspace_path, r'jetskiAgent_source\backups')

    if success:
        print("\n" + "="*50)
        print("SUCCESS: Dynamic Rules System is active!")
        print("1. Please restart Antigravity ONCE to enable the bridge.")
        print("2. You can now edit GEMINI.md anytime. Changes apply INSTANTLY.")
        print("="*50)

if __name__ == "__main__":
    main()
