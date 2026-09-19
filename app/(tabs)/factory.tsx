import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";

import { BrandMark, DataRow, EmptyState, GhostButton, SectionHeading, StatusBadge } from "@/components/jarvis-ui";
import { JarvisText as Text } from "@/components/jarvis-text";
import { ScreenContainer } from "@/components/screen-container";
import { useJarvis } from "@/lib/jarvis-context";

export default function FactoryScreen() {
  const { workspace, removeRun } = useJarvis();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const confirmDelete = (id: string) => {
    Alert.alert("Eliminar corrida", "Se quitará únicamente de este dispositivo.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => removeRun(id) },
    ]);
  };

  return (
    <ScreenContainer containerClassName="bg-slate-950" className="px-5" edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 18, paddingBottom: 34 }}>
        <View className="gap-7">
          <View className="flex-row items-start justify-between">
            <BrandMark compact />
            <View className="items-end">
              <Text className="text-[10px] uppercase tracking-[1.5px] text-slate-600">Módulo</Text>
              <Text className="mt-1 font-mono text-[12px] text-slate-300">01 / 03</Text>
            </View>
          </View>

          <View>
            <Text className="text-[11px] uppercase tracking-[2px] text-slate-500">Producción</Text>
            <Text className="mt-2 font-mono text-[27px] font-semibold text-slate-100">Fábrica web</Text>
            <Text className="mt-2 text-[13px] leading-5 text-slate-500">
              Aquí aparecen los briefs guardados. El análisis de costos, tokens y margen queda pendiente hasta conectar un backend propio.
            </Text>
          </View>

          <View className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <View className="flex-row items-center gap-2">
              <MaterialIcons name="lock-outline" size={17} color="#8f9aa7" />
              <Text className="font-mono text-[13px] font-semibold text-slate-200">Controles de ejecución</Text>
            </View>
            <View className="mt-3">
              <DataRow label="Estado de IA" value="No conectado" muted />
              <DataRow label="Mapas / leads" value="No conectado" muted />
              <DataRow label="Despliegue" value="Requiere aprobación" muted />
              <DataRow label="Persistencia" value="Almacenamiento local" />
            </View>
          </View>

          <View>
            <SectionHeading eyebrow={`${workspace.runs.length} guardadas`} title="Cola de producción" />
            {workspace.runs.length === 0 ? (
              <EmptyState icon="precision-manufacturing" title="La fábrica está vacía" body="Vuelve al Mando y guarda un brief para iniciar una corrida local." />
            ) : (
              <View className="gap-3">
                {workspace.runs.map((run, index) => {
                  const expanded = expandedId === run.id;
                  return (
                    <View key={run.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                      <Pressable onPress={() => setExpandedId(expanded ? null : run.id)} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
                        <View className="flex-row items-start gap-3">
                          <View className="h-8 w-8 items-center justify-center rounded-lg bg-slate-800">
                            <Text className="font-mono text-[12px] text-slate-400">{String(index + 1).padStart(2, "0")}</Text>
                          </View>
                          <View className="flex-1">
                            <View className="flex-row items-start justify-between gap-3">
                              <Text className="flex-1 text-[13px] leading-5 text-slate-200">{run.brief}</Text>
                              <StatusBadge label={run.status} />
                            </View>
                            <Text className="mt-2 text-[11px] leading-4 text-slate-600">{new Date(run.createdAt).toLocaleString()}</Text>
                          </View>
                          <MaterialIcons name={expanded ? "expand-less" : "expand-more"} size={19} color="#65717e" />
                        </View>
                      </Pressable>
                      {expanded ? (
                        <View className="mt-4 border-t border-slate-800 pt-3">
                          <Text className="text-[11px] leading-4 text-slate-500">{run.note}</Text>
                          <View className="mt-3">
                            <GhostButton onPress={() => confirmDelete(run.id)} icon="delete-outline">
                              Eliminar del dispositivo
                            </GhostButton>
                          </View>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
