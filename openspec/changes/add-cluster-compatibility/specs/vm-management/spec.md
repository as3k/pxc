## MODIFIED Requirements
### Requirement: VM Listing
The system SHALL display cluster-wide VM information with enhanced node context.

#### Scenario: Cluster VM listing
- **WHEN** user runs list command on a cluster
- **THEN** all VMs across all nodes are displayed
- **AND** node information is prominently shown
- **AND** cluster status summary is displayed
- **AND** VMs are grouped by node for readability

#### Scenario: Single-node VM listing
- **WHEN** user runs list command on single-node setup
- **THEN** display format matches current behavior
- **AND** no clustering information is shown

## ADDED Requirements
### Requirement: Cluster Information Display
The system SHALL provide cluster topology and health information.

#### Scenario: Cluster status
- **WHEN** running on a Proxmox cluster
- **THEN** display cluster membership information
- **AND** show node status (online/offline)
- **AND** indicate current node where CLI is running
- **AND** provide cluster health summary

#### Scenario: Single-node environment
- **WHEN** running on single-node setup
- **THEN** no cluster information is displayed
- **AND** interface remains clean and simple
