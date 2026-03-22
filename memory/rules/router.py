import re
import json
import os

class IntentDetector:
    def __init__(self, rule_map_path):
        with open(rule_map_path, 'r', encoding='utf-8') as f:
            self.rule_map = json.load(f)
        
        self.intents = {rule['id']: rule for rule in self.rule_map['rules']}
        
    def detect_intent(self, user_input):
        """
        Purpose: Detect user intent from input string
        Inputs: user_input (str)
        Outputs: list of detected rule IDs
        """
        detected = []
        user_input_lower = user_input.lower() if user_input else ""
        
        if user_input_lower:
            for rule_id, meta in self.intents.items():
                # Keyword matching
                for pattern in meta['patterns']:
                    if pattern in user_input_lower:
                        detected.append(rule_id)
                        break
        else:
            detected.append("workflow") # Default if empty
            
            # Regex matching (optional, can be added to meta)
            # if re.search(meta.get('regex', ''), user_input_lower):
            #     detected.append(rule_id)
        
        # Add global rules regardless of intent
        for global_rule in self.rule_map.get('global_rules', []):
            if global_rule not in detected:
                detected.append(global_rule)
                
        # Handle dependencies
        final_detected = set(detected)
        for rule_id in list(final_detected):
            deps = self.rule_map['dependencies'].get(rule_id, [])
            for dep in deps:
                final_detected.add(dep)
        
        return list(final_detected)

class RuleLoader:
    def __init__(self, base_path):
        self.base_path = base_path
        self._cache = {}

    def load_rule(self, rule_file):
        """Purpose: Load rule content from file with caching"""
        if rule_file in self._cache:
            return self._cache[rule_file]
            
        full_path = os.path.join(self.base_path, os.path.basename(rule_file))
        if os.path.exists(full_path):
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
                self._cache[rule_file] = content
                return content
        return f"<!-- Rule file {rule_file} not found -->"

class RuleRouter:
    def __init__(self, rule_map_path):
        base_dir = os.path.dirname(os.path.abspath(rule_map_path))
        self.detector = IntentDetector(rule_map_path)
        self.loader = RuleLoader(base_dir)
        self.rule_map = self.detector.rule_map

    def resolve_rules(self, user_prompt):
        """Purpose: Detect intent and load corresponding rules concatenated"""
        rule_ids = self.detector.detect_intent(user_prompt)
        
        # Sort by priority (asc or desc? usually global first, then specific)
        # We'll use the priority from rule_map
        rules_to_load = []
        for rule_id in rule_ids:
            rules_to_load.append(self.detector.intents[rule_id])
            
        rules_to_load.sort(key=lambda x: x.get('priority', 50), reverse=True)
        
        final_content = []
        for rule_meta in rules_to_load:
            content = self.loader.load_rule(rule_meta['file'])
            final_content.append(content)
            
        return "\n\n---\n\n".join(final_content)

if __name__ == "__main__":
    # Quick test
    base_dir = os.path.dirname(os.path.abspath(__file__))
    rule_map_path = os.path.join(base_dir, "rule_map.json")
    router = RuleRouter(rule_map_path)
    
    print("--- Test: 'plan' ---")
    print(router.resolve_rules("Yeni bir plan yapalım"))
    
    print("\n--- Test: 'git commit' ---")
    print(router.resolve_rules("değişiklikleri commit et"))
    
    print("\n--- Test: 'empty' ---")
    print(router.resolve_rules(""))
