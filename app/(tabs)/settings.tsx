import { MaterialIcons } from "@expo/vector-icons";
import { Alert, ScrollView, View } from "react-native";

import { BrandMark, DataRow, GhostButton, SectionHeading, StatusBadge } from "@/components/jarvis-ui";
import { JarvisText as Text } from "@/components/jarvis-text";
import { ScreenContainer } from "@/components/screen-container";
import { useJarvis } from "@/lib/jarvis-context";

export default function SettingsScreen() {
  const { workspace, clearLocalData } = useJarvis();

  const clearData = () => {
    Alert.alert("Borrar datos locales", "Se eliminarán las corridas guardadas en este dispositivo. Esta acción no afecta ningún servicio externo.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Borrar", style: "destructive", onPress: clearLocalData },
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
              <Text className="mt-1 font-mono text-[12px] text-slate-300">03 / 03</Text>
            </View>
          </View>

          <View>
            <Text className="text-[11px] uppercase tracking-[2px] text-slate-500">Sistema</Text>
            <Text className="mt-2 font-mono text-[27px] font-semibold text-slate-100">Ajustes</Text>
            <Text className="mt-2 text-[13px] leading-5 text-slate-500">
              Revisa cómo funciona esta versión móvil y administra los datos que se guardan localmente.
            </Text>
          </View>

          <View className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-row items-center gap-2">
                <MaterialIcons name="privacy-tip" size={18} color="#9aa5b1" />
                <Text className="font-mono text-[14px] font-semibold text-slate-200">Privacidad</Text>
              </View>
              <StatusBadge label="PROTEGIDO" tone="good" />
            </View>
            <View className="mt-3">
              <DataRow label="Almacenamiento" value="Solo en este dispositivo" />
              <DataRow label="Analítica" value="No configurada" muted />
              <DataRow label="Claves privadas" value="No incluidas" />
              <DataRow label="Servicios externos" value="Desactivados" />
            </View>
          </View>

          <View>
            <SectionHeading eyebrow="Información" title="Estado del espacio" />
            <View className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <DataRow label="Corridas guardadas" value={String(workspace.runs.length)} />
              <DataRow label="Aprobaciones" value={String(workspace.approvals.length)} />
              <DataRow label="Versión" value="1.0.0 · local" />
            </View>
          </View>

          <View className="gap-3">
            <Text className="text-[11px] uppercase tracking-[1.5px] text-slate-500">Zona de datos</Text>
            <GhostButton onPress={clearData} icon="delete-sweep">
              Borrar datos locales
            </GhostButton>
            <Text className="text-[11px] leading-4 text-slate-600">
              Esto solo elimina las corridas creadas dentro de esta app. No revoca cuentas ni modifica el proyecto original.
            </Text>
          </View>

          <View className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <Text className="font-mono text-[13px] font-semibold text-slate-300">Alcance de esta entrega</Text>
            <Text className="mt-2 text-[12px] leading-5 text-slate-600">
              Se construyó la experiencia móvil sobre Expo, con navegación por módulos, persistencia local y guardrails de aprobación. Google Maps, WhatsApp, Nequi, IA externa y despliegues quedan fuera de ejecución hasta que configures y autorices esas conexiones.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
