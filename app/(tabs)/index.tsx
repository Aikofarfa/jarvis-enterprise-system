import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";

import { EmptyState, GhostButton, KpiCard, PrimaryButton, SectionHeading, StatusBadge, BrandMark } from "@/components/jarvis-ui";
import { JarvisText as Text } from "@/components/jarvis-text";
import { ScreenContainer } from "@/components/screen-container";
import { useJarvis } from "@/lib/jarvis-context";

export default function HomeScreen() {
  const { workspace, isHydrated, addBrief } = useJarvis();
  const [brief, setBrief] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const metrics = useMemo(
    () => ({
      queued: workspace.runs.length,
      approvals: workspace.approvals.length,
      live: 0,
      margin: "—",
    }),
    [workspace],
  );

  const submitBrief = () => {
    if (brief.trim().length < 8) {
      Alert.alert("Brief incompleto", "Escribe al menos 8 caracteres para guardar una corrida.");
      return;
    }

    setIsSubmitting(true);
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addBrief(brief);
    setBrief("");
    setIsSubmitting(false);
    Alert.alert("Brief guardado", "La corrida quedó en espera. Conecta un backend para analizar costos y margen.");
  };

  return (
    <ScreenContainer containerClassName="bg-slate-950" className="px-5" edges={["top", "left", "right"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 18, paddingBottom: 34 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-7">
          <View className="flex-row items-start justify-between gap-4">
            <BrandMark />
            <View className="items-end">
              <StatusBadge label={isHydrated ? "LOCAL" : "CARGANDO"} tone={isHydrated ? "good" : "neutral"} />
              <Text className="mt-2 text-[10px] uppercase tracking-[1.5px] text-slate-400">MODO SEGURO</Text>
            </View>
          </View>

          <View>
            <Text className="text-[11px] uppercase tracking-[2px] text-slate-400">Centro de mando</Text>
            <Text className="mt-2 font-mono text-[27px] font-semibold leading-9 text-slate-100 flex-wrap">
              Qué está pasando ahora
            </Text>
            <Text className="mt-2 text-[13px] leading-5 text-slate-400">
              Crea una corrida local y deja lista la información para el análisis de costos y margen.
            </Text>
          </View>

          <View className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <View className="mb-3 flex-row items-center gap-2">
              <MaterialIcons name="bolt" size={18} color="#cbd5e1" />
              <Text className="font-mono text-[14px] font-semibold text-slate-200">Nueva corrida</Text>
            </View>
            <TextInput
              value={brief}
              onChangeText={setBrief}
              placeholder="Landing para una clínica dental en Bogotá…"
              placeholderTextColor="#94a3b8"
              multiline
              textAlignVertical="top"
              returnKeyType="done"
              onSubmitEditing={submitBrief}
              className="min-h-[106px] rounded-xl border border-slate-800 px-3 py-3 text-[14px] leading-5"
              style={styles.input}
            />
            <View className="mt-3">
              <PrimaryButton onPress={submitBrief} disabled={isSubmitting} icon="arrow-forward">
                {isSubmitting ? "Guardando…" : "Guardar brief"}
              </PrimaryButton>
            </View>
            <Text className="mt-3 text-[11px] leading-4 text-slate-400">
              Sin claves ni servicios externos. Los datos se guardan solo en este dispositivo.
            </Text>
          </View>

          <View className="flex-row gap-2">
            <KpiCard label="En espera" value={String(metrics.queued)} hint="Corridas locales" />
            <KpiCard label="Margen" value={metrics.margin} hint="Sin análisis conectado" />
          </View>
          <View className="flex-row gap-2">
            <KpiCard label="Aprobaciones" value={String(metrics.approvals)} hint="Revisión humana" tone={metrics.approvals ? "warn" : "neutral"} />
            <KpiCard label="En producción" value={String(metrics.live)} hint="Sin sitios conectados" tone="good" />
          </View>

          <View>
            <SectionHeading
              eyebrow="Operación"
              title="Accesos rápidos"
              action={<Text className="text-[10px] uppercase tracking-[1px] text-slate-400">3 módulos</Text>}
            />
            <View className="gap-2">
              <QuickAction icon="precision-manufacturing" title="Fábrica web" body="Revisa briefs guardados, realiza pruebas Playwright QA y despliega." onPress={() => router.push("/(tabs)/factory")} />
              <QuickAction icon="verified-user" title="Aprobaciones" body="Deja separada la revisión manual antes de producir." onPress={() => router.push("/(tabs)/approvals")} />
              <QuickAction icon="tune" title="Configuración" body="Controla la privacidad y borra el espacio local." onPress={() => router.push("/(tabs)/settings")} />
            </View>
          </View>

          <View>
            <SectionHeading eyebrow="Actividad" title="Últimas corridas" />
            {workspace.runs.length === 0 ? (
              <EmptyState icon="inbox" title="Todavía no hay corridas" body="Escribe un brief arriba para crear la primera entrada de trabajo en este dispositivo." />
            ) : (
              <View className="gap-2">
                {workspace.runs.slice(0, 3).map((run) => (
                  <View key={run.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <View className="flex-row items-start justify-between gap-3">
                      <Text className="flex-1 text-[13px] leading-5 text-slate-200 flex-wrap">{run.brief}</Text>
                      <StatusBadge label={run.status} />
                    </View>
                    <Text className="mt-3 text-[11px] leading-4 text-slate-400">{run.note}</Text>
                  </View>
                ))}
                <GhostButton onPress={() => router.push("/(tabs)/factory")} icon="open-in-new">
                  Ver toda la fábrica
                </GhostButton>
              </View>
            )}
          </View>

          <View className="border-t border-slate-900 pt-4">
            <Text className="text-center text-[11px] leading-4 text-slate-400">
              JARVIS · Fábrica web · Los pagos, WhatsApp y Nequi no están activados por falta de número empresarial.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function QuickAction({ icon, title, body, onPress }: { icon: keyof typeof MaterialIcons.glyphMap; title: string; body: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] })}
    >
      <View className="flex-row items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 min-h-[44px]">
        <View className="h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-slate-800">
          <MaterialIcons name={icon} size={20} color="#cbd5e1" />
        </View>
        <View className="flex-1">
          <Text className="font-mono text-[13px] font-semibold text-slate-200">{title}</Text>
          <Text className="mt-1 text-[11px] leading-4 text-slate-400">{body}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color="#94a3b8" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: "#08090c",
    borderColor: "#222b35",
    color: "#edf2f7",
  },
});
