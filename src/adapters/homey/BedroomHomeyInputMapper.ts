import type { BedroomEvent } from '../../domains/lighting/BedroomEvent';
import {
  BedroomHomeyDevices,
  type BedroomHomeyInput,
} from './BedroomHomeyInput';

export class BedroomHomeyInputMapper {
  map(input: BedroomHomeyInput): BedroomEvent | null {
    if (input.type === 'CAPABILITY_CHANGED') {
      return this.mapCapability(input.device, input.capability, input.value);
    }

    return this.mapTransient(input.device, input.trigger);
  }

  private mapCapability(
    device: string,
    capability: string,
    value: unknown,
  ): BedroomEvent | null {
    if (
      device === BedroomHomeyDevices.DOOR &&
      capability === 'alarm_contact' &&
      value === true
    ) {
      return { type: 'BEDROOM_DOOR_OPENED' };
    }

    if (
      device === BedroomHomeyDevices.MOTION_ENTRY &&
      capability === 'alarm_motion' &&
      typeof value === 'boolean'
    ) {
      return {
        type: 'CLOSET_MOTION_CHANGED',
        sensor: 'entry',
        active: value,
      };
    }

    if (
      device === BedroomHomeyDevices.MOTION_INTERNAL &&
      capability === 'alarm_motion' &&
      typeof value === 'boolean'
    ) {
      return {
        type: 'CLOSET_MOTION_CHANGED',
        sensor: 'internal',
        active: value,
      };
    }

    if (capability === 'onoff' && typeof value === 'boolean') {
      if (device === BedroomHomeyDevices.MAIN_LIGHT) {
        return { type: 'LIGHT_STATE_OBSERVED', target: 'main', on: value };
      }

      if (device === BedroomHomeyDevices.NIGHT_LIGHT) {
        return { type: 'LIGHT_STATE_OBSERVED', target: 'night', on: value };
      }

      if (device === BedroomHomeyDevices.CLOSET_LIGHT) {
        return { type: 'LIGHT_STATE_OBSERVED', target: 'closet', on: value };
      }
    }

    return null;
  }

  private mapTransient(device: string, trigger: string): BedroomEvent | null {
    if (device === BedroomHomeyDevices.BED_REMOTE) {
      if (trigger === 'scene_down') {
        return { type: 'NIGHT_TOGGLE_REQUESTED' };
      }

      if (trigger === 'on') {
        return {
          type: 'MAIN_LIGHT_TOGGLE_REQUESTED',
          source: 'bed-remote-on',
        };
      }

      if (trigger === 'scene_up') {
        return { type: 'SCENE_UP_REQUESTED' };
      }
    }

    if (device === BedroomHomeyDevices.CLOSET_SWITCH) {
      if (trigger === 'on') {
        return { type: 'CLOSET_SWITCH_ON' };
      }

      if (trigger === 'off') {
        return {
          type: 'MAIN_LIGHT_TOGGLE_REQUESTED',
          source: 'closet-switch-off',
        };
      }
    }

    if (
      device === BedroomHomeyDevices.EXTERNAL_SWITCH &&
      trigger === 'on'
    ) {
      return {
        type: 'MAIN_LIGHT_TOGGLE_REQUESTED',
        source: 'external-switch',
      };
    }

    return null;
  }
}
