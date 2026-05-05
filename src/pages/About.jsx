import { Activity, AlertTriangle, Brain, Globe, Radar, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';

const capabilities = [
  {
    title: 'Math-first signals',
    body: 'Our math layer converts price action, momentum, volatility, trend quality, and risk into structured scores that are easier to compare across tickers.',
    icon: Activity,
    accent: 'emerald',
  },
  {
    title: 'AI research agents',
    body: 'Our AI agents summarize catalysts, market context, linked opportunities, and pre-market movement so you can spend less time gathering information.',
    icon: Brain,
    accent: 'purple',
  },
  {
    title: 'Discovery engine',
    body: 'EquiQuant looks beyond a single ticker and surfaces related shares, second-order beneficiaries, and fresh opportunities that may otherwise be missed.',
    icon: Radar,
    accent: 'cyan',
  },
  {
    title: 'Risk-aware decisions',
    body: 'Every output is designed to help you understand both the opportunity and the downside before you decide what to do next.',
    icon: ShieldCheck,
    accent: 'amber',
  },
];

const principles = [
  'Quant strategies should not be locked behind institutional walls.',
  'Good trading research should be understandable, repeatable, and fast.',
  'AI should organize evidence, not replace personal responsibility.',
  'Retail traders deserve tools that explain the signal and the risk together.',
];

const accentClasses = {
  emerald: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
  purple: 'border-purple-500/20 bg-purple-500/10 text-purple-300',
  cyan: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300',
  amber: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
};

export default function About() {
  return (
    <div className="min-h-full overflow-hidden bg-slate-950">
      <section className="relative px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-14">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute top-64 -left-20 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto flex max-w-6xl flex-col gap-8">
          <div className="overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 p-5 shadow-2xl shadow-emerald-950/20 sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
                  <Sparkles size={13} />
                  About EquiQuant
                </div>
                <h1 className="max-w-4xl text-3xl font-black tracking-tight text-slate-50 sm:text-5xl lg:text-6xl">
                  Quant-grade trading insights for everyday investors.
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
                  For years, banks and financial institutions kept quantitative research behind expensive desks, private teams, and complex tooling. The word quant can sound intimidating, but many quant strategies start with disciplined mathematical calculations that anyone can understand when the workflow is automated well.
                </p>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">
                  EquiQuant exists to bring that level of structured market research to you. We combine math agents, AI research agents, market data, and risk checks so you can move from raw information to clearer trading insight faster.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <Globe className="mb-4 text-emerald-300" size={28} />
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Our purpose</p>
                  <p className="mt-3 text-2xl font-bold leading-tight text-slate-50">
                    Make institutional-style research accessible, readable, and actionable.
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <p className="text-2xl font-black text-emerald-300">Math</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">Signals built from repeatable calculations.</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <p className="text-2xl font-black text-purple-300">AI</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">Agents that organize evidence and context.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                <TrendingUp size={22} />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">Mission</p>
              <h2 className="mt-3 text-2xl font-bold text-slate-50">Democratize quant research.</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400 sm:text-base">
                Our mission is to build quant-firm-level trading insights for individual traders and investors. We automate the learning-heavy parts of market math, scoring, research collection, and signal comparison so more people can use disciplined, data-backed thinking in their own workflow.
              </p>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-300">
                <Globe size={22} />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-purple-300">Vision</p>
              <h2 className="mt-3 text-2xl font-bold text-slate-50">Better decisions, broader financial independence.</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400 sm:text-base">
                Our vision is to help people become more financially independent by giving them clearer trading insights, stronger risk awareness, and better tools for making informed decisions in fast-moving markets.
              </p>
            </section>
          </div>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 lg:p-8">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">What we do</p>
              <h2 className="mt-3 text-2xl font-bold text-slate-50 sm:text-3xl">A research desk made of math agents and AI agents.</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400 sm:text-base">
                EquiQuant turns fragmented market information into structured outputs: quantitative scores, catalyst summaries, discovery ideas, intraday context, and risk notes. The goal is not to make markets look simple. The goal is to make the research process clearer.
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {capabilities.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                    <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl border ${accentClasses[item.accent]}`}>
                      <Icon size={21} />
                    </div>
                    <h3 className="text-base font-bold text-slate-100">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{item.body}</p>
                  </article>
                );
              })}
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Our beliefs</p>
              <div className="mt-5 flex flex-col gap-3">
                {principles.map((principle) => (
                  <div key={principle} className="flex gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-300" />
                    <p className="text-sm leading-6 text-slate-300">{principle}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-400/10 text-amber-300">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300">Important note</p>
                  <h2 className="mt-3 text-2xl font-bold text-slate-50">Signals are not financial advice.</h2>
                  <p className="mt-3 text-sm leading-7 text-amber-100/80 sm:text-base">
                    Buy, hold, and sell outputs derived by our agents are mathematical calculations and research summaries. They are not personalized financial advice, investment advice, or a guarantee of returns. Markets are risky, losses are possible, and you should trade according to your own judgement, risk tolerance, and independent research.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
