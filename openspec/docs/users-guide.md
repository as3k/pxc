# PXC Proxmox CLI - Comprehensive User Guide

## Overview

**PXC** is a modern CLI tool for managing Proxmox VMs and containers, built with React/Ink for terminal UI. It provides a Vercel-like interactive experience for VM creation and management, with a focus on user-friendly wizards and comprehensive Proxmox integration.

## Installation & Setup

### Prerequisites
- Proxmox VE environment
- Node.js 18+ 
- Proxmox CLI tools: `qm`, `pct`, `pvesh`, `pvesm`

### Quick Start
```bash
# Install globally (if packaged)
npm install -g @your-org/pxc

# Or run from source
git clone <repository>
cd pve-cli
npm install
npm run build
npm start
```

### Configuration
PXC automatically creates configuration at `~/.config/pxc/config.yaml`. No manual setup required - it detects your Proxmox environment and saves preferences as you use the tool.

## Commands Reference

### Core VM Management

#### `pxc create` - VM Creation Wizard
The primary command for creating new VMs interactively.

**Usage:**
```bash
pxc create [-p, --package <name>]
```

**Options:**
- `-p, --package <name>` - Use predefined package for defaults

**Features:**
- 9-step guided wizard (includes node selection for clusters)
- Auto-detection of available resources
- Real-time validation
- Package preset support
- **NEW:** Full cluster compatibility with node selection

**Example:**
```bash
# Create VM with wizard
pxc create

# Create VM using web-server package defaults
pxc create --package web-server
```

#### `pxc list` / `pxc ls` - List VMs and Containers
Display all VMs and containers across the cluster.

**Usage:**
```bash
pxc list
pxc ls
```

**Output (Single-Node):**
```
┌─────────┬──────────────────────┬──────┬──────────┬─────────┬────────┬───────┐
│ VMID    │ Name                 │ Type │ Node     │ Status  │ CPU    │ Mem   │
├─────────┼──────────────────────┼──────┼──────────┼─────────┼────────┼───────┤
│ 100     │ web-server-01         │ VM   │ proxmox-1│ running │ 15.3%  │ 2.1GB │
│ 101     │ database-01          │ VM   │ proxmox-1│ stopped │ 0%     │ 0GB   │
└─────────┴──────────────────────┴──────┴──────────┴─────────┴────────┴───────┘

Total: 2 VMs | 1 Running, 1 Stopped
```

**Output (Cluster Mode):**
```
▲ pxc list (cluster mode)

Cluster: 3/3 nodes online • herdaz(●) • azimir(●) • kholinar(●)

herdaz (6 VMs) ●
100  VM  web-server-01         running   15.3%   2.1GB
101  VM  database-01           stopped    0%      0GB
102  VM  app-server            running    8.7%    1.5GB
[3 more VMs...]

azimir (1 VMs) ●
105  VM  test-vm               running    5.2%    512MB

kholinar (3 VMs) ●  
110  CT  container-01          running    2.1%    256MB
111  CT  container-02          stopped    0%      0GB

10 total • 8 VMs • 2 CTs • 6 Running • 3/3 nodes online
```

#### `pxc start <vmid>` - Start VM/Container
Start a VM or container by ID.

**Usage:**
```bash
pxc start 100
```

**Features:**
- Auto-detects VM type (QEMU/LXC)
- Status checking
- Clear success/error feedback

#### `pxc stop <vmid>` - Stop VM/Container
Stop a VM or container.

**Usage:**
```bash
pxc stop 100
pxc stop 101 --force  # Hard shutdown
```

**Options:**
- `-f, --force` - Force stop (hard shutdown for VMs)

### ISO Management

#### `pxc iso list` / `pxc iso ls`
List all ISO images across all ISO-capable storages.

**Usage:**
```bash
pxc iso list
```

**Output:**
```
┌──┬─────────────────────────┬─────────────┬──────────┐
│# │ ISO Name                │ Storage     │ Size     │
├──┼─────────────────────────┼─────────────┼──────────┤
│1 │ ubuntu-22.04.3.iso      │ cephfs-iso  │ 3.4GB    │
│2 │ debian-12.1.0.iso       │ local:iso   │ 2.8GB    │
└──┴─────────────────────────┴─────────────┴──────────┘
```

#### `pxc iso download <url>`
Download ISO from URL to storage.

**Usage:**
```bash
pxc iso download https://releases.ubuntu.com/22.04.3/ubuntu-22.04.3-live-server-amd64.iso
pxc iso download <url> --storage local:iso --name ubuntu-server.iso
```

**Options:**
- `-s, --storage <storage>` - Target storage pool
- `-n, --name <filename>` - Custom filename

**Features:**
- Progress bar with speed and ETA
- Auto-detects ISO storage
- Saves storage preference

