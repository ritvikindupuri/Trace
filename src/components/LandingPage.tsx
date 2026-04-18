import React from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { 
  Shield, 
  Terminal, 
  Database, 
  Zap, 
  ChevronRight, 
  ArrowRight,
  ShieldCheck,
  Search,
  Activity,
  Lock,
  Cpu,
  MousePointer2,
  Layers,
  Fingerprint,
  FileText,
  Package,
  Sparkles,
  Settings
} from 'lucide-react';
import { Button } from './ui/button';

import Logo from './ui/Logo';

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.1], [0, -50]);

  return (
    <div className="min-h-screen bg-white text-[#1D1D1F] font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-[#F5F5F7]">
        <div className="max-w-[1000px] mx-auto px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <Fingerprint size={20} className="text-[#1D1D1F]" />
            <span className="text-sm font-bold tracking-tight">Trace</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[12px] font-medium text-[#424245]">
            <a href="#audit" className="hover:text-[#1D1D1F] transition-colors">Audit Engine</a>
            <a href="#workflows" className="hover:text-[#1D1D1F] transition-colors">Workflows</a>
            <a href="#evidence" className="hover:text-[#1D1D1F] transition-colors">Evidence</a>
            <a href="#security" className="hover:text-[#1D1D1F] transition-colors">Security</a>
          </div>
          <Button 
            size="sm" 
            className="rounded-full bg-[#1D1D1F] hover:bg-black text-white px-4 h-8 text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95 px-4"
            onClick={onGetStarted}
          >
            Launch Console
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
        <motion.div 
          style={{ opacity, y }}
          className="max-w-4xl mx-auto text-center space-y-8"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-5xl md:text-[80px] font-bold tracking-tight leading-[1.1] mb-6">
              Harden macOS.<br />
              <span className="text-[#86868B]">
                With real evidence.
              </span>
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-8"
          >
            <p className="text-xl md:text-2xl text-[#1D1D1F] max-w-xl mx-auto font-medium leading-relaxed">
              The expert assistant for macOS security engineers. Audit posture, review artifacts, and generate remediation playbooks.
            </p>
            <div className="flex items-center gap-6">
              <Button 
                size="lg" 
                className="rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white px-8 h-12 text-[14px] font-bold transition-all active:scale-95"
                onClick={onGetStarted}
              >
                Scan My First Artifact
              </Button>
            </div>
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <div className="w-[1px] h-12 bg-gradient-to-b from-[#D2D2D7] to-transparent"></div>
        </motion.div>
      </section>

      {/* Product Preview */}
      <section id="audit" className="px-6 pb-44 bg-[#FBFBFD]">
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-[1400px] mx-auto"
        >
          <div className="bg-[#1D1D1F] rounded-[3rem] p-4 md:p-8 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-50"></div>
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-white/5 relative flex h-[600px]">
              <div className="w-[300px] border-r border-[#F5F5F7] bg-[#F5F5F7] p-6 space-y-4">
                 <div className="flex items-center gap-2 mb-8">
                   <Package size={18} />
                   <div className="h-2 w-24 bg-[#D2D2D7] rounded-full"></div>
                 </div>
                 <div className="space-y-3">
                   {[1, 2, 3].map(i => (
                     <div key={i} className="bg-white p-3 rounded-xl border border-[#D2D2D7] space-y-2">
                       <div className="h-2 w-16 bg-[#D2D2D7] rounded-full"></div>
                       <div className="h-1.5 w-full bg-[#F5F5F7] rounded-full"></div>
                       <div className="h-1.5 w-2/3 bg-[#F5F5F7] rounded-full"></div>
                     </div>
                   ))}
                 </div>
              </div>
              <div className="flex-1 bg-white p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-[#F5F5F7] pb-6">
                  <div className="h-4 w-32 bg-[#D2D2D7] rounded-full"></div>
                  <div className="h-8 w-24 bg-[#1D1D1F] rounded-full"></div>
                </div>
                <div className="space-y-4">
                  <div className="h-6 w-full bg-[#F5F5F7] rounded-xl"></div>
                  <div className="h-6 w-5/6 bg-[#F5F5F7] rounded-xl"></div>
                  <div className="h-4 w-1/2 bg-[#0071E3]/20 rounded-xl mt-8"></div>
                  <div className="bg-[#F5F5F7] p-4 rounded-xl space-y-2 font-mono">
                    <div className="h-2 w-full bg-[#D2D2D7] rounded-full opacity-30"></div>
                    <div className="h-2 w-3/4 bg-[#D2D2D7] rounded-full opacity-30"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Logic Sections */}
      <section id="workflows" className="py-44 px-6">
        <div className="max-w-4xl mx-auto space-y-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-bold tracking-tight text-center leading-[1.1]"
          >
            Specialized workflows<br />for deep visibility.
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F5F5F7] flex items-center justify-center mb-6">
                <Lock size={24} className="text-[#0071E3]" />
              </div>
              <h3 className="text-2xl font-bold">FileVault & Secure Boot</h3>
              <p className="text-lg text-[#86868B] font-medium leading-relaxed">
                Deep audit of disk encryption status, Secure Boot configurations, and System Integrity Protection (SIP) levels.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F5F5F7] flex items-center justify-center mb-6">
                <Settings size={24} className="text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold">MDM Profile Auditor</h3>
              <p className="text-lg text-[#86868B] font-medium leading-relaxed">
                Analyze configuration profiles, flag redundant payloads, and generate compliant .mobileconfig XML snippets instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Evidence Section */}
      <section id="evidence" className="py-44 px-6 bg-[#F5F5F7]">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              title: "Line Citation", 
              desc: "Every security finding includes a direct snippet from your source artifacts for zero-trust validation.",
              icon: FileText 
            },
            { 
              title: "Posture Scoring", 
              desc: "Get an empirical hardening score based on CIS Benchmarks and custom security policies.",
              icon: Activity 
            },
            { 
              title: "Playbook Engine", 
              desc: "Instant remediation playbooks with copy-paste terminal commands and configuration steps.",
              icon: Terminal 
            }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-[2.5rem] p-10 space-y-6 shadow-sm hover:shadow-xl transition-all duration-500"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#F5F5F7] flex items-center justify-center">
                <feature.icon size={24} className="text-[#1D1D1F]" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-bold">{feature.title}</h4>
                <p className="text-[#86868B] font-medium leading-relaxed">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Intelligence Section */}
      <section className="py-44 px-6 overflow-hidden bg-[#FBFBFD]">
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          <div className="lg:w-[35%] space-y-10">
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
              Expert reasoning.<br />Powered by Gemini.
            </h2>
            <p className="text-xl text-[#86868B] font-medium leading-relaxed">
              Trace leverages Gemini 3.1 Pro to perform deep-context analysis of your system files, identifying risks that signature-based tools miss.
            </p>
          </div>
          <div className="lg:w-[65%] relative w-full">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-[#1D1D1F] rounded-[3rem] p-4 md:p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-50"></div>
              <div className="bg-white rounded-2xl overflow-hidden border border-white/5 shadow-inner p-8">
                 <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles size={16} className="text-blue-500" />
                      <div className="h-2 w-32 bg-gray-100 rounded-full"></div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 w-full bg-gray-50 rounded-lg"></div>
                      <div className="h-4 w-5/6 bg-gray-50 rounded-lg"></div>
                      <div className="h-4 w-4/6 bg-gray-50 rounded-lg"></div>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                       <div className="h-2 w-24 bg-emerald-200 rounded-full mb-3"></div>
                       <div className="h-3 w-full bg-emerald-100 rounded-lg"></div>
                    </div>
                 </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-44 px-6 bg-white overflow-hidden">
        <div className="max-w-[1200px] mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-32 space-y-6"
          >
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-center leading-[1.1]">
            Zero-Trust Hardening.</h2>
            <p className="text-xl text-[#86868B] max-w-2xl mx-auto font-medium leading-relaxed">
              Trace doesn't trust your system settings. It audits the raw artifacts to prove your security posture.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#F5F5F7] rounded-[3rem] p-10 space-y-8 flex flex-col justify-between border border-transparent hover:border-[#D2D2D7] transition-all duration-500">
              <div className="space-y-6">
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                  <Cpu size={28} className="text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight">Artifact First</h3>
                <p className="text-base text-[#86868B] font-medium leading-relaxed">
                  Support for system_profiler, profiles, spctl, and raw log ingestion. No agent installation required.
                </p>
              </div>
            </div>

            <div className="bg-[#1D1D1F] rounded-[3rem] p-10 text-white space-y-8 flex flex-col justify-between overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full -mr-32 -mt-32 group-hover:bg-blue-500/20 transition-all duration-700"></div>
              <div className="space-y-6 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-xl">
                  <Fingerprint size={28} className="text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight">Researcher Privacy</h3>
                <p className="text-base text-white/60 font-medium leading-relaxed">
                  Analyze sensitive system configurations in a secure container. Aegis processes data with enterprise-grade privacy.
                </p>
              </div>
            </div>

            <div className="bg-[#F5F5F7] rounded-[3rem] p-10 space-y-8 flex flex-col justify-between border border-transparent hover:border-[#D2D2D7] transition-all duration-500">
              <div className="space-y-6">
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                  <ShieldCheck size={28} className="text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight">Policy Enforcement</h3>
                <p className="text-base text-[#86868B] font-medium leading-relaxed">
                  Verify compliance against internal policies or external standards like NIST and CIS benchmarks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-64 px-6 text-center">
        <motion.div 
          whileInView={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 20 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto space-y-12"
        >
          <h2 className="text-5xl md:text-[80px] font-bold tracking-tight">Audit your Mac.</h2>
          <Button 
            size="lg" 
            className="rounded-full bg-[#1D1D1F] hover:bg-black text-white px-12 h-16 text-lg font-bold transition-all active:scale-95"
            onClick={onGetStarted}
          >
             Launch Trace Console
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-[#F5F5F7] bg-[#FBFBFD]">
        <div className="max-w-[1000px] mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-2">
            <Fingerprint size={20} className="text-[#1D1D1F]" />
            <span className="text-sm font-bold tracking-tight">Trace</span>
          </div>
          <p className="text-[12px] font-medium text-[#86868B]">© 2026 Trace macOS Security. Professional Hardening Assistant.</p>
          <div className="flex gap-8 text-[12px] font-medium text-[#86868B]">
            <a href="#" className="hover:text-[#1D1D1F] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#1D1D1F] transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

