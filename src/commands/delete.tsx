import React, { useState, useEffect, useCallback } from 'react';
import { Text, Box, useInput } from 'ink';
import { getVmInfo, stopVm, deleteVm, deleteContainer, getVmDetails, getDiskUsage } from '../lib/proxmox.js';
import { Loading, Success, ErrorMessage, Warning, Info, LabelValue, Divider, formatBytes, formatUptime, TypeBadge, StatusBadge } from '../lib/ui.js';
import { getDeleteGracePeriod } from '../lib/config.js';

interface DeleteCommandProps {
	vmid: number;
	dryRun?: boolean;
}

type StepStatus = 'checking' | 'confirm-info' | 'confirm-verify' | 'grace-period' | 'deleting' | 'success' | 'error' | 'cancelled' | 'not-found';

interface VmDetails {
	name: string;
	type: 'qemu' | 'lxc';
	node: string;
	status: 'running' | 'stopped' | 'paused';
	mem: number;
	maxmem: number;
	cpus: number;
	uptime: number;
	disks?: Array<{
		storage: string;
		size: string;
		type: string;
		used?: string;
		available?: string;
	}>;
}

export function DeleteCommand({ vmid, dryRun = false }: DeleteCommandProps) {
	const [status, setStatus] = useState<StepStatus>('checking');
	const [error, setError] = useState<string>('');
	const [vmInfo, setVmInfo] = useState<VmDetails | null>(null);
	const [verificationInput, setVerificationInput] = useState<string>('');
	const graceConfig = getDeleteGracePeriod();
	const [graceCountdown, setGraceCountdown] = useState<number>(graceConfig.seconds);
	const [shouldStopFirst, setShouldStopFirst] = useState<boolean>(false);

	useEffect(() => {
		async function checkVm() {
			try {
				const info = await getVmInfo(vmid);
				if (!info) {
					setStatus('not-found');
					return;
				}

				// Get detailed disk information
				const disks = await getDiskUsage(vmid);

				setVmInfo({
					name: info.name,
					type: info.type,
					node: info.node,
					status: info.status,
					mem: info.mem,
					maxmem: info.maxmem,
					cpus: info.cpus,
					uptime: info.uptime,
					disks: disks || [],
				});

				setStatus('confirm-info');
			} catch (err: any) {
				setError(err.message);
				setStatus('error');
			}
		}
		checkVm();
	}, [vmid]);

	// Grace period countdown effect
	useEffect(() => {
		if (status !== 'grace-period') return;

		const timer = setInterval(() => {
			setGraceCountdown((prev) => {
				if (prev <= 1) {
					setStatus('deleting');
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [status]);

	// Handle user input for verification and cancellation
	useInput((input, key) => {
		if (status === 'confirm-verify') {
			if (key.escape) {
				setStatus('cancelled');
				return;
			}
			
			if (key.return) {
				const expectedValue = `${vmid} DELETE`;
				if (verificationInput.trim().toUpperCase() === expectedValue) {
					if (!dryRun) {
						if (graceConfig.disabled) {
							setStatus('deleting');
						} else {
							setStatus('grace-period');
						}
					} else {
						setStatus('success');
					}
				}
				return;
			}

			if (key.backspace || key.delete) {
				setVerificationInput((prev) => prev.slice(0, -1));
				return;
			}

			if (input && verificationInput.length < 20) {
				setVerificationInput((prev) => prev + input);
			}
		}

		if (status === 'grace-period' && key.escape) {
			setStatus('cancelled');
		}

		if (status === 'confirm-info') {
			if (key.escape) {
				setStatus('cancelled');
				return;
			}
			
			if (key.return) {
				if (vmInfo?.status === 'running' && !shouldStopFirst) {
					setStatus('error');
					setError('VM is running. You must stop it first or enable "stop first" option.');
					return;
				}
				setStatus('confirm-verify');
			}
			
			if (input === 's' || input === 'S') {
				setShouldStopFirst(!shouldStopFirst);
			}
		}
	});

	const handleDelete = useCallback(async () => {
		try {
			if (vmInfo?.status === 'running' && shouldStopFirst) {
				await stopVm(vmid, false);
			}

			// In dry run mode, we don't actually delete
			if (dryRun) {
				setStatus('success');
				return;
			}

			// Perform actual deletion
			if (vmInfo?.type === 'lxc') {
				await deleteContainer(vmid, true); // purgeDisks=true to remove disk data
			} else {
				await deleteVm(vmid, true); // purgeDisks=true to remove disk data
			}
			
			setStatus('success');
		} catch (err: any) {
			setError(err.message);
			setStatus('error');
		}
	}, [vmid, vmInfo, shouldStopFirst, dryRun]);

	// Handle deletion when status changes to 'deleting'
	useEffect(() => {
		if (status === 'deleting') {
			handleDelete();
		}
	}, [status, handleDelete]);

	const typeLabel = vmInfo?.type === 'lxc' ? 'Container' : 'VM';

	if (status === 'checking') {
		return (
			<Box flexDirection="column" paddingY={1}>
				<Box marginBottom={1}>
					<Text bold color="magenta">▲ pxc </Text>
					<Text bold>delete {vmid}{dryRun ? ' --dry-run' : ''}</Text>
				</Box>
				<Loading>Checking VM/container {vmid}...</Loading>
			</Box>
		);
	}

	if (status === 'not-found') {
		return (
			<Box flexDirection="column" paddingY={1}>
				<Box marginBottom={1}>
					<Text bold color="magenta">▲ pxc </Text>
					<Text bold>delete {vmid}{dryRun ? ' --dry-run' : ''}</Text>
				</Box>
				<ErrorMessage>{typeLabel} {vmid} not found in cluster</ErrorMessage>
			</Box>
		);
	}

	if (status === 'confirm-info' && vmInfo) {
		return (
			<Box flexDirection="column" paddingY={1}>
				<Box marginBottom={1}>
					<Text bold color="magenta">▲ pxc </Text>
					<Text bold>delete {vmid}{dryRun ? ' --dry-run' : ''}</Text>
				</Box>

				<Warning>This will permanently delete the following {typeLabel.toLowerCase()}:</Warning>
				
				<Box flexDirection="column" marginTop={1} marginBottom={1}>
					<LabelValue label="ID" value={vmid.toString()} />
					<LabelValue label="Name" value={vmInfo.name} />
					<Box><Text dimColor>Type: </Text><TypeBadge type={vmInfo.type} /></Box>
					<LabelValue label="Node" value={vmInfo.node} />
					<Box><Text dimColor>Status: </Text><StatusBadge status={vmInfo.status} /></Box>
					<LabelValue label="CPU" value={`${vmInfo.cpus} cores`} />
					<LabelValue label="Memory" value={formatBytes(vmInfo.maxmem)} />
					<LabelValue label="Uptime" value={formatUptime(vmInfo.uptime)} />
					
					{vmInfo.disks && vmInfo.disks.length > 0 && (
						<Box flexDirection="column" marginTop={1}>
							<Text dimColor>Disks to be deleted:</Text>
							{vmInfo.disks.map((disk, index) => (
								<Box key={index} marginLeft={2}>
									<Text dimColor>
										• {disk.type}: {disk.storage} ({disk.size})
										{disk.used && ` - ${disk.used} used`}
									</Text>
								</Box>
							))}
						</Box>
					)}
				</Box>

				<Divider />

				{vmInfo.status === 'running' && (
					<Box flexDirection="column" marginBottom={1}>
						<Warning>
							{typeLabel} is currently running! 
							{shouldStopFirst ? (
								<Text> Will be stopped before deletion.</Text>
							) : (
								<Text> Must be stopped first.</Text>
							)}
						</Warning>
						<Box marginTop={1}>
							<Text>
								Press [{shouldStopFirst ? <Text color="green">S</Text> : <Text>S</Text>}] to {shouldStopFirst ? 'skip' : 'enable'} stopping first
							</Text>
						</Box>
					</Box>
				)}

				<Box flexDirection="column" marginBottom={1}>
					<Info>
						{dryRun ? 'Dry run mode: No actual deletion will occur.' : '⚠️  This action cannot be undone!'}
					</Info>
					{!dryRun && (
						<Info>Consider creating a backup before deletion.</Info>
					)}
				</Box>

				<Divider />

				<Box flexDirection="column" marginTop={1}>
					<Text>
						Press <Text bold>Enter</Text> to continue, or <Text color="red">Escape</Text> to cancel
					</Text>
				</Box>
			</Box>
		);
	}

	if (status === 'confirm-verify' && vmInfo) {
		const expectedValue = `${vmid} DELETE`;
		const isCorrect = verificationInput.trim().toUpperCase() === expectedValue;
		
		return (
			<Box flexDirection="column" paddingY={1}>
				<Box marginBottom={1}>
					<Text bold color="magenta">▲ pxc </Text>
					<Text bold>delete {vmid}{dryRun ? ' --dry-run' : ''}</Text>
				</Box>

				<Warning>Final confirmation required</Warning>
				
				<Box flexDirection="column" marginTop={1} marginBottom={1}>
					<Text>To confirm deletion, type exactly: <Text bold color="red">{expectedValue}</Text></Text>
					<Box marginTop={1}>
						<Text>{'> '}</Text>
						<Text color={isCorrect ? 'green' : 'white'}>{verificationInput}</Text>
						<Text dimColor>_</Text>
					</Box>
				</Box>

				<Divider />

				<Box flexDirection="column" marginTop={1}>
					<Text>
						Press <Text bold>Enter</Text> to {dryRun ? 'preview' : 'delete'}, or <Text color="red">Escape</Text> to cancel
					</Text>
				</Box>
			</Box>
		);
	}

	if (status === 'grace-period') {
		return (
			<Box flexDirection="column" paddingY={1}>
				<Box marginBottom={1}>
					<Text bold color="magenta">▲ pxc </Text>
					<Text bold>delete {vmid}</Text>
				</Box>

				<Warning>
					Deleting {typeLabel} {vmid} ({vmInfo?.name}) in {graceCountdown} seconds...
				</Warning>
				
				<Box flexDirection="column" marginTop={1} marginBottom={1}>
					<Text>This is your last chance to cancel!</Text>
					<Text>The deletion will proceed automatically.</Text>
				</Box>

				<Box flexDirection="column" marginTop={1}>
					<Text>
						Press <Text color="red">Escape</Text> to cancel now ({graceCountdown}s remaining)
					</Text>
				</Box>
			</Box>
		);
	}

	if (status === 'deleting') {
		return (
			<Box flexDirection="column" paddingY={1}>
				<Box marginBottom={1}>
					<Text bold color="magenta">▲ pxc </Text>
					<Text bold>delete {vmid}</Text>
				</Box>
				<Loading>
					{shouldStopFirst ? 'Stopping and ' : ''}
					Deleting {typeLabel} {vmid}...
				</Loading>
			</Box>
		);
	}

	if (status === 'cancelled') {
		return (
			<Box flexDirection="column" paddingY={1}>
				<Box marginBottom={1}>
					<Text bold color="magenta">▲ pxc </Text>
					<Text bold>delete {vmid}{dryRun ? ' --dry-run' : ''}</Text>
				</Box>
				<Info>Deletion cancelled by user</Info>
				<Text dimColor>No changes were made.</Text>
			</Box>
		);
	}

	if (status === 'error') {
		return (
			<Box flexDirection="column" paddingY={1}>
				<Box marginBottom={1}>
					<Text bold color="magenta">▲ pxc </Text>
					<Text bold>delete {vmid}{dryRun ? ' --dry-run' : ''}</Text>
				</Box>
				<ErrorMessage>Failed to delete {typeLabel} {vmid}: {error}</ErrorMessage>
			</Box>
		);
	}

	if (status === 'success') {
		useEffect(() => {
			setTimeout(() => process.exit(0), 100);
		}, []);
		
		return (
			<Box flexDirection="column" paddingY={1}>
				<Box marginBottom={1}>
					<Text bold color="magenta">▲ pxc </Text>
					<Text bold>delete {vmid}{dryRun ? ' --dry-run' : ''}</Text>
				</Box>
				<Success>
					{dryRun ? 'Dry run completed for' : 'Successfully deleted'} {typeLabel} {vmid} ({vmInfo?.name})
				</Success>
				{dryRun && (
					<Info>In dry run mode: No actual deletion occurred.</Info>
				)}
			</Box>
		);
	}

	return null;
}