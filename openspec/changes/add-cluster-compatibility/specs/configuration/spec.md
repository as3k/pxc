## MODIFIED Requirements
### Requirement: Configuration Management
The system SHALL support per-node configuration preferences for cluster environments.

#### Scenario: Node-specific defaults
- **WHEN** user creates VM on different nodes
- **THEN** system maintains separate defaults per node
- **AND** storage preferences are saved per node
- **AND** bridge preferences are saved per node
- **AND** last used node becomes default preference

#### Scenario: Cluster-wide defaults
- **WHEN** storage is shared across cluster
- **THEN** shared storage preferences apply to all nodes
- **AND** packages can be marked as cluster-wide
- **AND** configuration clearly separates shared vs node-specific settings

#### Scenario: Configuration migration
- **WHEN** upgrading from single-node config
- **THEN** existing preferences become default node settings
- **AND** configuration structure is automatically updated
- **AND** no user data is lost during migration
