import { describe, expect, it } from 'vitest';
import { parseBedroomBindings } from '../../../src/adapters/homey/BedroomBindings';
import { BedroomHomeyDevices } from '../../../src/adapters/homey/BedroomHomeyInput';

describe('parseBedroomBindings', () => {
  it('accepts valid readonly pilot bindings', () => {
    expect(
      parseBedroomBindings({
        devices: [
          {
            semanticDevice: BedroomHomeyDevices.DOOR,
            physicalDeviceId: 'door-id',
            capabilities: ['alarm_contact'],
          },
          {
            semanticDevice: BedroomHomeyDevices.MAIN_LIGHT,
            physicalDeviceId: 'main-light-id',
            capabilities: ['onoff', 'dim'],
          },
        ],
      }),
    ).toEqual({
      devices: [
        {
          semanticDevice: BedroomHomeyDevices.DOOR,
          physicalDeviceId: 'door-id',
          capabilities: ['alarm_contact'],
        },
        {
          semanticDevice: BedroomHomeyDevices.MAIN_LIGHT,
          physicalDeviceId: 'main-light-id',
          capabilities: ['onoff', 'dim'],
        },
      ],
    });
  });

  it('rejects capabilities outside the semantic-device contract', () => {
    expect(
      parseBedroomBindings({
        devices: [
          {
            semanticDevice: BedroomHomeyDevices.DOOR,
            physicalDeviceId: 'door-id',
            capabilities: ['onoff'],
          },
        ],
      }),
    ).toBeNull();
  });

  it('rejects duplicate semantic or physical bindings', () => {
    expect(
      parseBedroomBindings({
        devices: [
          {
            semanticDevice: BedroomHomeyDevices.DOOR,
            physicalDeviceId: 'same-id',
            capabilities: ['alarm_contact'],
          },
          {
            semanticDevice: BedroomHomeyDevices.MOTION_ENTRY,
            physicalDeviceId: 'same-id',
            capabilities: ['alarm_motion'],
          },
        ],
      }),
    ).toBeNull();
  });
});
