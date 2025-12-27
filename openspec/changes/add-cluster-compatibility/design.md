## Context
PXC is a Proxmox CLI tool that currently works well for single-node environments but has limitations in cluster setups. The tool needs enhancement to support full cluster operations while maintaining simplicity for single-node users. This enhancement must not break existing workflows and should provide clear value to cluster administrators.

## Goals / Non-Goals

### Goals
- Enable VM creation on any node in a cluster
- Maintain backward compatibility for single-node setups
- Provide intelligent storage selection guidance
- Show cluster topology and health information
- Store per-node user preferences

### Non-Goals
- Full cluster management (moving VMs between nodes)
- Cluster administration operations
- Multi-node orchestration (simultaneous operations)
- Advanced scheduling or load balancing

## Decisions

### Decision: Node Selection Step Addition
- **Approach**: Add new wizard step after Welcome, before Identity
- **Rationale**: Logical flow - know environment first, then configure VM
- **Alternatives considered**: 
  - Node selection in Identity step (too crowded)
  - Global node flag (not discoverable)
  - Auto-node selection (no user control)

### Decision: Target Node API Calls
- **Approach**: Modify all Proxmox functions to accept optional node parameter
- **Rationale**: Maintains backward compatibility while adding cluster support
- **Implementation**: Use current node as default when node not specified

### Decision: Storage Affinity Display
- **Approach**: Show storage type and node affinity in selection UI
- **Rationale**: Users need to know which storage works with selected node
- **Implementation**: Parse storage content types and node information

### Decision: Configuration Structure
- **Approach**: Hierarchical config with global defaults and node overrides
- **Rationale**: Maintains simplicity while allowing node-specific customization
- **Structure**: 
  ```yaml
  defaults: # global defaults
    cores: 2
    memory: 2048
  nodes: # node-specific overrides
    node1:
      bridge: vmbr0
      storage: local-lvm
    node2:
      bridge: vmbr1
      storage: ceph-pool
  ```

## Risks / Trade-offs

### Risk: Increased Complexity
- **Risk**: More steps and options may overwhelm single-node users
- **Mitigation**: Smart defaults, skip node selection on single-node, clean UI

### Risk: Breaking Changes
- **Risk**: API changes may break existing integrations
- **Mitigation**: Optional parameters with same defaults, clear migration path

### Risk: Storage Detection Accuracy
- **Risk**: Storage affinity detection may be incorrect in complex setups
- **Mitigation**: Clear labeling, manual override options, validation

## Migration Plan

### Phase 1: Core Infrastructure
1. Update proxmox.ts with node-aware functions
2. Add cluster detection utilities
3. Update configuration system for node preferences

### Phase 2: UI Enhancement
1. Create NodeSelection step component
2. Update Network step for target node
3. Enhance Storage step with affinity information
4. Update VM listing with cluster info

### Phase 3: Integration and Testing
1. Integrate new components into wizard flow
2. Update all commands for cluster awareness
3. Comprehensive testing on single-node and cluster setups
4. Documentation updates

### Phase 4: Polish and Release
1. UI refinements based on testing
2. Performance optimization
3. Final validation and release

## Open Questions
- How to handle cluster authentication across nodes?
- Should we support VM templates across nodes?
- How to display cluster quorum and membership status?
- Should we add node health metrics?
- How to handle storage migration scenarios?
