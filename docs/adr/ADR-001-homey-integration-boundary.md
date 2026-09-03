# ADR-001: Homey integration boundary

- Status: Accepted
- Date: 2026-09-04

## Context

HomeyKing must run locally on Homey Self-Hosted Server while keeping its business logic independent from Homey device UUIDs, vendor apps, Flow card IDs and transport details.

The bedroom pilot uses both stateful device capabilities (door contact, motion and light on/off state) and transient button/remote events that are exposed by Homey as Flow triggers rather than durable device state.

## Decision

HomeyKing uses two inbound paths, both terminating at the same semantic domain-event boundary.

### 1. Stateful capabilities

The Homey app will create an in-app Homey Web API client and observe devices owned by other Homey apps. Stateful values such as `alarm_contact`, `alarm_motion` and `onoff` are converted into semantic HomeyKing inputs and then into domain events.

The physical Homey UUID is resolved only by local configuration/Device Registry. It is never passed into domain policies.

### 2. Transient triggers

Events that only exist as Homey Flow triggers (for example a remote button or scene press) use a thin Homey Flow adapter. The Flow contains no house policy: it only forwards a normalized transient event to HomeyKing.

Homey-specific trigger/card identifiers must not enter domain code.

## Outbound path

Domain modules emit semantic intents. Intents always cross the `CommandSink` execution boundary.

During migration the active sink is `ShadowCommandSink`, which records desired actions but performs no physical writes.

A future Homey live sink will translate semantic device IDs to Homey devices and capability writes through the Homey adapter. LIVE execution must not be enabled until shadow comparison and migration criteria pass.

## Required Homey integration

The Homey app implementation is expected to use the Homey Apps SDK plus the Homey Web API from inside the app for access to devices created by other apps. The implementation will declare the required Homey API permission in its app manifest.

## Consequences

- Homey remains the only required runtime platform.
- Core policies remain testable without Homey.
- Replacing a physical device requires changing registry/configuration, not policy code.
- Flow remains useful but becomes a thin event transport for transient triggers.
- Stateful observations can be reconciled into the Core without creating feedback commands.
- Shadow mode can compare legacy behavior and HomeyKing decisions before cutover.
- A future Home Assistant or other adapter can implement the same semantic boundary without changing bedroom policies.
