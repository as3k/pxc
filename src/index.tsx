#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { CreateCommand } from './commands/create.js';
import { ListCommand } from './commands/list.js';
import { StartCommand } from './commands/start.js';
import { StopCommand } from './commands/stop.js';

const program = new Command();

program
	.name('pxc')
	.description('Modern CLI for managing Proxmox VMs')
	.version('0.1.0');

program
	.command('create')
	.description('Create a new VM with the interactive wizard')
	.action(() => {
		render(<CreateCommand />);
	});

program
	.command('list')
	.alias('ls')
	.description('List all VMs')
	.action(() => {
		render(<ListCommand />);
	});

program
	.command('start <vmid>')
	.description('Start a VM')
	.action((vmid: string) => {
		const id = parseInt(vmid, 10);
		if (isNaN(id)) {
			console.error('Error: VMID must be a number');
			process.exit(1);
		}
		render(<StartCommand vmid={id} />);
	});

program
	.command('stop <vmid>')
	.description('Stop a VM')
	.option('-f, --force', 'Force stop the VM (hard shutdown)')
	.action((vmid: string, options: { force?: boolean }) => {
		const id = parseInt(vmid, 10);
		if (isNaN(id)) {
			console.error('Error: VMID must be a number');
			process.exit(1);
		}
		render(<StopCommand vmid={id} force={options.force ?? false} />);
	});

program.parse();
