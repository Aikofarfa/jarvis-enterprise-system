import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, View } from "react-native";

import { BrandMark, DataRow, EmptyState, GhostButton, SectionHeading, StatusBadge } from "@/components/jarvis-ui";
import { JarvisText as Text } from "@/components/jarvis-text";
import { ScreenContainer } from "@/components/screen-container";
import { useJarvis } from "@/lib/jarvis-context";

export default function ApprovalsScreen() {
  const { workspace } = useJarvis();

  return (
    <ScreenContainer containerClassName="bg-slate-950" className="px-5" edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 18, paddingBottom: 34 }}>
        <View className="gap-7">
          <View className="flex-row items-start justify-between">
            <BrandMark compact />
            <View className="items-end">
              <Text className="text-[10px] uppercase tracking-[1.5px] text-slate-600">Módulo</Text>
              <Text className="mt-1 font-mono text-[12px] text-slate-300">02 / 03</Text>
            </View>
          </View>

          <View>
            <Text className="text-[11px] uppercase tracking-[2px] text-slate-500">Gobernanza</Text>
            <Text className="mt-2 font-mono text-[27px] font-semibold text-slate-100">Revisión humana</Text>
            <Text className="mt-2 text-[13px] leading-5 text-slate-500">
              Ninguna producción debe iniciarse automáticamente. Las aprobaciones reales se habilitan cuando conectes tu backend y confirmes el flujo operativo.
            </Text>
          </View>

          <View className="rounded-2xl border border-amber-900/60 bg-amber-950/20 p-4">
            <View className="flex-row items-start gap-3">
              <MaterialIcons name="shield" size={22} color="#f2c46d" />
              <View className="flex-1">
                <Text className="font-mono text-[14px] font-semibold text-amber-100">Guardrail activo</Text>
                <Text className="mt-2 text-[12px] leading-5 text-amber-200/70">
                  Esta versión no envía pagos, mensajes ni órdenes de despliegue. La decisión final permanece en manos de una persona.
                </Text>
              </View>
            </View>
          </View>

          <View>
            <SectionHeading eyebrow={`${workspace.approvals.length} pendientes`} title="Bandeja de aprobación" />
            {workspace.approvals.length === 0 ? (
              <EmptyState icon="verified-user" title="No hay aprobaciones" body="Cuando exista un análisis real y un costo validado, aparecerá aquí para revisión manual." />
            ) : (
              <View className="gap-3">
                {workspace.approvals.map((approval) => (
                  <View key={approval.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <View className="flex-row items-start justify-between gap-3">
                      <Text className="flex-1 font-mono text-[14px] font-semibold text-slate-200">{approval.title}</Text>
                      <StatusBadge label="PENDIENTE" tone="warn" />
                    </View>
                    <Text className="mt-3 text-[12px] leading-5 text-slate-500">{approval.reason}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <View className="flex-row items-center gap-2">
              <MaterialIcons name="rule" size={18} color="#9aa5b1" />
              <Text className="font-mono text-[13px] font-semibold text-slate-200">Condiciones antes de producir</Text>
            </View>
            <View className="mt-3">
              <DataRow label="Costo de infraestructura" value="Pendiente" muted />
              <DataRow label="Costo de tokens" value="Pendiente" muted />
              <DataRow label="Margen mínimo" value="No calculado" muted />
              <DataRow label="Confirmación humana" value="Obligatoria" />
            </View>
          </View>

          <GhostButton onPress={() => router.push("/(tabs)/factory")} icon="arrow-back">
            Volver a la fábrica
          </GhostButton>

          <View className="rounded-xl bg-slate-950 p-4">
            <Text className="text-[11px] leading-4 text-slate-600">
              Nota: no se incluyó el número de Nequi ni se activó ninguna integración de pagos en esta versión local.
            </Text>
            <View className="mt-2">
              <Text className="text-[11px] leading-4 text-slate-600">La configuración de servicios externos queda documentada, no ejecutada.</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
