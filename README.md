# pxc - Proxmox VM CLI

A modern, interactive CLI for managing Proxmox VMs with a Vercel-like experience.

## Features

- Interactive step-by-step VM creation wizard (9 steps including node selection)
- **NEW**: Full cluster compatibility with node selection
- List, start, and stop VMs and containers across cluster
- Shows cluster status and node grouping
- Arrow-key navigation
- Auto-detection of storage, bridges, and ISOs on target nodes
- Ceph-safe disk creation
- Clean, modern terminal UI
- **NEW**: Per-node configuration preferences

## Requirements

- Node.js 18+
- Proxmox VE node
- Access to `qm`, `pvesm`, and `pvesh` commands

## Installation

```bash
npm install -g pxc
```

## Usage

```bash
pxc                     # Show help
pxc create              # Create a new VM (interactive wizard with node selection)
pxc list                # List all VMs and containers (cluster-aware)
pxc ls                  # Alias for list
pxc start <vmid>        # Start a VM or container
pxc stop <vmid>         # Stop a VM or container (graceful)
pxc stop <vmid> --force # Force stop a VM

# ISO Management (node-aware)
pxc iso list            # List all ISOs
pxc iso download <url>  # Download ISO to target node storage
pxc iso upload <file>   # Upload local ISO to node storage
pxc iso delete <name>   # Delete an ISO

# Configuration (cluster-aware)
pxc config show         # Show current config (includes per-node settings)
pxc config path         # Show config file path
```

**For testing/development (mock mode):**

```bash
npm run dev:mock
```

Mock mode allows you to test the wizard UI without Proxmox tools installed. It uses fake data for storage pools, bridges, and ISOs.

**Development with auto-reload:**

```bash
npm run dev
```

## Configuration

Configuration is stored in `~/.config/pxc/config.yaml`:

```yaml
defaults:
  isoStorage: cephfs-iso    # Default storage for ISOs
  vmStorage: local-lvm      # Default storage for VM disks
  bridge: vmbr0             # Default network bridge
  cores: 2                  # Default CPU cores
  memory: 2048              # Default memory (MB)
  disk: 32                  # Default disk size (GB)

nodes:                      # NEW: Per-node configuration
  node1:
    bridge: vmbr0           # Default bridge for this node
    vmStorage: local-lvm     # Default VM storage for this node
  node2:
    bridge: vmbr1           # Different bridge for this node
    vmStorage: ceph-pool    # Use shared storage

ui:
  savePreferences: true     # Auto-save selections as defaults
```

### NEW: Cluster Support

PXC now supports Proxmox clusters with node selection:

- **Single-node**: Works exactly as before
- **Multi-node**: Choose target node for VM creation
- **Per-node config**: Different defaults per node
- **Cluster listing**: Shows VMs grouped by node
- **Node status**: Online/offline indicators

**Commands:**
```bash
pxc config show   # Show current configuration
pxc config path   # Show config file path
```

Preferences are saved automatically when you use ISO commands without specifying a storage. To reset, delete the config file:

```bash
rm ~/.config/pxc/config.yaml
```

## Build

Compile to JavaScript:

```bash
npm run build
```

## Architecture

Built with:
- **Ink** - React for the terminal
- **TypeScript** - Type safety
- **execa** - Shell command execution

## Project Structure

```
src/
├── index.tsx          # CLI entry point with commander
├── app.tsx            # Re-exports for compatibility
├── commands/          # CLI subcommands
│   ├── create.tsx     # VM creation wizard
│   ├── list.tsx       # List VMs
│   ├── start.tsx      # Start VM
│   └── stop.tsx       # Stop VM
├── steps/             # Wizard step components
│   ├── Welcome.tsx
│   ├── Identity.tsx
│   ├── Compute.tsx
│   ├── Storage.tsx
│   ├── Network.tsx
│   ├── Iso.tsx
│   ├── Summary.tsx
│   ├── Execute.tsx
│   ├── Success.tsx
│   └── Error.tsx
└── lib/               # Utilities
    ├── types.ts       # Type definitions
    ├── validators.ts  # Input validation
    ├── config.ts      # User preferences
    └── proxmox.ts     # Proxmox CLI wrappers
```

## License

MIT
