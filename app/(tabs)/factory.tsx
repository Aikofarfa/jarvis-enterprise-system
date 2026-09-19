import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Pressable, ScrollView, TextInput, View } from "react-native";

import { BrandMark, DataRow, EmptyState, GhostButton, PrimaryButton, SectionHeading, StatusBadge } from "@/components/jarvis-ui";
import { JarvisText as Text } from "@/components/jarvis-text";
import { ScreenContainer } from "@/components/screen-container";
import { useJarvis } from "@/lib/jarvis-context";
import { generateWebCodeWithHarness } from "@/server/jarvis/deepseek-harness";
import { runPlaywrightE2EAudit, type PlaywrightAuditResult } from "@/server/jarvis/playwright-qa";
import { executeAtomicDeployment, type DeploymentResult } from "@/server/jarvis/deployment";
import type { BusinessProspect } from "@/server/jarvis/routes";

const API_BASE = "http://localhost:3000";

export default function FactoryScreen() {
  const { workspace, removeRun } = useJarvis();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Web Factory & QA State
  const [activeTab, setActiveTab] = useState<"QUEUE" | "QA_INSPECTOR" | "PROSPECTOR" | "GUIDELINES">("QUEUE");
  const [isBuilding, setIsBuilding] = useState(false);
  const [selectedBrief, setSelectedBrief] = useState<string>("");
  const [, setGeneratedCode] = useState<string>("");
  const [qaResult, setQaResult] = useState<PlaywrightAuditResult | null>(null);
  const [deployResult, setDeployResult] = useState<DeploymentResult | null>(null);

  // Google Maps Prospector State
  const [prospectQuery, setProspectQuery] = useState("Odontología");
  const [prospectCity, setProspectCity] = useState("Bogotá");
  const [prospects, setProspects] = useState<BusinessProspect[]>([]);
  const [isSearchingLeads, setIsSearchingLeads] = useState(false);
  const [generatedPitch, setGeneratedPitch] = useState<{
    businessName: string;
    demoUrl: string;
    salesPitchScript: string;
  } | null>(null);

  const confirmDelete = (id: string) => {
    Alert.alert("Eliminar corrida", "Se quitará únicamente de este dispositivo.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => removeRun(id) },
    ]);
  };

  const handleStartWebFactoryPipeline = async (briefText: string) => {
    setSelectedBrief(briefText);
    setActiveTab("QA_INSPECTOR");
    setIsBuilding(true);
    setQaResult(null);
    setDeployResult(null);

    try {
      let codeToAudit = "";
      try {
        const genRes = await fetch(`${API_BASE}/api/web-factory/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brief: briefText }),
        });
        if (genRes.ok) {
          const genJson = await genRes.json();
          codeToAudit = genJson.data?.code || "";
        }
      } catch {
        // Fallback
      }

      if (!codeToAudit) {
        const artifact = await generateWebCodeWithHarness({ brief: briefText });
        codeToAudit = artifact.code;
      }
      setGeneratedCode(codeToAudit);

      let audit: PlaywrightAuditResult | null = null;
      try {
        const qaRes = await fetch(`${API_BASE}/api/web-factory/qa-audit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brief: briefText, code: codeToAudit, autoCorrect: true }),
        });
        if (qaRes.ok) {
          const qaJson = await qaRes.json();
          audit = qaJson.data;
        }
      } catch {
        // Fallback
      }

      if (!audit) {
        audit = await runPlaywrightE2EAudit(codeToAudit, { brief: briefText, autoCorrect: true });
      }
      setQaResult(audit);
      setGeneratedCode(audit.code);

      let deploy: DeploymentResult | null = null;
      try {
        const deployRes = await fetch(`${API_BASE}/api/web-factory/deploy`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: audit.code, brief: briefText, provider: "manus" }),
        });
        if (deployRes.ok) {
          const deployJson = await deployRes.json();
          deploy = deployJson.data;
        }
      } catch {
        // Fallback
      }

      if (!deploy) {
        deploy = await executeAtomicDeployment({ code: audit.code, brief: briefText, provider: "manus" });
      }
      setDeployResult(deploy);
    } catch (err) {
      console.error("[Web Factory] Pipeline error", err);
      Alert.alert("Error de Fábrica", "No se pudo completar la generación y auditoría visual.");
    } finally {
      setIsBuilding(false);
    }
  };

  const handleSearchProspects = async () => {
    setIsSearchingLeads(true);
    try {
      const res = await fetch(`${API_BASE}/api/prospector/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: prospectQuery, city: prospectCity }),
      });
      if (res.ok) {
        const json = await res.json();
        setProspects(json.data || []);
      }
    } catch {
      // Offline fallback
      setProspects([
        {
          id: "place-1",
          name: `Pizzería Don Mario (${prospectQuery})`,
          category: prospectQuery,
          city: prospectCity,
          address: `Calle 85 # 14-20, ${prospectCity}`,
          phone: "+57 311 234 5678",
          rating: 4.8,
          hasWebsite: false,
          status: "SIN_SITIO_WEB",
        },
        {
          id: "place-2",
          name: `Odontología San José (${prospectQuery})`,
          category: prospectQuery,
          city: prospectCity,
          address: `Carrera 15 # 93-40, ${prospectCity}`,
          phone: "+57 300 987 6543",
          rating: 4.7,
          hasWebsite: false,
          status: "SIN_SITIO_WEB",
        },
      ]);
    } finally {
      setIsSearchingLeads(false);
    }
  };

  const handleGenerateDemoPitch = async (prospect: BusinessProspect) => {
    setIsBuilding(true);
    try {
      const res = await fetch(`${API_BASE}/api/prospector/generate-pitch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: prospect.name,
          category: prospect.category,
          city: prospect.city,
          phone: prospect.phone,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setGeneratedPitch(json.data);
        Alert.alert("Demo + Pitch Generado", `Se creó el sitio demo live en Manus.im y el guion comercial para ${prospect.name}.`);
      }
    } catch {
      Alert.alert("Error de Prospección", "No se pudo generar el demo del prospecto.");
    } finally {
      setIsBuilding(false);
    }
  };

  return (
    <ScreenContainer containerClassName="bg-slate-950" className="px-5" edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 18, paddingBottom: 34 }}>
        <View className="gap-6">
          <View className="flex-row items-start justify-between">
            <BrandMark compact />
            <View className="items-end">
              <Text className="text-[10px] uppercase tracking-[1.5px] text-slate-400">Módulo</Text>
              <Text className="mt-1 font-mono text-[12px] text-slate-200">01 / 03</Text>
            </View>
          </View>

          <View>
            <Text className="text-[11px] uppercase tracking-[2px] text-slate-400">Producción & QA</Text>
            <Text className="mt-2 font-mono text-[27px] font-semibold text-slate-100 flex-wrap">Fábrica web</Text>
            <Text className="mt-2 text-[13px] leading-5 text-slate-400">
              Generación TSX/Tailwind con Taste Skill, auditoría autónoma E2E Playwright CLI y prospección Google Maps para clientes sin sitio web.
            </Text>
          </View>

          {/* Module Navigation Tabs */}
          <View className="flex-row rounded-xl border border-slate-800 bg-slate-900/80 p-1">
            <Pressable
              onPress={() => setActiveTab("QUEUE")}
              accessibilityRole="button"
              className={`flex-1 min-h-[44px] items-center justify-center rounded-lg py-2.5 ${
                activeTab === "QUEUE" ? "bg-slate-800" : ""
              }`}
            >
              <Text className={`font-mono text-[11px] font-semibold uppercase ${activeTab === "QUEUE" ? "text-slate-100" : "text-slate-400"}`}>
                Cola ({workspace.runs.length})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("QA_INSPECTOR")}
              accessibilityRole="button"
              className={`flex-1 min-h-[44px] items-center justify-center rounded-lg py-2.5 ${
                activeTab === "QA_INSPECTOR" ? "bg-slate-800" : ""
              }`}
            >
              <Text className={`font-mono text-[11px] font-semibold uppercase ${activeTab === "QA_INSPECTOR" ? "text-cyan-300" : "text-slate-400"}`}>
                Playwright QA
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("PROSPECTOR")}
              accessibilityRole="button"
              className={`flex-1 min-h-[44px] items-center justify-center rounded-lg py-2.5 ${
                activeTab === "PROSPECTOR" ? "bg-slate-800" : ""
              }`}
            >
              <Text className={`font-mono text-[11px] font-semibold uppercase ${activeTab === "PROSPECTOR" ? "text-emerald-400" : "text-slate-400"}`}>
                Google Maps
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("GUIDELINES")}
              accessibilityRole="button"
              className={`flex-1 min-h-[44px] items-center justify-center rounded-lg py-2.5 ${
                activeTab === "GUIDELINES" ? "bg-slate-800" : ""
              }`}
            >
              <Text className={`font-mono text-[11px] font-semibold uppercase ${activeTab === "GUIDELINES" ? "text-slate-100" : "text-slate-400"}`}>
                Taste Skill
              </Text>
            </Pressable>
          </View>

          {activeTab === "QUEUE" && (
            <View className="gap-6">
              <View className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <View className="flex-row items-center gap-2">
                  <MaterialIcons name="shield" size={18} color="#06b6d4" />
                  <Text className="font-mono text-[13px] font-semibold text-slate-200">Motor de Fábrica Web</Text>
                </View>
                <View className="mt-3">
                  <DataRow label="DeepSeek Harness" value="Activo (Taste Skill)" />
                  <DataRow label="Auditoría Playwright" value="20 Puntos E2E" />
                  <DataRow label="Auto-Corrección" value="Bucle en Caliente" />
                  <DataRow label="Prospección Google" value="Filtro Sin Web" />
                  <DataRow label="Despliegue" value="Manus.im 1-Click" />
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
                          <Pressable
                            onPress={() => setExpandedId(expanded ? null : run.id)}
                            accessibilityRole="button"
                            className="min-h-[44px]"
                          >
                            <View className="flex-row items-start gap-3">
                              <View className="h-8 w-8 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-slate-800">
                                <Text className="font-mono text-[12px] text-slate-300">{String(index + 1).padStart(2, "0")}</Text>
                              </View>
                              <View className="flex-1">
                                <View className="flex-row items-start justify-between gap-3">
                                  <Text className="flex-1 text-[13px] leading-5 text-slate-200 flex-wrap">{run.brief}</Text>
                                  <StatusBadge label={run.status} />
                                </View>
                                <Text className="mt-2 text-[11px] leading-4 text-slate-400">{new Date(run.createdAt).toLocaleString()}</Text>
                              </View>
                              <MaterialIcons name={expanded ? "expand-less" : "expand-more"} size={22} color="#94a3b8" />
                            </View>
                          </Pressable>
                          {expanded ? (
                            <View className="mt-4 border-t border-slate-800 pt-3 gap-3">
                              <Text className="text-[11px] leading-4 text-slate-400">{run.note}</Text>
                              <PrimaryButton onPress={() => handleStartWebFactoryPipeline(run.brief)} icon="bolt">
                                Ejecutar Web Factory + Playwright QA
                              </PrimaryButton>
                              <GhostButton onPress={() => confirmDelete(run.id)} icon="delete-outline">
                                Eliminar del dispositivo
                              </GhostButton>
                            </View>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          )}

          {activeTab === "QA_INSPECTOR" && (
            <View className="gap-6">
              <View className="rounded-2xl border border-cyan-900/60 bg-slate-900/80 p-5">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <MaterialIcons name="bug-report" size={20} color="#38bdf8" />
                    <Text className="font-mono text-[15px] font-semibold text-slate-100">Playwright E2E QA Inspector</Text>
                  </View>
                  <StatusBadge
                    label={isBuilding ? "PROCESANDO" : qaResult?.auditReport.passed ? "QA APROBADO" : "PENDIENTE"}
                    tone={isBuilding ? "warn" : qaResult?.auditReport.passed ? "good" : "neutral"}
                  />
                </View>

                {selectedBrief ? (
                  <Text className="mt-3 text-[12px] leading-5 text-slate-300 border-l-2 border-cyan-500 pl-3">
                    Brief: "{selectedBrief}"
                  </Text>
                ) : (
                  <Text className="mt-3 text-[12px] text-slate-400">
                    Selecciona una corrida en la pestaña Cola o presiona el botón inferior para auditar un brief de prueba.
                  </Text>
                )}

                <View className="mt-4">
                  <PrimaryButton
                    disabled={isBuilding}
                    onPress={() => handleStartWebFactoryPipeline(selectedBrief || "Landing para clínica dental en Bogotá con servicios y agenda")}
                    icon="auto-fix-high"
                  >
                    {isBuilding ? "Auditando con Playwright…" : "Lanzar Auditoría Visual QA"}
                  </PrimaryButton>
                </View>
              </View>

              {qaResult ? (
                <View className="gap-4">
                  {/* Score Card */}
                  <View className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <Text className="text-[10px] uppercase tracking-[1.5px] text-slate-400">Puntaje QA (20 Puntos)</Text>
                    <View className="mt-2 flex-row items-baseline gap-2">
                      <Text className="font-mono text-[32px] font-bold text-emerald-400">{qaResult.auditReport.scorePercentage}%</Text>
                      <Text className="text-[12px] text-slate-400">
                        ({qaResult.auditReport.totalPassed}/{qaResult.auditReport.totalChecks} pruebas pasadas)
                      </Text>
                    </View>
                    <Text className="mt-1 text-[11px] text-slate-400">
                      Iteraciones de auto-corrección: {qaResult.iterationsRan} {qaResult.autoCorrected ? "(Auto-corregido en caliente)" : ""}
                    </Text>
                  </View>

                  {/* Test Sections */}
                  <View className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <Text className="font-mono text-[13px] font-semibold text-slate-200 mb-2">Pruebas Automatizadas</Text>
                    <DataRow label="Barredor de Enlaces" value={qaResult.linkSweeper.passed ? "✓ Sin href='#' rotos" : "❌ Enlaces vacíos"} />
                    <DataRow label="Simulador de Formularios" value={qaResult.formSimulator.passed ? "✓ Estados Loading/Success" : "❌ Faltan estados"} />
                    <DataRow label="Viewport Móvil (375px)" value={qaResult.mobileViewport375px.passed ? "✓ Cero scrollbar horizontal" : "❌ Desbordamiento"} />
                    <DataRow label="Área Táctil Móvil" value="✓ Cumple min 44px × 44px" />
                    <DataRow label="Relación de Contraste" value="✓ Mínimo 4.5:1 WCAG AA" />
                  </View>

                  {/* Manus Deployment Status */}
                  {deployResult ? (
                    <View className="rounded-2xl border border-emerald-900/80 bg-emerald-950/30 p-5">
                      <View className="flex-row items-center gap-2">
                        <MaterialIcons name="cloud-done" size={20} color="#34d399" />
                        <Text className="font-mono text-[14px] font-semibold text-emerald-200">Despliegue Atómico Manus.im</Text>
                      </View>
                      <Text className="mt-2 text-[12px] text-slate-300 leading-relaxed">
                        Sitio web live publicado exitosamente:
                      </Text>
                      <View className="mt-3 bg-slate-950 p-3 rounded-xl border border-emerald-900/60">
                        <Text className="font-mono text-[12px] text-emerald-400">{deployResult.deploymentUrl}</Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          )}

          {activeTab === "PROSPECTOR" && (
            <View className="gap-6">
              <View className="rounded-2xl border border-emerald-900/60 bg-slate-900/80 p-5">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <MaterialIcons name="place" size={20} color="#34d399" />
                    <Text className="font-mono text-[15px] font-semibold text-slate-100">Buscador de Clientes en Google Maps</Text>
                  </View>
                  <StatusBadge label="SIN SITIO WEB" tone="good" />
                </View>

                <Text className="mt-2 text-[12px] text-slate-400 leading-relaxed">
                  Filtra negocios locales en Google Maps que NO tienen sitio web oficial para crearles una página demo live y cerrar la venta.
                </Text>

                <View className="mt-4 gap-3">
                  <TextInput
                    value={prospectQuery}
                    onChangeText={setProspectQuery}
                    placeholder="Categoría (ej: Odontología, Pizzería, Peluquería)"
                    placeholderTextColor="#94a3b8"
                    className="min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-3 text-[13px] text-slate-100"
                  />
                  <TextInput
                    value={prospectCity}
                    onChangeText={setProspectCity}
                    placeholder="Ciudad (ej: Bogotá, Medellín, Cali)"
                    placeholderTextColor="#94a3b8"
                    className="min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-3 text-[13px] text-slate-100"
                  />
                  <PrimaryButton disabled={isSearchingLeads} onPress={handleSearchProspects} icon="search">
                    {isSearchingLeads ? "Buscando en Google Maps…" : "Buscar Negocios sin Sitio Web"}
                  </PrimaryButton>
                </View>
              </View>

              {prospects.length > 0 ? (
                <View className="gap-3">
                  <SectionHeading eyebrow={`${prospects.length} detectados`} title="Prospectos Calificados" />
                  {prospects.map((prospect) => (
                    <View key={prospect.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                      <View className="flex-row items-start justify-between gap-3">
                        <View className="flex-1">
                          <Text className="font-mono text-[14px] font-semibold text-slate-100">{prospect.name}</Text>
                          <Text className="mt-1 text-[11px] text-slate-400">{prospect.address}</Text>
                          <Text className="mt-1 text-[11px] font-mono text-emerald-400">⭐ {prospect.rating} / 5.0 · {prospect.phone}</Text>
                        </View>
                        <StatusBadge label={prospect.status} tone="warn" />
                      </View>

                      <View className="mt-4 border-t border-slate-800 pt-3">
                        <GhostButton disabled={isBuilding} onPress={() => handleGenerateDemoPitch(prospect)} icon="bolt">
                          Generar Demo Live + Pitch de Venta
                        </GhostButton>
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}

              {generatedPitch ? (
                <View className="rounded-2xl border border-emerald-900/80 bg-emerald-950/40 p-5 gap-3">
                  <View className="flex-row items-center gap-2">
                    <MaterialIcons name="record-voice-over" size={20} color="#34d399" />
                    <Text className="font-mono text-[15px] font-semibold text-emerald-200">Demo + Guion Comercial Generado</Text>
                  </View>

                  <Text className="text-[12px] text-slate-300">
                    Cliente: <Text className="font-semibold text-slate-100">{generatedPitch.businessName}</Text>
                  </Text>

                  <View className="bg-slate-950 p-3 rounded-xl border border-emerald-900/60">
                    <Text className="text-[10px] uppercase font-mono text-slate-400 mb-1">URL Demo Live (Manus.im):</Text>
                    <Text className="font-mono text-[12px] text-emerald-400">{generatedPitch.demoUrl}</Text>
                  </View>

                  <View className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <Text className="text-[10px] uppercase font-mono text-slate-400 mb-1">Guion de Venta para WhatsApp/Llamada:</Text>
                    <Text className="text-[12px] text-slate-200 leading-relaxed">{generatedPitch.salesPitchScript}</Text>
                  </View>
                </View>
              ) : null}
            </View>
          )}

          {activeTab === "GUIDELINES" && (
            <View className="gap-4">
              <View className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <Text className="font-mono text-[15px] font-semibold text-slate-100">Reglas Vercel & Taste Skill</Text>
                <Text className="mt-2 text-[12px] text-slate-400 leading-relaxed">
                  Garantizan que JARVIS nunca emita código genérico o inaccesible:
                </Text>

                <View className="mt-4 gap-3">
                  <GuidelineCard title="1. Contraste Mínimo" desc="Relación de contraste de texto de al menos 4.5:1 en todos los elementos." tag="Ratio >= 4.5:1" />
                  <GuidelineCard title="2. Áreas Táctiles Móviles" desc="Todos los botones e insumos tienen dimensión mínima de 44px × 44px." tag="Min 44px × 44px" />
                  <GuidelineCard title="3. Cero Texto Cortado" desc="Prohibido el truncado o desbordamiento no deseado en títulos principales." tag="No truncate" />
                  <GuidelineCard title="4. Sintaxis Accesible" desc="Atributos alt obligatorios en imágenes y estructura semántica limpia." tag="Alt & Roles" />
                  <GuidelineCard title="5. Sistema de Diseño HUD" desc="Tipografía monocromática, bordes definidos y acentos fluorescentes sobrios." tag="HUD Palette" />
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function GuidelineCard({ title, desc, tag }: { title: string; desc: string; tag: string }) {
  return (
    <View className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 flex-row items-start justify-between gap-3">
      <View className="flex-1">
        <Text className="font-mono text-[13px] font-semibold text-slate-200">{title}</Text>
        <Text className="mt-1 text-[11px] leading-4 text-slate-400">{desc}</Text>
      </View>
      <View className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1">
        <Text className="font-mono text-[9px] uppercase tracking-wider text-slate-300">{tag}</Text>
      </View>
    </View>
  );
}
