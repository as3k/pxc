#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { CreateCommand } from './commands/create.js';
import { ListCommand } from './commands/list.js';
import { StartCommand } from './commands/start.js';
import { StopCommand } from './commands/stop.js';
import { DeleteCommand } from './commands/delete.js';
import { IsoListCommand } from './commands/iso-list.js';
import { IsoDownloadCommand } from './commands/iso-download.js';
import { IsoUploadCommand } from './commands/iso-upload.js';
import { IsoDeleteCommand } from './commands/iso-delete.js';
import { ConfigShowCommand } from './commands/config.js';
import {
	PackagesListCommand,
	PackagesShowCommand,
	PackagesAddCommand,
	PackagesDeleteCommand,
} from './commands/packages.js';

const program = new Command();

program
	.name('pxc')
	.description('Modern CLI for managing Proxmox VMs and containers')
	.version('0.1.0');

program
	.command('create')
	.description('Create a new VM with the interactive wizard')
	.option('-p, --package <name>', 'Use a predefined package for defaults')
	.action((options: { package?: string }) => {
		render(<CreateCommand packageName={options.package} />);
	});

program
	.command('list')
	.alias('ls')
	.description('List all VMs and containers')
	.action(() => {
		render(<ListCommand />);
	});

program
	.command('start <vmid>')
	.description('Start a VM or container')
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
	.description('Stop a VM or container')
	.option('-f, --force', 'Force stop (hard shutdown, VMs only)')
	.action((vmid: string, options: { force?: boolean }) => {
		const id = parseInt(vmid, 10);
		if (isNaN(id)) {
			console.error('Error: VMID must be a number');
			process.exit(1);
		}
		render(<StopCommand vmid={id} force={options.force ?? false} />);
	});

program
	.command('delete <vmid>')
	.alias('rm')
	.description('Delete a VM or container')
	.option('--dry-run', 'Show what would be deleted without actually deleting')
	.action((vmid: string, options: { dryRun?: boolean }) => {
		const id = parseInt(vmid, 10);
		if (isNaN(id)) {
			console.error('Error: VMID must be a number');
			process.exit(1);
		}
		render(<DeleteCommand vmid={id} dryRun={options.dryRun ?? false} />);
	});

// ISO subcommands
const iso = program.command('iso').description('Manage ISO images');

iso
	.command('list')
	.alias('ls')
	.description('List all ISO images')
	.action(() => {
		render(<IsoListCommand />);
	});

iso
	.command('download <url>')
	.description('Download an ISO from a URL')
	.option('-s, --storage <storage>', 'Target storage (default: first available)')
	.option('-n, --name <filename>', 'Override filename')
	.action((url: string, options: { storage?: string; name?: string }) => {
		render(<IsoDownloadCommand url={url} storage={options.storage} filename={options.name} />);
	});

iso
	.command('upload <file>')
	.description('Upload a local ISO file')
	.option('-s, --storage <storage>', 'Target storage (default: first available)')
	.action((file: string, options: { storage?: string }) => {
		render(<IsoUploadCommand file={file} storage={options.storage} />);
	});

iso
	.command('delete <name>')
	.alias('rm')
	.description('Delete an ISO image')
	.action((name: string) => {
		render(<IsoDeleteCommand name={name} />);
	});

// Config subcommands
const config = program.command('config').description('Manage configuration');

config
	.command('show')
	.description('Show current configuration')
	.action(() => {
		render(<ConfigShowCommand />);
	});

config
	.command('path')
	.description('Show config file path')
	.action(() => {
		const { getConfigPath } = require('./lib/config.js');
		console.log(getConfigPath());
	});

// Packages subcommands
const packages = program.command('packages').description('Manage VM/container presets');

packages
	.command('list')
	.alias('ls')
	.description('List all packages')
	.action(() => {
		render(<PackagesListCommand />);
	});

packages
	.command('show <name>')
	.description('Show package details')
	.action((name: string) => {
		render(<PackagesShowCommand name={name} />);
	});

packages
	.command('add <name>')
	.description('Add or edit a package')
	.option('-c, --cores <n>', 'CPU cores', parseInt)
	.option('-m, --memory <mb>', 'Memory in MB', parseInt)
	.option('-d, --disk <gb>', 'Disk in GB', parseInt)
	.option('-b, --bridge <name>', 'Network bridge')
	.action((name: string, options: { cores?: number; memory?: number; disk?: number; bridge?: string }) => {
		render(<PackagesAddCommand name={name} cores={options.cores} memory={options.memory} disk={options.disk} bridge={options.bridge} />);
	});

packages
	.command('delete <name>')
	.alias('rm')
	.description('Delete a package')
	.action((name: string) => {
		render(<PackagesDeleteCommand name={name} />);
	});

program.parse();
