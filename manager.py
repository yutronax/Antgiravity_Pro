import os
import sys
import tkinter as tk
import customtkinter as ctk
from PIL import Image
import re
import shutil
from datetime import datetime

# --- CONFIGURATION ---
RULES_PATH = os.path.expanduser(r"~/.gemini/GEMINI.md")
MAIN_JS_PATH = r"C:\Users\YUSUF ÇİNAR\AppData\Local\Programs\Antigravity\resources\app\out\jetskiAgent\main.js"
LOGO_PATH = r"C:\Users\YUSUF ÇİNAR\.gemini\antigravity\brain\95d09c6f-73b9-4164-baac-792a191b0485\antigravity_acc_logo_1773670712960.png"

ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("blue")

class AntigravityCC(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("Antigravity Control Center")
        self.geometry("1000x700")

        # Configure Grid
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        # --- SIDEBAR ---
        self.sidebar = ctk.CTkFrame(self, width=200, corner_radius=0)
        self.sidebar.grid(row=0, column=0, sticky="nsew")
        
        # Logo Integration
        try:
            logo_image = ctk.CTkImage(light_image=Image.open(LOGO_PATH),
                                      dark_image=Image.open(LOGO_PATH),
                                      size=(120, 120))
            self.logo_label = ctk.CTkLabel(self.sidebar, image=logo_image, text="")
        except Exception as e:
            print(f"Logo load error: {e}")
            self.logo_label = ctk.CTkLabel(self.sidebar, text="ANTIGRAVITY", font=ctk.CTkFont(size=20, weight="bold"))
        
        self.logo_label.pack(pady=(30, 20), padx=20)

        self.dashboard_btn = ctk.CTkButton(self.sidebar, text="Dashboard", command=self.show_dashboard)
        self.dashboard_btn.pack(pady=10, padx=20)

        self.rules_btn = ctk.CTkButton(self.sidebar, text="Rules Editor", command=self.show_editor)
        self.rules_btn.pack(pady=10, padx=20)

        self.about_btn = ctk.CTkButton(self.sidebar, text="About", command=self.show_about)
        self.about_btn.pack(side="bottom", pady=20, padx=20)

        # --- MAIN CONTENT ---
        self.main_frame = ctk.CTkFrame(self, corner_radius=15)
        self.main_frame.grid(row=0, column=1, sticky="nsew", padx=20, pady=20)
        self.main_frame.grid_columnconfigure(0, weight=1)
        self.main_frame.grid_rowconfigure(1, weight=1)

        self.current_view = None
        self.show_dashboard()

    def clear_main(self):
        for widget in self.main_frame.winfo_children():
            widget.destroy()

    def show_dashboard(self):
        self.clear_main()
        
        # Header
        header = ctk.CTkLabel(self.main_frame, text="System Dashboard", font=ctk.CTkFont(size=26, weight="bold"))
        header.pack(pady=(20, 10))

        # Status Cards Container
        status_container = ctk.CTkFrame(self.main_frame, fg_color="transparent")
        status_container.pack(fill="x", padx=40, pady=20)

        # Patch Status Card
        patch_status = self.check_patch_status()
        color = "#2ecc71" if patch_status == "ACTIVE" else "#e74c3c"
        
        card = ctk.CTkFrame(status_container, width=300, height=150, corner_radius=10, border_width=2, border_color=color)
        card.pack(side="left", expand=True, padx=10)
        
        ctk.CTkLabel(card, text="PATCH STATUS", font=ctk.CTkFont(size=12)).pack(pady=(20, 5))
        ctk.CTkLabel(card, text=patch_status, font=ctk.CTkFont(size=24, weight="bold"), text_color=color).pack(pady=5)

        # Quick Actions
        ctk.CTkLabel(self.main_frame, text="Quick Actions", font=ctk.CTkFont(size=18, weight="bold")).pack(pady=(20, 10))
        
        btn_patch = ctk.CTkButton(self.main_frame, text="Run/Upgrade Dynamic Patch", height=40, fg_color="#3498db", hover_color="#2980b9", command=self.apply_patch)
        btn_patch.pack(pady=10)

        btn_backup = ctk.CTkButton(self.main_frame, text="Restore Last Backup", height=40, fg_color="#95a5a6", hover_color="#7f8c8d")
        btn_backup.pack(pady=10)

    def show_editor(self):
        self.clear_main()
        
        header = ctk.CTkLabel(self.main_frame, text="GEMINI.md Rules Editor", font=ctk.CTkFont(size=24, weight="bold"))
        header.pack(pady=10)

        # Editor Frame
        editor_frame = ctk.CTkFrame(self.main_frame)
        editor_frame.pack(fill="both", expand=True, padx=20, pady=10)

        self.textbox = ctk.CTkTextbox(editor_frame, font=("Consolas", 14))
        self.textbox.pack(fill="both", expand=True, padx=5, pady=5)

        # Load Rules
        if os.path.exists(RULES_PATH):
            with open(RULES_PATH, 'r', encoding='utf-8') as f:
                content = f.read()
                self.textbox.insert("1.0", content)
        
        btn_save = ctk.CTkButton(self.main_frame, text="Save & Sync Rules", command=self.save_rules, fg_color="#16a085", hover_color="#1abc9c")
        btn_save.pack(pady=20)

    def show_about(self):
        self.clear_main()
        ctk.CTkLabel(self.main_frame, text="Antigravity Control Center", font=ctk.CTkFont(size=24, weight="bold")).pack(pady=20)
        ctk.CTkLabel(self.main_frame, text="Version 1.0.0-Beta\nDeveloped for Advanced Agentic Coding", justify="center").pack(pady=10)

    def check_patch_status(self):
        if not os.path.exists(MAIN_JS_PATH): return "NOT FOUND"
        try:
            with open(MAIN_JS_PATH, "r", encoding="utf-8") as f:
                content = f.read()
                if "Dynamic rules injection failed" in content:
                    return "ACTIVE"
                return "INACTIVE"
        except:
            return "ERROR"

    def save_rules(self):
        content = self.textbox.get("1.0", "end-1c")
        try:
            os.makedirs(os.path.dirname(RULES_PATH), exist_ok=True)
            with open(RULES_PATH, "w", encoding="utf-8") as f:
                f.write(content)
            tk.messagebox.showinfo("Success", "Rules saved successfully!\nBecause of Dynamic Patching, changes are active instantly.")
        except Exception as e:
            tk.messagebox.showerror("Error", f"Failed to save: {e}")

    def apply_patch(self):
        # Implementation of patch_agent.py logic inside the GUI
        # For brevity in this message, I'll refer to the external patch_agent.py or bundle it
        import subprocess
        try:
            # We can literally copy the patch logic here or call the script
            # Calling the script for now to maintain consistency
            result = subprocess.run(["python", r"c:\Users\YUSUF ÇİNAR\OneDrive\Belgeler\Masaüstü\projelerim\gitproje\patch_agent.py"], capture_output=True, text=True)
            if "successfully" in result.stdout.lower():
                tk.messagebox.showinfo("Success", "Dynamic Patch Applied Successfully!")
                self.show_dashboard()
            else:
                tk.messagebox.showerror("Failed", f"Patching failed:\n{result.stdout}\n{result.stderr}")
        except Exception as e:
            tk.messagebox.showerror("Error", str(e))

if __name__ == "__main__":
    app = AntigravityCC()
    app.mainloop()
