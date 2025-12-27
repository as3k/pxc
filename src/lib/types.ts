/**
 * Core VM configuration state
 */
export interface VmState {
	vmid: number;
	name: string;
	cores: number;
	memoryMb: number;
	diskGb: number;
	storage: string;
	bridge: string;
	isoVolid?: string;
}

/**
 * Wizard step names
 */
export type WizardStep =
	| 'welcome'
	| 'identity'
	| 'compute'
	| 'storage'
	| 'network'
	| 'iso'
	| 'summary'
	| 'confirm'
	| 'execute'
	| 'success'
	| 'error';

/**
 * Proxmox storage entry
 */
export interface ProxmoxStorage {
	name: string;
	type: string;
	available: boolean;
	content: string[];
}

/**
 * Proxmox network bridge
 */
export interface ProxmoxBridge {
	name: string;
	active: boolean;
}

/**
 * ISO file reference
 */
export interface IsoFile {
	volid: string;
	filename: string;
	size: number;
}

/**
 * Step component props
 */
export interface StepProps {
	state: Partial<VmState>;
	onNext: (updates: Partial<VmState>) => void;
	onBack?: () => void;
}

/**
 * Execution result
 */
export interface ExecutionResult {
	success: boolean;
	vmid?: number;
	error?: string;
}

/**
 * VM/Container information from Proxmox cluster
 */
export interface VmInfo {
	vmid: number;
	name: string;
	type: 'qemu' | 'lxc';
	node: string;
	status: 'running' | 'stopped' | 'paused';
	mem: number;
	maxmem: number;
	cpus: number;
	uptime: number;
}
