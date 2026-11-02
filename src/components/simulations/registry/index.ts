/**
 * 3D Digital Science Lab Simulation Registry & Modules
 * KHTN THẦY HOÀNG - GDPT 2018
 */

export * from './SimulationRegistry.ts';
export * from './registeredSimulations.ts';
export { LabViewer } from '../lab/LabViewer.tsx';
export { WaterMoleculeSimulation } from '../lab/WaterMoleculeSimulation.tsx';
export { WaterMoleculeFallback } from '../lab/WaterMoleculeFallback.tsx';
export {
  ATOM_DATABASE,
  H2O_CONSTANTS,
  calculateMoleculeCoordinates,
  calculateDistance,
  calculateAngleFromCoordinates,
  generateAngleArcPoints,
  calculateLonePairPositions,
  calculateVibrations,
} from '../../../utils/waterMoleculeMath.ts';
export type {
  AtomProperties,
  MoleculeParameters,
  Vector3D,
} from '../../../utils/waterMoleculeMath.ts';
