## ADDED Requirements
### Requirement: Node Selection
The system SHALL allow users to select the target node for VM creation in cluster environments.

#### Scenario: Single-node environment
- **WHEN** running on a single-node Proxmox setup
- **THEN** the wizard skips node selection
- **AND** VM is created on the current node

#### Scenario: Multi-node cluster
- **WHEN** running on a Proxmox cluster
- **THEN** the wizard displays available nodes
- **AND** user can select target node from list
- **AND** node selection persists as default preference

#### Scenario: Node offline
- **WHEN** a cluster node is offline
- **THEN** the node is displayed with offline status
- **AND** user cannot select offline nodes for VM creation

## MODIFIED Requirements
### Requirement: VM Creation Workflow
The system SHALL support VM creation on specific nodes in cluster environments.

#### Scenario: VM creation with node selection
- **WHEN** user selects a target node in the wizard
- **THEN** the VM is created on the selected node
- **AND** storage detection uses the target node
- **AND** network bridge detection uses the target node
- **AND** VM configuration is saved with node information

#### Scenario: VM creation without node selection
- **WHEN** user relies on defaults in single-node setup
- **THEN** the VM is created on the current node
- **AND** workflow matches existing behavior

## ADDED Requirements
### Requirement: Network Bridge Detection
The system SHALL detect network bridges on the target node for VM creation.

#### Scenario: Target node bridge detection
- **WHEN** user selects a target node for VM creation
- **THEN** network bridges are detected on the target node
- **AND** bridge list reflects target node's configuration
- **AND** user selects from target node's available bridges

#### Scenario: Bridge fallback
- **WHEN** bridge detection fails on target node
- **THEN** system provides manual bridge entry option
- **AND** displays warning about bridge availability

## ADDED Requirements
### Requirement: Storage Node Awareness
The system SHALL indicate storage node affinity to help users make informed decisions.

#### Scenario: Shared storage display
- **WHEN** storage is shared across cluster (Ceph, NFS)
- **THEN** storage is marked as "Shared" in selection UI
- **AND** accessible from any node

#### Scenario: Node-local storage display
- **WHEN** storage is local to specific node
- **THEN** storage shows node affinity in selection UI
- **AND** only available when VM is created on that node
- **AND** warnings shown for mismatched node/storage combinations
