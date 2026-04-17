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
  Fingerprint
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
            <Logo size={20} />
          </div>
          <div className="hidden md:flex items-center gap-8 text-[12px] font-medium text-[#424245]">
            <a href="#vision" className="hover:text-[#1D1D1F] transition-colors">Vision</a>
            <a href="#platform" className="hover:text-[#1D1D1F] transition-colors">Platform</a>
            <a href="#intelligence" className="hover:text-[#1D1D1F] transition-colors">Intelligence</a>
            <a href="#security" className="hover:text-[#1D1D1F] transition-colors">Security</a>
          </div>
          <Button 
            className="rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-[12px] font-medium h-7 px-4 transition-all active:scale-95"
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
              Trace tradecraft.<br />
              <span className="text-[#86868B]">
                See the invisible.
              </span>
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-8"
          >
            <p className="text-xl md:text-2xl text-[#86868B] max-w-xl mx-auto font-medium leading-relaxed">
              The professional standard for macOS adversary emulation and telemetry analysis.
            </p>
            <div className="flex items-center gap-6">
              <Button 
                size="lg" 
                className="rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white px-8 h-12 text-base font-semibold transition-all active:scale-95"
                onClick={onGetStarted}
              >
                Launch Console
              </Button>
              <button className="text-[#0071E3] hover:underline text-base font-semibold flex items-center gap-1 group">
                Learn more
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
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
      <section id="platform" className="px-6 pb-44 bg-[#FBFBFD]">
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-[1400px] mx-auto"
        >
          <div className="bg-[#1D1D1F] rounded-[3rem] p-4 md:p-8 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-50"></div>
            <div className="bg-[#2D2D2F] rounded-2xl shadow-2xl overflow-hidden border border-white/5 relative">
              <div className="h-6 bg-[#1D1D1F]/40 border-b border-white/5 flex items-center px-4 gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#FF5F57]"></div>
                <div className="w-2 h-2 rounded-full bg-[#FEBC2E]"></div>
                <div className="w-2 h-2 rounded-full bg-[#28C840]"></div>
              </div>
              <img 
                src="https://i.imgur.com/VUnLbKS.png" 
                alt="Trace Dashboard" 
                className="w-full h-auto block"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1D1D1F]/10 to-transparent pointer-events-none"></div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Vision Section */}
      <section id="vision" className="py-44 px-6">
        <div className="max-w-4xl mx-auto space-y-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-bold tracking-tight text-center leading-[1.1]"
          >
            Designed for the<br />modern security researcher.
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold">Adversary Emulation</h3>
              <p className="text-lg text-[#86868B] font-medium leading-relaxed">
                Execute sophisticated macOS tradecraft with surgical precision. Our engine models real-world behaviors, not just signatures.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-bold">Telemetry Intelligence</h3>
              <p className="text-lg text-[#86868B] font-medium leading-relaxed">
                Deep visibility into the core of macOS. We correlate ESF, Unified Log, and osquery events into a single, coherent narrative.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-44 px-6 bg-[#F5F5F7]">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              title: "Attack Surface", 
              desc: "Real-time mapping of system configurations and permissions.",
              icon: Shield 
            },
            { 
              title: "Behavior Graph", 
              desc: "Visualize the causal chain of every process execution.",
              icon: Layers 
            },
            { 
              title: "Gap Analysis", 
              desc: "Identify exactly where your detection coverage falls short.",
              icon: Search 
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
      <section id="intelligence" className="py-44 px-6 overflow-hidden bg-[#FBFBFD]">
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          <div className="lg:w-[35%] space-y-10">
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
              Intelligence<br />that evolves.
            </h2>
            <p className="text-xl text-[#86868B] font-medium leading-relaxed">
              The Dynamic Intelligence Engine monitors the global threat landscape to provide real-time research alignment.
            </p>
            <Button 
              variant="outline"
              className="rounded-full border-[#1D1D1F] text-[#1D1D1F] px-8 h-12 text-base font-semibold hover:bg-[#1D1D1F] hover:text-white transition-all"
              onClick={onGetStarted}
            >
              Explore Intelligence
            </Button>
          </div>
          <div className="lg:w-[65%] relative w-full">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-[#1D1D1F] rounded-[3rem] p-4 md:p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-50"></div>
              <div className="bg-[#2D2D2F] rounded-2xl overflow-hidden border border-white/5 shadow-inner">
                <div className="h-6 bg-[#1D1D1F]/40 border-b border-white/5 flex items-center px-4 gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#FF5F57]"></div>
                  <div className="w-2 h-2 rounded-full bg-[#FEBC2E]"></div>
                  <div className="w-2 h-2 rounded-full bg-[#28C840]"></div>
                </div>
                <div className="relative overflow-hidden">
                  <img 
                    src="https://i.imgur.com/uOwART9.png" 
                    alt="Security Intelligence" 
                    className="w-full h-auto block opacity-95"
                    referrerPolicy="no-referrer"
                  />
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
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight">Security by design.</h2>
            <p className="text-xl text-[#86868B] max-w-2xl mx-auto font-medium leading-relaxed">
              Trace is built on the same principles that secure macOS. We leverage native frameworks to provide deep, non-intrusive visibility.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#F5F5F7] rounded-[3rem] p-10 space-y-8 flex flex-col justify-between border border-transparent hover:border-[#D2D2D7] transition-all duration-500">
              <div className="space-y-6">
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                  <Cpu size={28} className="text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight">Native Frameworks</h3>
                <p className="text-base text-[#86868B] font-medium leading-relaxed">
                  Direct modeling of the Endpoint Security Framework (ESF) and Unified Logging System. Trace mirrors the exact telemetry schemas used by macOS.
                </p>
              </div>
            </div>

            <div className="bg-[#1D1D1F] rounded-[3rem] p-10 text-white space-y-8 flex flex-col justify-between overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full -mr-32 -mt-32 group-hover:bg-blue-500/20 transition-all duration-700"></div>
              <div className="space-y-6 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-xl">
                  <Fingerprint size={28} className="text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight">Privacy First</h3>
                <p className="text-base text-white/60 font-medium leading-relaxed">
                  Your research tradecraft stays yours. Trace processes telemetry locally, ensuring sensitive intellectual property never leave your environment.
                </p>
              </div>
            </div>

            <div className="bg-[#F5F5F7] rounded-[3rem] p-10 space-y-8 flex flex-col justify-between border border-transparent hover:border-[#D2D2D7] transition-all duration-500">
              <div className="space-y-6">
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                  <Zap size={28} className="text-orange-500" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight">High-Fidelity Emulation</h3>
                <p className="text-base text-[#86868B] font-medium leading-relaxed">
                  Don't wait for a breach to test your rules. Trace provides a safe sandbox to validate detection logic against real-world adversary behaviors.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "SIP Aware", desc: "Monitors System Integrity Protection status and bypass attempts.", icon: Shield },
              { title: "TCC Visibility", desc: "Tracks Transparency, Consent, and Control permission changes.", icon: Lock },
              { title: "Gatekeeper", desc: "Analyzes app notarization and quarantine attribute behaviors.", icon: ShieldCheck }
            ].map((item, i) => (
              <div key={i} className="p-8 rounded-[2.5rem] border border-[#F5F5F7] hover:border-[#D2D2D7] transition-colors space-y-4">
                <item.icon size={20} className="text-[#1D1D1F]" />
                <h4 className="font-bold">{item.title}</h4>
                <p className="text-sm text-[#86868B] font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
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
          <h2 className="text-5xl md:text-8xl font-bold tracking-tight">Ready to trace?</h2>
          <Button 
            size="lg" 
            className="rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white px-12 h-16 text-xl font-semibold transition-all active:scale-95"
            onClick={onGetStarted}
          >
            Launch Console
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-[#F5F5F7] bg-[#FBFBFD]">
        <div className="max-w-[1000px] mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-2">
            <Logo size={20} />
          </div>
          <p className="text-[12px] font-medium text-[#86868B]">© 2026 Trace Security Research. Built for macOS.</p>
          <div className="flex gap-8 text-[12px] font-medium text-[#86868B]">
            <a href="#" className="hover:text-[#1D1D1F] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#1D1D1F] transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
