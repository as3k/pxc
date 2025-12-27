import { execa } from 'execa';
import type { ProxmoxStorage, ProxmoxBridge, IsoFile, VmState } from './types.js';

const MOCK_MODE = process.env.MOCK_PROXMOX === '1';

/**
 * Check if we're running on a Proxmox node
 */
export async function isProxmoxNode(): Promise<boolean> {
	if (MOCK_MODE) return true;

	try {
		await execa('which', ['qm']);
		return true;
	} catch {
		return false;
	}
}

/**
 * Get the next available VM ID
 */
export async function getNextVmid(): Promise<number> {
	if (MOCK_MODE) return 100;

	try {
		const { stdout } = await execa('pvesh', ['get', '/cluster/nextid']);
		return parseInt(stdout.trim(), 10);
	} catch (error) {
		throw new Error('Failed to get next VM ID. Are you on a Proxmox node?');
	}
}

/**
 * Check if a VM ID is already in use
 */
export async function isVmidAvailable(vmid: number): Promise<boolean> {
	if (MOCK_MODE) return true;

	try {
		await execa('qm', ['status', vmid.toString()]);
		return false; // VM exists
	} catch {
		return true; // VM doesn't exist
	}
}

/**
 * Get available storage pools that support VM disks
 */
export async function getStorages(): Promise<ProxmoxStorage[]> {
	if (MOCK_MODE) {
		return [
			{ name: 'local-lvm', type: 'lvmthin', available: true, content: ['images'] },
			{ name: 'ceph-pool', type: 'rbd', available: true, content: ['images'] },
			{ name: 'nfs-storage', type: 'nfs', available: true, content: ['images', 'iso'] },
		];
	}

	try {
		const { stdout } = await execa('pvesh', ['get', '/storage', '--output-format', 'json']);
		const data = JSON.parse(stdout);

		const storages: ProxmoxStorage[] = [];

		for (const storage of data) {
			// Only include storages that can hold VM disks (have 'images' in content)
			if (storage.content?.includes('images')) {
				storages.push({
					name: storage.storage,
					type: storage.type,
					available: true,
					content: storage.content.split(','),
				});
			}
		}

		return storages;
	} catch (error) {
		throw new Error('Failed to get storage list');
	}
}

/**
 * Get storages that can hold ISO files
 */
export async function getIsoStorages(): Promise<ProxmoxStorage[]> {
	if (MOCK_MODE) {
		return [
			{ name: 'local', type: 'dir', available: true, content: ['iso', 'images'] },
			{ name: 'nfs-iso', type: 'nfs', available: true, content: ['iso'] },
		];
	}

	try {
		const { stdout } = await execa('pvesh', ['get', '/storage', '--output-format', 'json']);
		const data = JSON.parse(stdout);

		const storages: ProxmoxStorage[] = [];

		for (const storage of data) {
			// Only include storages that can hold ISO files
			if (storage.content?.includes('iso')) {
				storages.push({
					name: storage.storage,
					type: storage.type,
					available: true,
					content: storage.content.split(','),
				});
			}
		}

		return storages;
	} catch (error) {
		throw new Error('Failed to get ISO storage list');
	}
}

/**
 * Get available network bridges
 */
export async function getBridges(node: string = 'localhost'): Promise<ProxmoxBridge[]> {
	if (MOCK_MODE) {
		return [
			{ name: 'vmbr0', active: true },
			{ name: 'vmbr1', active: true },
		];
	}

	try {
		const { stdout } = await execa('pvesh', ['get', `/nodes/${node}/network`, '--type', 'bridge']);
		const data = JSON.parse(stdout);

		return data.map((bridge: any) => ({
			name: bridge.iface,
			active: bridge.active === 1,
		}));
	} catch (error) {
		// Fallback: parse /etc/network/interfaces or use common defaults
		return [{ name: 'vmbr0', active: true }];
	}
}

/**
 * Get ISO files from a storage
 */
export async function getIsoFiles(storage: string = 'local'): Promise<IsoFile[]> {
	if (MOCK_MODE) {
		return [
			{ volid: 'local:iso/alpine-3.18.iso', filename: 'alpine-3.18.iso', size: 157286400 },
			{ volid: 'local:iso/debian-12.iso', filename: 'debian-12.iso', size: 629145600 },
			{ volid: 'local:iso/ubuntu-24.04.iso', filename: 'ubuntu-24.04.iso', size: 5771362304 },
		];
	}

	try {
		const { stdout } = await execa('pvesm', ['list', storage]);
		const lines = stdout.split('\n').slice(1); // Skip header

		const isos: IsoFile[] = [];

		for (const line of lines) {
			if (!line.includes('.iso')) continue;

			const parts = line.split(/\s+/);
			const [volid, , size] = parts;
			const filename = volid.split('/').pop() || volid;

			isos.push({
				volid,
				filename,
				size: parseInt(size, 10),
			});
		}

		return isos;
	} catch (error) {
		// Storage might not have ISOs, return empty
		return [];
	}
}

/**
 * Create a VM
 */
export async function createVm(state: VmState): Promise<void> {
	const { vmid, name, cores, memoryMb, diskGb, storage, bridge, isoVolid } = state;

	if (MOCK_MODE) {
		// Simulate VM creation delay
		await new Promise((resolve) => setTimeout(resolve, 1000));
		console.log(
			`[MOCK] Would create VM ${vmid} (${name}): ${cores} cores, ${memoryMb}MB RAM, ${diskGb}GB disk on ${storage}, bridge ${bridge}${isoVolid ? `, ISO: ${isoVolid}` : ''}`
		);
		return;
	}

	try {
		// Step 1: Create the VM
		await execa('qm', [
			'create',
			vmid.toString(),
			'--name',
			name,
			'--cores',
			cores.toString(),
			'--memory',
			memoryMb.toString(),
			'--net0',
			`virtio,bridge=${bridge}`,
		]);

		// Step 2: Add disk using slot notation (Ceph-safe)
		await execa('qm', [
			'set',
			vmid.toString(),
			'--scsi0',
			`${storage}:${diskGb}`,
		]);

		// Step 3: Set boot order
		await execa('qm', [
			'set',
			vmid.toString(),
			'--boot',
			'order=scsi0',
		]);

		// Step 4: Attach ISO if provided
		if (isoVolid) {
			await execa('qm', [
				'set',
				vmid.toString(),
				'--ide2',
				`${isoVolid},media=cdrom`,
			]);
		}
	} catch (error: any) {
		throw new Error(`VM creation failed: ${error.message}`);
	}
}

/**
 * Get current node name
 */
export async function getNodeName(): Promise<string> {
	if (MOCK_MODE) return 'mocknode';

	try {
		const { stdout } = await execa('hostname');
		return stdout.trim();
	} catch {
		return 'localhost';
	}
}
