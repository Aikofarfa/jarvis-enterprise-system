import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View, type PressableProps } from "react-native";
import type { ReactNode } from "react";

import { useColors } from "@/hooks/use-colors";
import { JarvisText as Text } from "@/components/jarvis-text";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  const colors = useColors("dark");
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-700 bg-slate-950">
        <MaterialIcons name="gps-fixed" size={22} color={colors.foreground} />
      </View>
      <View className="flex-shrink">
        <Text className="font-mono text-[15px] font-semibold tracking-[4px] text-slate-100">JARVIS</Text>
        {!compact ? <Text className="mt-0.5 text-[10px] uppercase tracking-[2px] text-slate-400">Fábrica web</Text> : null}
      </View>
    </View>
  );
}

export function SectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <View className="mb-3 flex-row items-end justify-between gap-3">
      <View className="flex-1 flex-shrink">
        {eyebrow ? <Text className="mb-1 text-[10px] uppercase tracking-[2px] text-slate-400">{eyebrow}</Text> : null}
        <Text className="font-mono text-[17px] font-semibold text-slate-100 flex-wrap">{title}</Text>
      </View>
      {action}
    </View>
  );
}

export function KpiCard({ label, value, hint, tone = "neutral" }: { label: string; value: string; hint: string; tone?: "neutral" | "good" | "warn" }) {
  const toneClass = tone === "good" ? "text-emerald-400" : tone === "warn" ? "text-amber-300" : "text-slate-100";
  return (
    <View className="min-w-0 flex-1 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 min-h-[88px]">
      <Text className="text-[10px] uppercase tracking-[1.5px] text-slate-400">{label}</Text>
      <Text className={`mt-2 font-mono text-[23px] font-semibold ${toneClass}`}>{value}</Text>
      <Text className="mt-1 text-[11px] leading-4 text-slate-400">{hint}</Text>
    </View>
  );
}

export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "good" | "warn" | "danger" }) {
  const colors = {
    neutral: "border-slate-700 bg-slate-900 text-slate-300",
    good: "border-emerald-900 bg-emerald-950/40 text-emerald-300",
    warn: "border-amber-900 bg-amber-950/40 text-amber-200",
    danger: "border-red-900 bg-red-950/40 text-red-300",
  } as const;
  return (
    <View className={`rounded-full border px-3 py-1.5 min-h-[28px] justify-center items-center ${colors[tone]}`}>
      <Text className="text-[10px] font-semibold uppercase tracking-[1px]">{label}</Text>
    </View>
  );
}

export function PrimaryButton({ children, icon, ...props }: PressableProps & { children: ReactNode; icon?: keyof typeof MaterialIcons.glyphMap }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessible={true}
      {...props}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <View className="flex-row items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3.5 min-h-[44px] min-w-[44px]">
        {icon ? <MaterialIcons name={icon} size={18} color="#08090c" /> : null}
        <Text className="font-semibold text-slate-950 text-[14px]">{children}</Text>
      </View>
    </Pressable>
  );
}

export function GhostButton({ children, icon, ...props }: PressableProps & { children: ReactNode; icon?: keyof typeof MaterialIcons.glyphMap }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessible={true}
      {...props}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <View className="flex-row items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 min-h-[44px] min-w-[44px]">
        {icon ? <MaterialIcons name={icon} size={18} color="#94a3b8" /> : null}
        <Text className="font-medium text-slate-200 text-[14px]">{children}</Text>
      </View>
    </Pressable>
  );
}

export function EmptyState({ icon, title, body }: { icon: keyof typeof MaterialIcons.glyphMap; title: string; body: string }) {
  return (
    <View className="items-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 px-6 py-8">
      <View className="mb-3 h-12 w-12 min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl bg-slate-900">
        <MaterialIcons name={icon} size={24} color="#94a3b8" />
      </View>
      <Text className="text-center font-mono text-[15px] font-semibold text-slate-200">{title}</Text>
      <Text className="mt-2 max-w-[290px] text-center text-[12px] leading-5 text-slate-400">{body}</Text>
    </View>
  );
}

export function DataRow({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <View className="flex-row items-center justify-between gap-4 border-b border-slate-800/70 py-3.5 min-h-[44px] last:border-b-0">
      <Text className="text-[12px] text-slate-400">{label}</Text>
      <Text className={`max-w-[60%] text-right text-[12px] ${muted ? "text-slate-400" : "text-slate-200"}`}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: { width: "100%" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
