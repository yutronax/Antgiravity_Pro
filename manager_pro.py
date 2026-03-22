# -*- coding: utf-8 -*-
import os
import webview
import json
import shutil
import sys
from datetime import datetime
import re

# --- CONFIGURATION ---
RULES_PATH = os.path.expanduser(r"~/.gemini/GEMINI.md")
ROUTER_CONFIG_PATH = os.path.join(os.path.dirname(RULES_PATH), "router_config.json")
# Fix: Absolute path relative to script location
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MEMORY_RULES_DIR = os.path.join(SCRIPT_DIR, "memory", "rules")
SETTINGS_PATH = os.path.expanduser(r"~\AppData\Roaming\Antigravity\User\settings.json")
MAIN_JS_PATH = r"C:\Users\YUSUF ÇİNAR\AppData\Local\Programs\Antigravity\resources\app\out\jetskiAgent\main.js"
BACKUP_DIR = r"C:\Users\YUSUF ÇİNAR\AppData\Local\Programs\Antigravity\resources\app\out\jetskiAgent\backups"
PATCH_FLAG_PATH = os.path.join(os.path.dirname(MAIN_JS_PATH), "patched.txt")

PATCH_FLAG_PATH = os.path.join(os.path.dirname(MAIN_JS_PATH), "patched.txt")
EXECUTION_STATE_PATH = os.path.join(MEMORY_RULES_DIR, "execution_state.json")
LAYOUT_PATH = os.path.join(MEMORY_RULES_DIR, "layout.json")

# --- GRAPH ENGINE ---
class FlowGraph:
    def __init__(self, rule_map):
        self.rules = {r['id']: r for r in rule_map.get('rules', [])}
        self.flows = rule_map.get('flows', [])
        self.dependencies = rule_map.get('dependencies', {})
        
    def get_neighbors(self, node_id, flow_id=None):
        """Get all possible successors for a node, optionally within a flow context"""
        neighbors = []
        
        # 1. Successors from rule definition
        if node_id in self.rules:
            for succ in self.rules[node_id].get('successors', []):
                neighbors.append({"id": succ, "type": "successor"})
                
        # 2. Flow context successors
        if flow_id:
            flow = next((f for f in self.flows if f['id'] == flow_id), None)
            if flow and node_id in flow.get('nodes', []):
                idx = flow['nodes'].index(node_id)
                if idx < len(flow['nodes']) - 1:
                    neighbors.append({"id": flow['nodes'][idx+1], "type": "flow"})
                    
        return neighbors

# --- ROUTER LOGIC ---
class IntentDetector:
    def __init__(self, rule_map_path):
        if not os.path.exists(rule_map_path):
            self.rule_map = {"rules": [], "global_rules": [], "dependencies": {}}
        else:
            with open(rule_map_path, 'r', encoding='utf-8') as f:
                self.rule_map = json.load(f)
        self.intents = {rule['id']: rule for rule in self.rule_map.get('rules', [])}
        
    def detect_intent(self, user_input):
        """
        Purpose: Scored intent detection with threshold and decision trace
        Outputs: (detected rule IDs, decision trace dict)
        """
        scores = {rule_id: 0.0 for rule_id in self.intents}
        user_input_lower = user_input.lower() if user_input else ""
        trace = {"scores": {}, "discarded": [], "conflicts_resolved": []}
        
        if not user_input_lower:
            return ["workflow"], {"scores": {"workflow": "default"}, "discarded": []}
            
        for rule_id, meta in self.intents.items():
            patterns = meta.get('patterns', [])
            for pattern in patterns:
                if pattern in user_input_lower:
                    scores[rule_id] += 1.0
            trace["scores"][rule_id] = scores[rule_id]
        
        threshold = 0.7
        detected = [rid for rid, score in scores.items() if score >= threshold]
        
        # Identify discarded intents for trace
        for rid, score in scores.items():
            if 0 < score < threshold:
                trace["discarded"].append(f"{rid} (score: {score})")
        
        # Conflict Resolution (Semantic Exclusion)
        # Example rule: 'commit' excludes 'workflow' if workflow score is low
        # In this simplistic version, we just log conflicts
        
        if not detected:
            detected = ["workflow"]
            trace["scores"]["workflow"] = "fallback"
            
        return detected, trace

    def detect_flow(self, user_input):
        """Detect if any predefined flow matches the input"""
        if not user_input or "flows" not in self.rule_map:
            return None
            
        user_input_lower = user_input.lower()
        for flow in self.rule_map["flows"]:
            patterns = flow.get("trigger_patterns", [])
            if any(p in user_input_lower for p in patterns):
                return flow
        return None

