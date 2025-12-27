# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-12-27

### 🎉 MAJOR RELEASE - Full Cluster Compatibility

#### ✨ NEW FEATURES
- **Cluster Node Selection**: Choose target VM node in multi-node Proxmox clusters
- **Node-Aware Resource Detection**: Storage, bridges, and ISOs detected on target nodes
- **Cluster-Aware VM Listing**: VMs grouped by node with status indicators
- **Per-Node Configuration**: Node-specific preferences and defaults
- **Storage Affinity Display**: Shows "Shared" vs "Local (node-name)" storage
- **Online/Offline Node Indicators**: Visual status for cluster nodes
- **Auto-Single Node Mode**: Automatic bypass of node selection on single-node setups

#### 🔄 ENHANCEMENTS
- Enhanced VM listing with cluster information
- Improved configuration system with hierarchical defaults
- Better error handling with node context
- Enhanced mock mode for cluster testing
- Improved storage selection guidance
- Network bridge detection on target nodes

#### 🏗️ ARCHITECTURE
- Updated Proxmox functions to accept optional node parameter
- Enhanced configuration system with per-node support
- Added cluster detection and node management utilities
- Improved type safety for cluster operations
- Enhanced state management for node selection

#### 📝 DOCUMENTATION
- Updated user guide with cluster workflow
- Added cluster configuration examples
- Enhanced troubleshooting section
- Updated README with cluster features
- Added cluster usage examples

#### ⚠️ BREAKING CHANGES
- `createVm()` function now accepts optional `node` parameter (backward compatible)
- Configuration structure updated with `nodes:` section (migration handled automatically)

#### 🐛 BUG FIXES
- Fixed storage detection in cluster environments
- Improved node status checking
- Enhanced error messages with cluster context
- Better handling of offline nodes

#### 🧪 TESTING
- Comprehensive cluster testing on 3-node production cluster
- Edge case and stress testing (25+ nodes, 100+ VMs)
- Regression testing for single-node compatibility
- Mock mode cluster simulation

#### 🔧 DEVELOPER EXPERIENCE
- Enhanced mock mode for development without clusters
- Improved type definitions for cluster operations
- Better error handling and logging
- Enhanced configuration migration

---

## [1.0.0] - Previous Releases

### Features
- Interactive step-by-step VM creation wizard
- List, start, and stop VMs and containers
- ISO management (list, download, upload, delete)
- Package system for VM templates
- Configuration management with YAML
- Ceph-safe disk creation
- Mock mode for development

### Architecture
- Built with React/Ink for terminal UI
- TypeScript with strict mode
- Proxmox CLI integration
- Arrow-key navigation interface