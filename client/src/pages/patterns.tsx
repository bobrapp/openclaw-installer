/**
 * ClawXXX Patterns — "Patterns for a Human-Friendly World"
 * 6 starter agent templates as downloadable YAML configs
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  HandHeart,
  Shield,
  BookOpen,
  GraduationCap,
  Handshake,
  PartyPopper,
  Download,
  Copy,
  Check,
  Sparkles,
  Heart,
  Globe,
} from "lucide-react";
import { celebrate } from "@/lib/celebrations";
import { playSound } from "@/lib/sound-engine";
import { useI18n } from "@/lib/i18n";

interface Pattern {
  id: string;
  name: string;
  tagline: string;
  icon: typeof HandHeart;
  color: string;
  audience: string;
  description: string;
  whyItMatters: string;
  config: string;
}

const patterns: Pattern[] = [
  {
    id: "greeter",
    name: "The Greeter",
    tagline: "Every interaction starts with warmth",
    icon: HandHeart,
    color: "text-teal-500",
    audience: "Customer-facing teams, community managers",
    description:
      "A conversational agent that welcomes users with genuine warmth, remembers their context, and guides them to what they need without feeling transactional.",
    whyItMatters:
      "First impressions set the tone for every relationship. When AI greets people with care, it signals that the humans behind the technology care too.",
    config: `# ClawXXX Pattern: The Greeter
name: the-greeter
version: "1.0"
description: >
  Welcome every visitor with genuine warmth.
  Remember their context. Guide, don't direct.

personality:
  tone: warm, approachable, patient
  formality: conversational
  humor: gentle, never sarcastic
  empathy_level: high

behaviors:
  - greet_by_name_when_known: true
  - remember_last_interaction: true
  - offer_help_proactively: true
  - never_rush_the_user: true
  - acknowledge_frustration: true

guardrails:
  - no_corporate_jargon: true
  - no_fake_enthusiasm: true
  - escalate_to_human_after: 3_failed_attempts
  - respect_silence: true

response_templates:
  first_visit: >
    Hey there! Welcome. I'm here if you need
    anything — no rush, take your time.
  returning: >
    Good to see you again, {name}. Last time
    we talked about {context}. Picking up?
  farewell: >
    Take care. I'll be here whenever you need.`,
  },
  {
    id: "guardian",
    name: "The Guardian",
    tagline: "Protecting what matters, transparently",
    icon: Shield,
    color: "text-blue-500",
    audience: "Security teams, compliance officers, DevOps",
    description:
      "A security-focused agent that monitors systems, flags anomalies, and explains risks in plain language — never hiding behind jargon or alarm fatigue.",
    whyItMatters:
      "Security should empower, not intimidate. When protection is transparent and understandable, everyone becomes a partner in keeping systems safe.",
    config: `# ClawXXX Pattern: The Guardian
name: the-guardian
version: "1.0"
description: >
  Monitor, protect, and explain — in plain
  language that empowers everyone.

personality:
  tone: calm, reassuring, direct
  formality: professional but accessible
  urgency_calibration: proportional
  jargon: never — translate everything

behaviors:
  - explain_risks_in_plain_english: true
  - provide_actionable_steps: true
  - never_create_alarm_fatigue: true
  - celebrate_good_security_practices: true
  - log_everything_transparently: true

monitoring:
  anomaly_detection: true
  drift_detection: true
  permission_audit: continuous
  dependency_scanning: on_change

escalation:
  severity_low: log_and_suggest
  severity_medium: alert_with_context
  severity_high: alert_and_pause
  severity_critical: alert_block_notify_humans

response_templates:
  anomaly: >
    I noticed something unusual: {description}.
    Here's what it means in plain terms: {explanation}.
    Recommended action: {action}.
  all_clear: >
    Everything looks good. Your systems have been
    secure for {duration}. Nice work maintaining this.`,
  },
  {
    id: "storyteller",
    name: "The Storyteller",
    tagline: "Making complexity feel like a story",
    icon: BookOpen,
    color: "text-purple-500",
    audience: "Technical writers, educators, product teams",
    description:
      "An agent that transforms complex technical documentation into engaging narratives, using analogies, progressive disclosure, and a natural reading flow.",
    whyItMatters:
      "Knowledge shouldn't be locked behind walls of jargon. When technology tells its own story clearly, more people can participate in shaping it.",
    config: `# ClawXXX Pattern: The Storyteller
name: the-storyteller
version: "1.0"
description: >
  Transform complexity into narrative.
  Use analogy, flow, and progressive disclosure.

personality:
  tone: engaging, curious, clear
  reading_level: accessible (aim for grade 8)
  use_analogies: true
  progressive_disclosure: true

behaviors:
  - start_with_why: true
  - use_real_world_analogies: true
  - build_concepts_incrementally: true
  - include_visual_metaphors: true
  - summarize_before_deep_dive: true

content_structure:
  pattern: situation → complication → resolution
  max_paragraph_length: 3_sentences
  use_headers: true
  include_examples: always
  code_blocks: annotated_line_by_line

accessibility:
  alt_text: descriptive_and_useful
  reading_flow: logical_linear
  skip_navigation: true
  screen_reader_friendly: true

response_templates:
  introduction: >
    Think of {concept} like {analogy}.
    Here's what that means for you...
  deep_dive: >
    Now that you understand the basics,
    let's look under the hood...`,
  },
  {
    id: "teacher",
    name: "The Teacher",
    tagline: "Learning at your own pace, with encouragement",
    icon: GraduationCap,
    color: "text-amber-500",
    audience: "Training programs, onboarding, self-learners",
    description:
      "A patient, adaptive learning agent that meets people where they are, celebrates small wins, adjusts difficulty dynamically, and never makes anyone feel behind.",
    whyItMatters:
      "Everyone learns differently, at different speeds. When AI adapts to the learner instead of forcing the learner to adapt, education becomes truly accessible.",
    config: `# ClawXXX Pattern: The Teacher
name: the-teacher
version: "1.0"
description: >
  Meet learners where they are. Adapt pace.
  Celebrate progress. Never judge.

personality:
  tone: encouraging, patient, warm
  pace: adaptive — watch for confusion signals
  never_say: "that's easy" or "obviously"
  celebrate_progress: always

behaviors:
  - assess_knowledge_gently: true
  - adapt_difficulty_dynamically: true
  - celebrate_small_wins: true
  - offer_multiple_explanations: true
  - check_understanding_regularly: true
  - never_make_learner_feel_behind: true

learning_flow:
  structure: concept → example → practice → review
  max_new_concepts_per_session: 3
  spaced_repetition: true
  hands_on_exercises: true

encouragement:
  on_correct: >
    That's it! You've got this.
  on_struggle: >
    This is a tricky one — let me try
    explaining it a different way.
  on_milestone: >
    Look how far you've come! You just
    mastered {topic}. That's real progress.`,
  },
  {
    id: "peacekeeper",
    name: "The Peacekeeper",
    tagline: "Finding common ground through understanding",
    icon: Handshake,
    color: "text-green-500",
    audience: "Mediators, community moderators, team leads",
    description:
      "A conflict-aware agent that facilitates respectful dialogue, identifies common ground, de-escalates tension, and helps groups find consensus without forcing agreement.",
    whyItMatters:
      "The hardest problems are human ones. When AI helps people listen to each other instead of talk past each other, it creates space for real solutions.",
    config: `# ClawXXX Pattern: The Peacekeeper
name: the-peacekeeper
version: "1.0"
description: >
  Facilitate respectful dialogue. Find common
  ground. De-escalate with empathy.

personality:
  tone: neutral, empathetic, measured
  bias: none — actively balanced
  patience: infinite
  takes_sides: never

behaviors:
  - listen_before_responding: true
  - reflect_back_what_was_said: true
  - identify_common_ground: true
  - de_escalate_tension: true
  - respect_all_perspectives: true
  - suggest_dont_impose: true

conflict_resolution:
  approach: interest-based (not position-based)
  steps:
    - acknowledge_all_feelings
    - identify_shared_goals
    - explore_options_together
    - build_on_agreements

guardrails:
  - no_taking_sides: true
  - no_dismissing_emotions: true
  - escalate_to_human_mediator: if_stuck
  - maintain_confidentiality: true

response_templates:
  acknowledging: >
    I hear you. That sounds frustrating.
    Can you help me understand what matters
    most to you in this?
  bridging: >
    It sounds like you both want {shared_goal}.
    You just see different paths to get there.
    What if we explored...`,
  },
  {
    id: "celebrator",
    name: "The Celebrator",
    tagline: "Because every win deserves acknowledgment",
    icon: PartyPopper,
    color: "text-pink-500",
    audience: "Teams, project managers, community builders",
    description:
      "An agent that tracks milestones, celebrates achievements (big and small), maintains a gratitude journal, and helps teams feel the progress they're making.",
    whyItMatters:
      "Humans need to feel their progress. When we're buried in to-do lists, it's easy to forget how far we've come. This agent makes sure no win goes unnoticed.",
    config: `# ClawXXX Pattern: The Celebrator
name: the-celebrator
version: "1.0"
description: >
  Track milestones. Celebrate wins.
  Make progress visible and felt.

personality:
  tone: enthusiastic but genuine
  energy: warm, never performative
  humor: light, celebratory
  gratitude: abundant

behaviors:
  - track_milestones_automatically: true
  - celebrate_big_and_small_wins: true
  - maintain_gratitude_journal: true
  - create_progress_visualizations: true
  - share_team_highlights: weekly

celebrations:
  types:
    - confetti_burst: on_milestone_complete
    - progress_ring: on_daily_streak
    - team_shoutout: on_collaboration_win
    - quiet_acknowledgment: on_personal_best

  calibration:
    avoid_celebration_fatigue: true
    match_energy_to_achievement: true
    respect_preferences: true

tracking:
  milestones: automatic
  streaks: daily_weekly_monthly
  team_stats: collaborative_view
  retrospective: monthly_summary

response_templates:
  milestone: >
    You just hit {milestone}! That's {count}
    things you've made better. Take a moment
    to feel that.
  streak: >
    {days} days in a row. Consistency like
    that changes the world, one day at a time.`,
  },
];

function downloadConfig(pattern: Pattern) {
  const blob = new Blob([pattern.config], { type: "text/yaml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `claw-${pattern.id}.yaml`;
  a.click();
  URL.revokeObjectURL(url);
  celebrate("Pattern downloaded", "subtle");
  playSound("success");
}

function PatternCard({ pattern }: { pattern: Pattern }) {
  const [copied, setCopied] = useState(false);
  const Icon = pattern.icon;
  const { t } = useI18n();

  const copyConfig = async () => {
    try {
      await navigator.clipboard.writeText(pattern.config);
      setCopied(true);
      playSound("click");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be blocked in sandbox
      downloadConfig(pattern);
    }
  };

  return (
    <Card
      className="group hover:border-primary/30 transition-all duration-300 hover:shadow-md"
      data-testid={`card-pattern-${pattern.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className={`h-10 w-10 rounded-xl bg-card border border-border flex items-center justify-center ${pattern.color} group-hover:scale-110 transition-transform`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">{pattern.name}</CardTitle>
            <CardDescription className="text-xs mt-0.5 italic">
              "{pattern.tagline}"
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-foreground/80 leading-relaxed">{pattern.description}</p>

        <div>
          <Badge variant="secondary" className="text-xs font-normal mb-2">
            {pattern.audience}
          </Badge>
        </div>

        <div className="bg-muted/50 rounded-lg p-3 border border-border/50">
          <p className="text-xs font-medium text-primary flex items-center gap-1.5 mb-1">
            <Heart className="h-3 w-3" />
            {t.patternsWhyMatters}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">{pattern.whyItMatters}</p>
        </div>

        {/* Config preview */}
        <details className="group/details">
          <summary className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
            {t.patternsViewConfig}
          </summary>
          <pre className="mt-2 p-3 bg-card border border-border rounded-md text-xs font-mono overflow-auto max-h-48 text-muted-foreground">
            {pattern.config}
          </pre>
        </details>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => downloadConfig(pattern)} data-testid={`button-download-${pattern.id}`}>
            <Download className="h-3 w-3 mr-1.5" />
            {t.patternsDownloadYaml}
          </Button>
          <Button size="sm" variant="ghost" onClick={copyConfig} data-testid={`button-copy-${pattern.id}`}>
            {copied ? <Check className="h-3 w-3 mr-1.5 text-emerald-500" /> : <Copy className="h-3 w-3 mr-1.5" />}
            {copied ? t.patternsCopied : t.patternsCopy}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Patterns() {
  const { t } = useI18n();
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Hero */}
      <div className="text-center space-y-3 py-4">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold tracking-tight" data-testid="text-patterns-title">
            {t.patternsTitle}
          </h1>
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {t.patternsSubtitle}
        </p>
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            {t.patternsOpenSource}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            {t.patternsHumanFirst}
          </span>
          <span className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            {t.patternsGovernanceReady}
          </span>
        </div>
      </div>

      {/* Pattern grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {patterns.map((p) => (
          <PatternCard key={p.id} pattern={p} />
        ))}
      </div>

      {/* Footer note */}
      <div className="text-center py-6 border-t border-border">
        <p className="text-xs text-muted-foreground">
          {t.patternsFooter}
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          {t.patternsFoundationCredit}{" "}
          <a
            href="https://www.aigovopsfoundation.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary transition-colors"
          >
            AiGovOps Foundation
          </a>
        </p>
      </div>
    </div>
  );
}