class RuleLoader:
    def __init__(self, base_path):
        self.base_path = base_path
        self._cache = {}

    def load_rule(self, rule_file):
        if rule_file in self._cache: return self._cache[rule_file]
        full_path = os.path.join(self.base_path, os.path.basename(rule_file))
        if os.path.exists(full_path):
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
                self._cache[rule_file] = content
                return content
        return f"<!-- Rule file {rule_file} not found -->"

class RuleRouter:
    def __init__(self, rules_dir):
        self.rules_dir = rules_dir
        map_path = os.path.join(rules_dir, "rule_map.json")
        self.detector = IntentDetector(map_path)
        self.loader = RuleLoader(rules_dir)
        self.graph = FlowGraph(self.detector.rule_map)
        
        # Load Dependency Graph from JSON for resolver
        self.dependency_graph = self.detector.rule_map.get('dependencies', {})
        self.state = self._load_execution_state()
        self.layout = self._load_layout()
        self._validate_graph()

    def _load_layout(self):
        if os.path.exists(LAYOUT_PATH):
            try:
                with open(LAYOUT_PATH, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    # Sanitization: Ensure coordinates are valid numbers and not too small
                    sanitized = {}
                    for node_id, pos in data.items():
                        if isinstance(pos, dict) and 'x' in pos and 'y' in pos:
                            # If coordinates are at edge/zero, discard them to trigger re-assignment
                            if pos['x'] > 50 and pos['y'] > 50:
                                sanitized[node_id] = pos
                    return sanitized
            except: pass
        return {}

    def _save_layout(self):
        try:
            with open(LAYOUT_PATH, 'w', encoding='utf-8') as f:
                json.dump(self.layout, f, indent=2)
        except: pass

    def update_node_position(self, node_id, x, y):
        self.layout[node_id] = {"x": x, "y": y}
        self._save_layout()
        return True

    def add_manual_connection(self, source_id, target_id):
        """Add a successor link manually and save to rule_map.json"""
        rule_map = self.detector.rule_map
        for rule in rule_map.get('rules', []):
            if rule['id'] == source_id:
                if 'successors' not in rule: rule['successors'] = []
                if target_id not in rule['successors']:
                    rule['successors'].append(target_id)
                
                # Save back to disk
                map_path = os.path.join(self.rules_dir, "rule_map.json")
                try:
                    with open(map_path, 'w', encoding='utf-8') as f:
                        json.dump(rule_map, f, indent=2)
                    # Refresh detector
                    self.detector = IntentDetector(map_path)
                    self.graph = FlowGraph(self.detector.rule_map)
                    return True
                except: pass
        return False

    def clone_rule(self, rule_id):
        """Duplicate an existing rule with a new ID"""
        rule_map = self.detector.rule_map
        rules = rule_map.get('rules', [])
        
        target_rule = next((r for r in rules if r['id'] == rule_id), None)
        if not target_rule: return False
        
        # Create new ID
        import time
        new_id = f"{rule_id}_copy_{int(time.time() % 1000)}"
        
        # Deep copy and update
        new_rule = target_rule.copy()
        new_rule['id'] = new_id
        
        # Basic layout offset for the copy
        if rule_id in self.layout:
            self.layout[new_id] = {
                "x": self.layout[rule_id]["x"] + 100,
                "y": self.layout[rule_id]["y"] + 50
            }
            self._save_layout()

        rules.append(new_rule)
        rule_map['rules'] = rules
        
        map_path = os.path.join(self.rules_dir, "rule_map.json")
        try:
            with open(map_path, 'w', encoding='utf-8') as f:
                json.dump(rule_map, f, indent=2)
            # Refresh
            self.detector = IntentDetector(map_path)
            self.graph = FlowGraph(self.detector.rule_map)
            return True
        except: pass
        return False

    def _load_execution_state(self):
        if os.path.exists(EXECUTION_STATE_PATH):
            try:
                with open(EXECUTION_STATE_PATH, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except: pass
        return {"current_node": None, "last_flow": None, "history": []}

    def _save_execution_state(self):
        try:
            with open(EXECUTION_STATE_PATH, 'w', encoding='utf-8') as f:
                json.dump(self.state, f, indent=2)
        except: pass

    def _validate_graph(self):
        """Advanced Static Validation: orphan nodes and missing files"""
        validation_errors = []
        for node, deps in self.dependency_graph.items():
            # Check if intent exists
            if node != "logging" and node != "terminal" and node not in self.detector.intents:
                validation_errors.append(f"Orphan Graph Node: {node}")
            
            # Check dependencies
            for dep in deps:
                if dep not in self.detector.intents and dep not in ["logging", "terminal"]:
                     validation_errors.append(f"Missing Dependency Edge: {node} -> {dep}")
            
            # Check physical file existence
            if node in self.detector.intents:
                f_name = os.path.basename(self.detector.intents[node]['file'])
                f_path = os.path.join(self.rules_dir, f_name)
                if not os.path.exists(f_path):
                    validation_errors.append(f"Missing Rule File: {node} ({f_path})")
        
        if validation_errors:
            print("--- Router Graph Validation Failed ---")
            for error in validation_errors:
                print(f"ERROR: {error}")
            # In production, we might raise an error here

    def resolve_with_dependencies(self, detected_rule_ids):
        """
        Recursive resolution with cycle detection and deterministic ordering
        """
        resolved = []
        visited = set()
        stack = set() # For cycle detection

        # Ensure global rules are always prioritized if not present
        global_rules = self.detector.rule_map.get('global_rules', [])
        
        def dfs(rule_id):
            if rule_id in stack:
                raise Exception(f"Circular dependency detected at: {rule_id}")
            if rule_id in visited:
                return
            
            stack.add(rule_id)
            # Get dependencies from graph
            deps = self.dependency_graph.get(rule_id, [])
            for dep in deps:
                dfs(dep)
            
            stack.remove(rule_id)
            visited.add(rule_id)
            if rule_id not in resolved:
                resolved.append(rule_id)

        # Process detected rules
        for r_id in detected_rule_ids:
            dfs(r_id)
            
        # Process global rules (ensure they are loaded, usually first in priority)
        for g_id in global_rules:
            dfs(g_id)
            
        return resolved

    def route(self, user_prompt=None):
        try:
            detected_ids, trace = self.detector.detect_intent(user_prompt)
            # Use the new deterministic resolver
            resolved_ids = self.resolve_with_dependencies(detected_ids)
            
            rules_to_load = []
            for r_id in resolved_ids:
                if r_id in self.detector.intents:
                    rules_to_load.append(self.detector.intents[r_id])
            
            # Final priority sort (ensure int for comparison)
            rules_to_load.sort(key=lambda x: int(x.get('priority', 50)), reverse=True)
            
            final_content = []
            log_entries = []
            for rule_meta in rules_to_load:
                content = self.loader.load_rule(rule_meta['file'])
                final_content.append(content)
                log_entries.append(rule_meta['id'])
                
            self._log_routing(user_prompt, log_entries, trace)
            return "\n\n---\n\n".join(final_content)
        except Exception as e:
            return f"Router Resolution Error: {e}"

    def get_execution_graph(self, user_prompt=None):
        """
        Phase 2: Backend Flow Engine
        Enhanced graph tracing with state and conditional successors
        """
        detected_ids, trace = self.detector.detect_intent(user_prompt)
        active_flow = self.detector.detect_flow(user_prompt)
        
        # Determine flow context
        flow_id = active_flow.get("id") if active_flow else self.state.get("last_flow")
        flow_nodes = active_flow.get("nodes", []) if active_flow else []
        
        # If we have a prompt but no flow detected, check if we should continue previous flow
        if user_prompt and not active_flow and self.state.get("current_node"):
            # Logic for continuing flows could go here
            pass

        # Build node list - INCLUDE ALL NODES for the editor
        nodes = []
        all_rules = self.detector.rule_map.get('rules', [])
        graph_layout = {}
        
        # Count nodes already in layout to avoid overlapping auto-assignments
        existing_count = len(self.layout)
        
        for idx, rule in enumerate(all_rules):
            r_id = rule['id']
            is_in_flow = r_id in flow_nodes
            is_active = (r_id in detected_ids) or is_in_flow
            is_current = r_id == self.state.get("current_node")
            
            # Use stored layout if available, or auto-assign and persist
            if r_id not in self.layout:
                # Deterministic grid for new nodes, offset by current count
                new_x = (idx % 3) * 250 + 100
                new_y = (idx // 3) * 160 + 100
                self.layout[r_id] = {"x": new_x, "y": new_y}
                self._save_layout()
            
            pos = self.layout[r_id]
            graph_layout[r_id] = pos
            
            nodes.append({
                "id": r_id,
                "label": r_id.upper(),
                "role": rule.get('role', 'optional'),
                "active": is_active,
                "is_current": is_current,
                "priority": rule.get('priority', 50),
                "file": rule.get('file', ''),
                "tags": rule.get('tags', []),
                "in_flow": is_in_flow,
                "manual_pos": pos
            })
        
        # Edge generation using FlowGraph
        edges = []
        node_ids = [n['id'] for n in nodes]
        for r_id in node_ids:
            neighbors = self.graph.get_neighbors(r_id, flow_id)
            for neighbor in neighbors:
                if neighbor['id'] in node_ids:
                    # Avoid duplicate edges
                    if not any(e['source'] == r_id and e['target'] == neighbor['id'] for e in edges):
                        edges.append({
                            "source": r_id, 
                            "target": neighbor['id'], 
                            "type": neighbor['type']
                        })
        
        # SUGGESTION logic
        suggestion = None
        if detected_ids and len(detected_ids) > 0:
            last_detected = detected_ids[-1]
            potential_next = self.graph.get_neighbors(last_detected, flow_id)
            if potential_next:
                suggestion = potential_next[0]['id']

        # Update persistent state if significant change
        if active_flow:
            self.state["last_flow"] = active_flow["id"]
        if detected_ids:
            self.state["current_node"] = detected_ids[-1]
            self.state["history"].append({"node": detected_ids[-1], "time": datetime.now().isoformat()})
            self._save_execution_state()

        return {
            "nodes": nodes, 
            "edges": edges, 
            "suggestion": suggestion,
            "layout": graph_layout,
            "trace": {
                **trace, 
                "active_flow": active_flow.get("id") if active_flow else None,
                "state": self.state
            }
        }

    def _log_routing(self, prompt, rules, trace):
        log_dir = os.path.join(os.path.dirname(self.rules_dir), "logs")
        os.makedirs(log_dir, exist_ok=True)
        today = datetime.now().strftime("%Y-%m-%d")
        log_file = os.path.join(log_dir, f"router_log_{today}.md")
        
        entry = f"## [{datetime.now().strftime('%H:%M:%S')}]\n"
        entry += f"**Prompt:** {prompt[:50]}...\n" if prompt else "**Prompt:** <None>\n"
        entry += f"**Decision Logic:**\n"
        
        # Log scores for detected ones
        for rid, score in trace.get("scores", {}).items():
            if isinstance(score, (int, float)) and score > 0:
                entry += f"  - `{rid}`: {score}\n"
            elif isinstance(score, str):
                entry += f"  - `{rid}`: {score}\n"
        
        # Log discarded
        if trace.get("discarded"):
            entry += f"**Discarded:** {', '.join(trace['discarded'])}\n"
            
        entry += f"**Used Rule IDs:** {', '.join(rules)}\n"
        entry += "---\n"
        
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(entry)

# --- GLOBAL ROUTER INSTANCE ---
router = RuleRouter(MEMORY_RULES_DIR)

class API:
    def __init__(self):
        self.router = RuleRouter(MEMORY_RULES_DIR)

    def get_system_status(self):
        patch_active = os.path.exists(PATCH_FLAG_PATH)
        backup_count = len([f for f in os.listdir(BACKUP_DIR) if f.endswith(".bak")]) if os.path.exists(BACKUP_DIR) else 0
        status = {
            "patchActive": patch_active,
            "rulesPath": RULES_PATH,
            "backupCount": backup_count,
            "terminalPolicy": "Off"
        }
        if os.path.exists(SETTINGS_PATH):
            try:
                with open(SETTINGS_PATH, "r", encoding="utf-8") as f:
                    settings = json.load(f)
                    status["terminalPolicy"] = settings.get("antigravity.terminalAutoExecutionPolicy", "Off")
            except: pass
        return status

    # --- RULE MANAGEMENT API ---
    def get_active_graph(self, prompt=""):
        return self.router.get_execution_graph(prompt)

    def update_node_position(self, node_id, x, y):
        return self.router.update_node_position(node_id, x, y)

    def add_manual_connection(self, source_id, target_id):
        return self.router.add_manual_connection(source_id, target_id)

    def clone_rule(self, rule_id):
        return self.router.clone_rule(rule_id)

    def get_rule_map(self):
        try:
            map_path = os.path.join(MEMORY_RULES_DIR, "rule_map.json")
            if os.path.exists(map_path):
                with open(map_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            return {"rules": [], "dependencies": {}, "global_rules": []}
        except Exception as e:
            return {"error": str(e)}

    def save_rule_map(self, new_map):
        try:
            map_path = os.path.join(MEMORY_RULES_DIR, "rule_map.json")
            with open(map_path, "w", encoding="utf-8") as f:
                json.dump(new_map, f, indent=2)
            
            global router
            router = RuleRouter(MEMORY_RULES_DIR)
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def add_rule(self, rule_data):
        try:
            rule_id = rule_data.get('id')
            filename = rule_data.get('file')
            content = rule_data.get('content', '# New Rule')
            
            full_path = os.path.abspath(os.path.join(os.path.dirname(MEMORY_RULES_DIR), "..", filename))
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, "w", encoding="utf-8") as f:
                f.write(content)
                
            current_map = self.get_rule_map()
            current_map['rules'] = [r for r in current_map['rules'] if r['id'] != rule_id]
            
            new_rule = {
                "id": rule_id,
                "file": filename,
                "role": rule_data.get('role', 'optional'),
                "tags": rule_data.get('tags', []),
                "intent": rule_data.get('intent', 'custom'),
                "triggers": rule_data.get('triggers', []),
                "patterns": rule_data.get('patterns', []),
                "dependencies": rule_data.get('dependencies', []),
                "priority": rule_data.get('priority', 10),
                "scope": rule_data.get('scope', 'local')
            }
            current_map['rules'].append(new_rule)
            current_map['dependencies'][rule_id] = rule_data.get('dependencies', [])
            
            return self.save_rule_map(current_map)
        except Exception as e:
            return {"success": False, "error": str(e)}

    def delete_rule(self, rule_id):
        try:
            current_map = self.get_rule_map()
            current_map['rules'] = [r for r in current_map['rules'] if r['id'] != rule_id]
            if rule_id in current_map['dependencies']: del current_map['dependencies'][rule_id]
            return self.save_rule_map(current_map)
        except Exception as e:
            return {"success": False, "error": str(e)}

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

    def read_rules(self, context=None):
        # Soft Migration Check: If GEMINI.md starts with "ROUTER_ENABLED: true", use router
        use_router = False
        legacy_content = ""
        
        if os.path.exists(RULES_PATH):
            try:
                with open(RULES_PATH, "r", encoding="utf-8") as f:
                    legacy_content = f.read()
                    if legacy_content.strip().startswith("ROUTER_ENABLED: true"):
                        use_router = True
            except:
                pass

        if use_router:
            try:
                global router
                return router.route(context)
            except Exception as e:
                return f"Router Error: {e}\n\nFallback to Legacy:\n{legacy_content}"
        
        return legacy_content if legacy_content else "Rules file not found."

    def save_rules(self, content):
        try:
            os.makedirs(os.path.dirname(RULES_PATH), exist_ok=True)
            with open(RULES_PATH, "w", encoding="utf-8") as f:
                f.write(content)
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def set_terminal_policy(self, policy):
        if not os.path.exists(SETTINGS_PATH):
            settings = {}
        else:
            try:
                with open(SETTINGS_PATH, "r", encoding="utf-8") as f:
                    settings = json.load(f)
            except:
                settings = {}
        
        settings["antigravity.terminalAutoExecutionPolicy"] = policy
        
        try:
            with open(SETTINGS_PATH, "w", encoding="utf-8") as f:
                json.dump(settings, f, indent=4)
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
            
            # Create patch flag
            with open(PATCH_FLAG_PATH, 'w') as f:
                f.write("patched")
            
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
