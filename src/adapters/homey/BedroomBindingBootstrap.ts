import { BedroomHomeyDevices, type BedroomHomeyDevice } from './BedroomHomeyInput';

export interface BedroomBindingBootstrapEntry {
  readonly semanticDevice: BedroomHomeyDevice;
  readonly expectedName: string;
  readonly capabilities: readonly string[];
}

export const BedroomPilotBootstrapSpec: readonly BedroomBindingBootstrapEntry[] = [
  {
    semanticDevice: BedroomHomeyDevices.DOOR,
    expectedName: 'Sensore Porta Camera Claudio',
    capabilities: ['alarm_contact'],
  },
  {
    semanticDevice: BedroomHomeyDevices.MOTION_ENTRY,
    expectedName: 'Sensore di Movimento Entrata',
    capabilities: ['alarm_motion'],
  },
  {
    semanticDevice: BedroomHomeyDevices.MOTION_INTERNAL,
    expectedName: 'Sensore di Movimento Interno',
    capabilities: ['alarm_motion'],
  },
  {
    semanticDevice: BedroomHomeyDevices.MAIN_LIGHT,
    expectedName: 'Luce',
    capabilities: ['onoff', 'dim'],
  },
  {
    semanticDevice: BedroomHomeyDevices.NIGHT_LIGHT,
    expectedName: 'Luce Notturna',
    capabilities: ['onoff', 'dim'],
  },
  {
    semanticDevice: BedroomHomeyDevices.CLOSET_LIGHT,
    expectedName: 'Luce Cabina Armadio',
    capabilities: ['onoff', 'dim'],
  },
] as const;