#### `pxc iso upload <file>`
Upload local ISO file to storage.

**Usage:**
```bash
pxc iso upload ./ubuntu-22.04.3.iso
pxc iso upload ./ubuntu-22.04.3.iso --storage cephfs-iso
```

**Options:**
- `-s, --storage <storage>` - Target storage pool

#### `pxc iso delete <name>` / `pxc iso rm <name>`
Delete ISO by name or by number (from list output).

**Usage:**
```bash
pxc iso delete ubuntu-22.04.3.iso
pxc iso rm 2  # Delete #2 from list
```

**Features:**
- Supports both filenames and numbered indices
- Case-insensitive matching

### Configuration Management

#### `pxc config show`
Display current configuration in YAML format.

**Usage:**
```bash
pxc config show
```

**Output:**
```yaml
defaults:
  isoStorage: cephfs-iso
  vmStorage: local-lvm
  bridge: vmbr0
  cores: 2
  memory: 2048
  disk: 32
  node: proxmox-1
  package: standard

packages:
  web-server:
    cores: 4
    memory: 4096
    disk: 50
    bridge: vmbr0
  database:
    cores: 8
    memory: 8192
    disk: 100
    bridge: vmbr1

ui:
  savePreferences: true

configPath: /home/user/.config/pxc/config.yaml
```

#### `pxc config path`
Show the configuration file path.

**Usage:**
```bash
pxc config path
# Output: /home/user/.config/pxc/config.yaml
```

### Package Management

Packages are reusable VM templates with predefined resource allocations.

#### `pxc packages list` / `pxc packages ls`
List all predefined packages.

**Usage:**
```bash
pxc packages list
```

**Output:**
```
┌─────────────┬───────┬────────┬──────┬─────────┐
│ Package     │ Cores │ Memory │ Disk │ Bridge  │
├─────────────┼───────┼────────┼──────┼─────────┤
│ standard    │ 2     │ 2048MB │ 32GB │ vmbr0   │
│ web-server  │ 4     │ 4096MB │ 50GB │ vmbr0   │
│ database    │ 8     │ 8192MB │ 100GB│ vmbr0   │
└─────────────┴───────┴────────┴──────┴─────────┘
```

#### `pxc packages show <name>`
Display detailed package configuration.

**Usage:**
```bash
pxc packages show web-server
```

#### `pxc packages add <name>`
Create or edit a package interactively.

**Usage:**
```bash
# Interactive mode
pxc packages add web-server

# Direct specification
pxc packages add app-server --cores 4 --memory 4096 --disk 50 --bridge vmbr0
```

**Options:**
- `-c, --cores <n>` - CPU cores
- `-m, --memory <mb>` - Memory in MB
- `-d, --disk <gb>` - Disk size in GB
- `-b, --bridge <name>` - Network bridge

#### `pxc packages delete <name>` / `pxc packages rm <name>`
Delete a package configuration.

**Usage:**
```bash
pxc packages delete old-package
```

## Wizard Workflow (Create Command)

The `pxc create` wizard follows a 9-step interactive process:

### Step 1: Welcome
- Verifies Proxmox environment
- Checks for required tools (`qm`, `pvesh`, `pvesm`)
- Detects cluster vs single-node environment
- Displays quick start instructions

### Step 2: Node Selection (NEW - Cluster Only)
- **Cluster Detection**: Automatically detects multi-node environments
- **Single Node**: Auto-advances with current node selected
- **Multi Node**: Shows list of available online nodes
- **Node Status**: Online (●) vs Offline (○) indicators
- **Current Node**: Highlighted for easy identification
- **Offline Nodes**: Filtered for safety (cannot create VMs on offline nodes)

### Step 3: Identity
- **VM ID**: Auto-suggests next available ID (100+), validates availability
- **VM Name**: Validates length and character requirements

### Step 3: Compute Resources
- **CPU Cores**: Default 2, range 1-128
- **Memory**: Default 2048MB, range 64MB-1TB  
- **Disk Size**: Default 20GB, max ~1PB
- All support package defaults

### Step 4: Compute Resources
- **CPU Cores**: Default 2, range 1-128
- **Memory**: Default 2048MB, range 64MB-1TB  
- **Disk Size**: Default 20GB, max ~1PB
- All support package defaults

### Step 5: Storage Selection
- Auto-detects available storage pools on selected node
- Filters for VM-compatible storage (with 'images' content)
- Shows storage affinity: "Shared" vs "Local (node-name)"
- Supports LVM, RBD, NFS, and other storage types
- Remembers user preference per node for future VMs

### Step 6: Network Configuration
- Auto-detects network bridges on selected node
- Falls back to `vmbr0` if detection fails
- Shows bridge status (active/inactive)
- Manual bridge entry when auto-detection fails
- Remembers user preference per node

