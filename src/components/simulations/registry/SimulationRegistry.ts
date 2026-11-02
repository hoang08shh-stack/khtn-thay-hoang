import React from 'react';
import { SubjectDomain, Grade } from '../../../types/index.ts';
import { SimulationManifest } from '../../../types/simulationManifest.ts';
import { SEED_SIMULATIONS } from '../../../services/simulationService.ts';

export interface DiscoveryQuestion {
  id: string;
  question: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
  explanation: string;
  hint?: string;
}

export interface SimulationParameterDef {
  key: string;
  label: string;
  type: 'slider' | 'select' | 'boolean' | 'toggle-group';
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: { value: any; label: string }[];
  description?: string;
}

export interface LabSimulationModule {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  domain: SubjectDomain;
  grade: Grade;
  category: string;
  difficulty: 'Cơ bản' | 'Trung bình' | 'Nâng cao';
  tags: string[];
  thumbnailUrl: string;
  summary: string;
  curriculumCode: string; // e.g. "GDPT 2018 - KHTN 7 (Chủ đề 2: Phân tử)"
  learningObjectives: string[];
  keyConcepts: { term: string; definition: string }[];
  scientificExplanation: {
    overview: string;
    keyPoints: { title: string; content: string }[];
    realWorldApplication: string;
  };
  discoveryQuestions: DiscoveryQuestion[];
  parameterDefinitions: SimulationParameterDef[];
  defaultParameters: Record<string, any>;
  // Component renderer
  component: React.ComponentType<any>;
}

/**
 * Unified Registry holding both:
 * - Mode 1: Declarative GLB Simulations (configured via Manifest, rendered by ModelViewer)
 * - Mode 2: Custom TSX Simulations (programmed in React/Three.js with custom procedural logic)
 */
class SimulationRegistryClass {
  private customModules: Map<string, LabSimulationModule> = new Map();
  private manifests: Map<string, SimulationManifest> = new Map();

  constructor() {
    // Pre-populate with seed manifests
    SEED_SIMULATIONS.forEach((m) => {
      this.manifests.set(m.id, m);
    });
  }

  // ==========================================
  // Mode 2: Custom TSX Modules
  // ==========================================

  public register(module: LabSimulationModule): void {
    this.customModules.set(module.id, module);
  }

  public get(idOrSlug: string): LabSimulationModule | undefined {
    const direct = this.customModules.get(idOrSlug);
    if (direct) return direct;
    return Array.from(this.customModules.values()).find((m) => m.slug === idOrSlug);
  }

  public getAll(): LabSimulationModule[] {
    return Array.from(this.customModules.values());
  }

  public has(id: string): boolean {
    return this.customModules.has(id) || this.manifests.has(id);
  }

  // ==========================================
  // Mode 1: Declarative Manifests
  // ==========================================

  public registerManifest(manifest: SimulationManifest): void {
    this.manifests.set(manifest.id, manifest);
  }

  public unregisterManifest(id: string): void {
    this.manifests.delete(id);
  }

  public getManifest(idOrSlug: string): SimulationManifest | undefined {
    const direct = this.manifests.get(idOrSlug);
    if (direct) return direct;
    return Array.from(this.manifests.values()).find((m) => m.slug === idOrSlug);
  }

  public getAllManifests(includeDrafts = false): SimulationManifest[] {
    const list = Array.from(this.manifests.values());
    if (includeDrafts) return list;
    return list.filter((m) => m.status === 'published');
  }

  public filterManifests(
    grade?: Grade | 'all',
    domain?: SubjectDomain | 'all',
    includeDrafts = false
  ): SimulationManifest[] {
    return this.getAllManifests(includeDrafts).filter((sim) => {
      if (grade && grade !== 'all' && sim.grade !== grade) return false;
      if (domain && domain !== 'all' && sim.domain !== domain) return false;
      return true;
    });
  }

  /**
   * Determine simulation mode
   */
  public isCustomTsx(idOrSlug: string): boolean {
    const manifest = this.getManifest(idOrSlug);
    if (manifest) return manifest.mode === 'custom_tsx';
    return this.customModules.has(idOrSlug);
  }

  public isDeclarative(idOrSlug: string): boolean {
    const manifest = this.getManifest(idOrSlug);
    return manifest ? manifest.mode === 'declarative_glb' : false;
  }
}

export const SimulationRegistry = new SimulationRegistryClass();
