import os
import webview
import json
import shutil
from datetime import datetime
import re

# --- CONFIGURATION ---
RULES_PATH = os.path.expanduser(r"~/.gemini/GEMINI.md")
MAIN_JS_PATH = r"C:\Users\YUSUF ÇİNAR\AppData\Local\Programs\Antigravity\resources\app\out\jetskiAgent\main.js"
BACKUP_DIR = r"C:\Users\YUSUF ÇİNAR\AppData\Local\Programs\Antigravity\resources\app\out\jetskiAgent\backups"

class API:
    def get_system_status(self):
        status = {
            "patchActive": False,
            "rulesPath": RULES_PATH,
            "backupCount": 0
        }
        
        # Check Patch
        if os.path.exists(MAIN_JS_PATH):
            try:
                with open(MAIN_JS_PATH, "r", encoding="utf-8") as f:
                    content = f.read()
                    if "Dynamic rules injection failed" in content:
                        status["patchActive"] = True
            except:
                pass
        
        # Check Backups
        if os.path.exists(BACKUP_DIR):
            status["backupCount"] = len([f for f in os.listdir(BACKUP_DIR) if f.endswith(".bak")])
            
        return status

    def _get_metadata(self):
        meta_path = os.path.join(BACKUP_DIR, "backups_metadata.json")
        if os.path.exists(meta_path):
            try:
                with open(meta_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except:
                pass
        return {"favorites": [], "last_backup_date": None}

    def _save_metadata(self, meta):
        os.makedirs(BACKUP_DIR, exist_ok=True)
        meta_path = os.path.join(BACKUP_DIR, "backups_metadata.json")
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(meta, f, indent=4)

    def get_backups(self):
        if not os.path.exists(BACKUP_DIR):
            return []
        
        meta = self._get_metadata()
        backups = []
        for f in os.listdir(BACKUP_DIR):
            if f.endswith(".bak"):
                path = os.path.join(BACKUP_DIR, f)
                stats = os.stat(path)
                backups.append({
                    "filename": f,
                    "size": stats.st_size,
                    "date": datetime.fromtimestamp(stats.st_mtime).strftime("%Y-%m-%d %H:%M:%S"),
                    "isFavorite": f in meta.get("favorites", [])
                })
        
        # Sort by date descending
        backups.sort(key=lambda x: x["date"], reverse=True)
        return backups

    def toggle_favorite(self, filename):
        meta = self._get_metadata()
        if "favorites" not in meta: meta["favorites"] = []
        
        if filename in meta["favorites"]:
            meta["favorites"].remove(filename)
        else:
            meta["favorites"].append(filename)
        
        self._save_metadata(meta)
        return {"success": True, "isFavorite": filename in meta["favorites"]}

    def restore_backup(self, filename):
        path = os.path.join(BACKUP_DIR, filename)
        if not os.path.exists(path):
            return {"success": False, "error": "Backup file not found."}
        
        try:
            shutil.copy2(path, MAIN_JS_PATH)
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def read_rules(self):
        if os.path.exists(RULES_PATH):
            try:
                with open(RULES_PATH, "r", encoding="utf-8") as f:
                    return f.read()
            except Exception as e:
                return f"Error reading rules: {e}"
        return "Rules file not found. Create your first rule here!"

    def save_rules(self, content):
        try:
            os.makedirs(os.path.dirname(RULES_PATH), exist_ok=True)
            with open(RULES_PATH, "w", encoding="utf-8") as f:
                f.write(content)
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def apply_patch(self):
        return self._do_patch()

    def _do_patch(self):
        RULES_PATH_JS = RULES_PATH.replace("\\", "/")
        
        if not os.path.exists(MAIN_JS_PATH):
            return {"success": False, "error": "Antigravity installation not found."}

        try:
            # Smart Backup Logic
            os.makedirs(BACKUP_DIR, exist_ok=True)
            meta = self._get_metadata()
            today = datetime.now().strftime("%Y-%m-%d")
            
            # If we already backed up today, we can skip unless it's the first time or specific conditions
            # For simplicity: One backup per day is enough unless the user forces it.
            if meta.get("last_backup_date") != today:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                backup_file = os.path.join(BACKUP_DIR, f"main.js.{timestamp}.bak")
                shutil.copy2(MAIN_JS_PATH, backup_file)
                meta["last_backup_date"] = today
                self._save_metadata(meta)

            with open(MAIN_JS_PATH, 'r', encoding='utf-8') as f:
                content = f.read()

            target_regex = r'([a-zA-Z_$][0-9a-zA-Z_$]*)\s*\(\s*([a-zA-Z_$][0-9a-zA-Z_$]*)\s*,\s*\{([^{}]*?artifactComments:[a-zA-Z_$][0-9a-zA-Z_$]*[^{}]*?)\}\s*\)'
            patched_pattern = r'\(\(\.\.\.args\)\s*=>\s*\{.*?rules.*?args\[0\].*?\}\s*\)\s*\(\s*([a-zA-Z_$][0-9a-zA-Z_$\s]*)\s*,\s*\{(.*?)\}\s*\)'
            
            p_match = re.search(patched_pattern, content, re.DOTALL)
            o_match = re.search(target_regex, content, re.DOTALL)

            if p_match:
                full_match = p_match.group(0)
                arg1 = p_match.group(1).strip()
                arg2_content = p_match.group(2).strip()
                func_search = re.search(r'return\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*\(\s*\.\.\.args\s*\)\s*;', full_match)
                func_name = func_search.group(1) if func_search else "e"
            elif o_match:
                full_match = o_match.group(0)
                func_name = o_match.group(1)
                arg1 = o_match.group(2)
                arg2_content = o_match.group(3)
            else:
                return {"success": False, "error": "Target point not found."}

            injection = f"""((...args) => {{
                try {{
                    const fs = require('fs');
                    const path = '{RULES_PATH_JS}';
                    if (fs.existsSync(path)) {{
                        const rules = fs.readFileSync(path, 'utf8');
                        args[0] = rules + "\\n\\n" + args[0];
                    }}
                }} catch(e) {{
                    console.error("Dynamic rules injection failed:", e);
                }}
                return {func_name}(...args);
            }})"""

            replacement = f"{injection}({arg1},{{{arg2_content}}})"
            new_content = content.replace(full_match, replacement)

            with open(MAIN_JS_PATH, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

def resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")

    return os.path.join(base_path, relative_path)

def start_app():
    import sys
    api = API()
    
    # Path to the bundled or local index.html
    index_path = resource_path(os.path.join("acc-pro", "dist", "index.html"))
    
    if not os.path.exists(index_path):
        print(f"Build files not found at {index_path}! Please run 'npm run build' first.")
        return

    window = webview.create_window(
        'Antigravity Control Center Pro', 
        url=f"file:///{index_path.replace('\\', '/')}", 
        js_api=api,
        width=1150,
        height=800,
        resizable=True,
        transparent=True
    )
    webview.start(debug=False)

if __name__ == '__main__':
    start_app()