### Step 7: ISO Selection
- Auto-detects ISO-capable storages on selected node
- Lists available ISO files with sizes and storage locations
- Shows "Shared" vs "Local (node-name)" storage affinity
- Option to skip ISO (no boot media)
- Remembers storage preference per node

### Step 8: Summary
- Shows complete VM configuration in table format
- Includes selected node information
- Option to create VM or cancel
- Clear breakdown of all settings

### Step 9: Execution
- Creates VM using Proxmox APIs
- Ceph-safe disk creation using slot notation
- Proper boot order configuration
- Real-time progress feedback

### Step 9: Result
- Shows creation result with VM ID
- Provides next steps (start/terminal commands)
- Option to create another VM

## Configuration System

### Configuration File
**Location**: `~/.config/pxc/config.yaml`

PXC automatically:
- Migrates legacy JSON configs to YAML
- Saves user preferences as defaults
- Maintains package definitions
- Validates configuration integrity

### Structure

```yaml
defaults:
  isoStorage: cephfs-iso    # Default storage for ISOs
  vmStorage: local-lvm      # Default storage for VM disks
  bridge: vmbr0             # Default network bridge
  cores: 2                  # Default CPU cores
  memory: 2048              # Default memory (MB)
  disk: 32                  # Default disk size (GB)
  package: standard         # Default package to use

nodes:                      # NEW: Per-node configuration
  proxmox-1:
    bridge: vmbr0           # Default bridge for this node
    vmStorage: local-lvm     # Default VM storage for this node
    isoStorage: local        # Default ISO storage for this node
  proxmox-2:
    bridge: vmbr1           # Different bridge for this node
    vmStorage: ceph-pool    # Use shared storage
    isoStorage: nfs-iso     # Use ISO storage on this node

packages:
  web-server:
    cores: 4
    memory: 4096
    disk: 50
    bridge: vmbr0
  database:
    cores: 8
    memory: 8192
    disk: 100
    bridge: vmbr1

ui:
  savePreferences: true     # Auto-save selections as defaults
```

### Cluster Configuration

**NEW**: PXC now supports per-node configuration for cluster environments.

#### Node-Specific Settings
- **bridge**: Default network bridge for specific node
- **vmStorage**: Default VM storage for specific node  
- **isoStorage**: Default ISO storage for specific node
- **Hierarchical Defaults**: Node overrides → Global defaults → Hardcoded

#### Migration
Existing configurations automatically migrate to new structure without data loss.

### Package System
Packages provide hierarchical defaults:
1. **Package defaults** (if specified)
2. **Global defaults** (from defaults section)
3. **Hardcoded defaults** (fallback)

You can override any package setting during VM creation.

## Development & Testing

### Mock Mode
For development without Proxmox infrastructure:

```bash
export MOCK_PROXMOX=1
npm run dev
```

**Mock Mode Features:**
- Simulated Proxmox responses
- Fake storage pools and ISOs
- Progress bar simulation
- Full workflow testing

### Development Commands

```bash
# Development with hot reload
npm run dev

# Development with mock mode
npm run dev:mock

# Type checking
npm run typecheck

# Build for production
npm run build

# Run compiled version
npm start
```

## UI/UX Features

### Terminal Design
- **Branding**: Consistent `▲ pxc` header
- **Color Coding**:
  - 🟢 Green: Success
  - 🔴 Red: Errors  
  - 🟡 Yellow: Warnings
  - 🔵 Blue: Information
  - 🟣 Cyan: Loading
  - 🟣 Magenta: VMs, 🔵 Blue: CTs

### Interactive Elements
- **Arrow Keys**: Navigate lists and menus
- **Tab**: Form navigation
- **Enter**: Confirm selections
- **Ctrl+C**: Cancel operations

### Output Formatting
- **Tables**: Aligned columns with proper spacing
- **Human-readable**: Bytes, uptime, status formats
- **Progress Bars**: Download/upload progress
- **Loading Spinners**: Async operation feedback

## Advanced Features

### Ceph Integration
- **Ceph-safe disk creation**: Uses slot notation (`scsi0`) instead of device names
- **RBD storage support**: Full integration with Ceph clusters
- **Automatic detection**: Identifies Ceph pools and capabilities

### Cluster Support
- **Multi-node awareness**: Lists VMs across entire cluster
- **Node-specific operations**: Creates VMs on current node
- **Resource aggregation**: Shows cluster-wide statistics
- **VM ID management**: Cluster-wide unique ID assignment

