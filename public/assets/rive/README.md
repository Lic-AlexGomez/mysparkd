Place `sparky.riv` in this folder to enable the interactive Rive runtime.

Expected setup:
- Artboard: default
- State machine: `SparkyMachine`
- Inputs:
  - Number `mood`
  - Boolean `speaking`
  - Number `gazeX` (-1 to 1)
  - Number `gazeY` (-1 to 1)
  - Trigger `celebrate` (optional)

Animation names used as fallback when available:
- `idle`, `happy`, `sleepy`, `thinking`, `excited`, `celebrate`,
  `sad`, `confused`, `scared`, `wink`, `speaking`
