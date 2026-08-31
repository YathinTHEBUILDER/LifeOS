import React from 'react';
import {
  Flame,
  Sparkles,
  CheckCircle2,
  Heart,
  Zap,
  BookOpen,
  Dumbbell,
  Coffee,
  Smile,
  Target,
  Compass,
  Sun,
  Moon,
  Droplets,
  Brain,
  Timer,
  Activity,
  Apple,
  Bed,
  Music,
  Utensils,
  Footprints,
  Leaf,
  Pencil,
  LucideIcon,
} from 'lucide-react';

export interface HabitIconOption {
  name: string;
  label: string;
  icon: LucideIcon;
}

export const HABIT_ICONS: HabitIconOption[] = [
  { name: 'Flame', label: 'Flame', icon: Flame },
  { name: 'Sparkles', label: 'Sparkles', icon: Sparkles },
  { name: 'CheckCircle', label: 'Checkmark', icon: CheckCircle2 },
  { name: 'Heart', label: 'Heart', icon: Heart },
  { name: 'Zap', label: 'Energy', icon: Zap },
  { name: 'BookOpen', label: 'Reading', icon: BookOpen },
  { name: 'Dumbbell', label: 'Fitness', icon: Dumbbell },
  { name: 'Coffee', label: 'Coffee', icon: Coffee },
  { name: 'Smile', label: 'Mindset', icon: Smile },
  { name: 'Target', label: 'Target', icon: Target },
  { name: 'Compass', label: 'Focus', icon: Compass },
  { name: 'Sun', label: 'Morning', icon: Sun },
  { name: 'Moon', label: 'Night', icon: Moon },
  { name: 'Droplets', label: 'Hydration', icon: Droplets },
  { name: 'Brain', label: 'Brain', icon: Brain },
  { name: 'Timer', label: 'Timer', icon: Timer },
  { name: 'Activity', label: 'Health', icon: Activity },
  { name: 'Apple', label: 'Nutrition', icon: Apple },
  { name: 'Bed', label: 'Sleep', icon: Bed },
  { name: 'Music', label: 'Music', icon: Music },
  { name: 'Utensils', label: 'Meal', icon: Utensils },
  { name: 'Footprints', label: 'Walking', icon: Footprints },
  { name: 'Leaf', label: 'Nature', icon: Leaf },
  { name: 'Pencil', label: 'Journaling', icon: Pencil },
];

export const HABIT_COLORS = [
  { name: 'Emerald', hex: '#34c759', bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400' },
  { name: 'Blue', hex: '#0071e3', bg: 'bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400' },
  { name: 'Indigo', hex: '#5856d6', bg: 'bg-indigo-500/15', text: 'text-indigo-600 dark:text-indigo-400' },
  { name: 'Purple', hex: '#af52de', bg: 'bg-purple-500/15', text: 'text-purple-600 dark:text-purple-400' },
  { name: 'Orange', hex: '#ff9500', bg: 'bg-orange-500/15', text: 'text-orange-600 dark:text-orange-400' },
  { name: 'Rose', hex: '#ff2d55', bg: 'bg-rose-500/15', text: 'text-rose-600 dark:text-rose-400' },
  { name: 'Teal', hex: '#00c7be', bg: 'bg-teal-500/15', text: 'text-teal-600 dark:text-teal-400' },
  { name: 'Slate', hex: '#64748b', bg: 'bg-slate-500/15', text: 'text-slate-600 dark:text-slate-400' },
];

const ICON_MAP: Record<string, LucideIcon> = {
  Flame,
  Sparkles,
  CheckCircle: CheckCircle2,
  CheckCircle2,
  Heart,
  Zap,
  BookOpen,
  Dumbbell,
  Coffee,
  Smile,
  Target,
  Compass,
  Sun,
  Moon,
  Droplets,
  Brain,
  Timer,
  Activity,
  Apple,
  Bed,
  Music,
  Utensils,
  Footprints,
  Leaf,
  Pencil,
};

export function getHabitIconComponent(iconName?: string): LucideIcon {
  if (!iconName) return CheckCircle2;
  return ICON_MAP[iconName] || CheckCircle2;
}

export function HabitIconView({
  iconName,
  className = 'w-4 h-4',
}: {
  iconName?: string;
  className?: string;
}) {
  const Icon = getHabitIconComponent(iconName);
  return React.createElement(Icon, { className });
}
