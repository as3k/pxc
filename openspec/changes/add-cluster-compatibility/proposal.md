# Change: Add Full Cluster Compatibility

## Why
PXC currently works well for single-node Proxmox setups but has limitations in cluster environments. Users cannot select target nodes for VM creation, network bridge detection is limited to the current node, and there's no cluster topology awareness. This limits the tool's utility in production Proxmox clusters.

## What Changes
- **NEW**: Node selection wizard step to allow choosing target node for VM creation
- **MODIFY**: Network bridge detection to work on target node, not just current node
- **MODIFY**: VM creation functions to accept target node parameter
- **NEW**: Cluster topology information display
- **ENHANCE**: Storage UI to indicate shared vs node-local storage
- **MODIFY**: Configuration system to support per-node defaults

## Impact
- Affected specs: vm-creation, vm-management, configuration
- Affected code: src/lib/proxmox.ts, src/steps/*, src/commands/*
- **BREAKING**: Updated createVm() function signature to include node parameter