### Storage Detection
Automatically detects and categorizes storage:
- **VM Storage**: Pools with 'images' content
- **ISO Storage**: Pools with 'iso' content
- **LVM/LVM-thin**: Local thin provisioning
- **RBD**: Ceph distributed storage
- **NFS**: Network file storage
- **Directory**: Simple local storage

## Troubleshooting

### Common Issues

**"Proxmox tools not found"**
```bash
# Install Proxmox CLI tools
apt update && apt install pve-manager
```

**"Permission denied"**
```bash
# Run as root or add user to pveadmin group
sudo usermod -aG pveadmin $USER
```

**"Storage not detected"**
- Check storage pool content types
- Verify storage is online and accessible
- Run `pvesm status` to verify

### Debug Mode
```bash
# Enable verbose logging
DEBUG=1 pxc create
```

### Configuration Issues
```bash
# Check configuration location
pxc config path

# Show current configuration
pxc config show

# Reset configuration (backup first)
mv ~/.config/pxc/config.yaml ~/.config/pxc/config.yaml.bak
```

## Best Practices

1. **Use Packages**: Define packages for common VM types
2. **Save Preferences**: Let PXC remember your settings
3. **Resource Planning**: Check available resources before creating VMs
4. **Naming Conventions**: Use consistent VM naming
5. **ISO Management**: Keep ISO library organized
6. **Regular Updates**: Keep PXC updated for new features

## Examples

### Typical Single-Node Workflow
```bash
# 1. Check available VMs
pxc list

# 2. Create a web server using package
pxc create --package web-server

# 3. Start the new VM
pxc start 105

# 4. List to verify status
pxc list
```

### NEW: Cluster Workflow
```bash
# 1. Check cluster status
pxc list
# Output: Cluster: 3/3 nodes online • node1(●) • node2(●) • node3(●)

# 2. Create VM on specific node
pxc create
# 1. Complete Welcome step
# 2. Select target node (node2) in Node Selection step
# 3. Continue with Identity, Compute, etc. steps
# 4. Resources detected on node2 automatically

# 3. Create VM with node-specific package
pxc create --package web-server
# Package uses node2's default bridge and storage

# 4. Verify VM created on selected node
pxc list
# Shows: VM 105 on node2
```

### Custom Package Creation
```bash
# Create a database server package
pxc packages add database-server \
  --cores 8 \
  --memory 8192 \
  --disk 100 \
  --bridge vmbr0

# Use the package
pxc create --package database-server
```

### ISO Management
```bash
# Download Ubuntu ISO
pxc iso download https://releases.ubuntu.com/22.04/ubuntu-22.04.3-live-server-amd64.iso

# List ISOs
pxc iso list

# Create VM with ISO
pxc create
# Select Ubuntu ISO in step 6
```

## Architecture Highlights

- **TypeScript**: Full type safety and IDE support
- **React/Ink**: Component-based terminal UI
- **Modular Design**: Clear separation of commands and utilities
- **Error Handling**: Graceful failures with helpful messages
- **Extensible**: Easy to add new commands and features
- **Cross-platform**: Works on any system with Node.js

This comprehensive tool bridges the gap between Proxmox's powerful but complex CLI and a user-friendly, modern interface suitable for both beginners and experienced administrators.

## NEW: Cluster Troubleshooting

### Common Cluster Issues

#### "Node shows offline in selection"
**Problem**: Target node appears as ○ (offline) in NodeSelection step.

**Solutions:**
- Check node status: `pvesh get /nodes`
- Verify cluster quorum: `pvecm status`
- Check network connectivity: `ping node-name`
- Restart corosync: `systemctl restart pve-cluster` (run on all nodes)

#### "Storage not available on selected node"
**Problem**: Storage selection shows "No storage available" for selected node.

**Solutions:**
- Verify storage is enabled on target node: `pvesm status -n node-name`
- Check storage content types: `pvesh get /storage`
- Ensure storage has proper permissions
- Use shared storage (Ceph, NFS) for multi-node access

#### "Bridge detection fails on remote node"
**Problem**: Network step shows no bridges or errors.

**Solutions:**
- Check network configuration on target node
- Verify bridges exist: `brctl show`
- Manual bridge entry available in Network step
- Use consistent bridge names across nodes

#### "VM creation fails with 'no such resource'"
**Problem**: VM creation fails after node selection.

**Solutions:**
- Verify target node is online and in cluster
- Check storage availability on selected node
- Verify VM ID is not in use: `pvesh get /cluster/resources`
- Check Proxmox logs: `journalctl -u pvedaemon`

### Cluster Best Practices

1. **Use Shared Storage**: For VM portability between nodes
2. **Consistent Network**: Use same bridge names across nodes
3. **Monitor Cluster Health**: Regularly check node status
4. **Document Configuration**: Track per-node settings
5. **Test Failover**: Verify VMs work on different nodes