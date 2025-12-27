## 1. Node Detection and Selection
- [ ] 1.1 Add cluster node detection function to proxmox.ts
- [ ] 1.2 Create new NodeSelection step component
- [ ] 1.3 Insert NodeSelection step after Welcome step
- [ ] 1.4 Update wizard flow to pass selected node to all steps
- [ ] 1.5 Add node information to configuration display

## 2. Network Bridge Detection Fix
- [ ] 2.1 Modify getBridges() to accept node parameter
- [ ] 2.2 Update Network step to use target node for bridge detection
- [ ] 2.3 Add fallback logic for manual bridge entry
- [ ] 2.4 Store node-specific bridge preferences in config

## 3. VM Creation Enhancement
- [ ] 3.1 Update createVm() function to accept node parameter
- [ ] 3.2 Modify Execute step to pass selected node
- [ ] 3.3 Update mock data for multi-node scenarios
- [ ] 3.4 Add node-specific VM ID validation

## 4. Storage UI Improvements
- [ ] 4.1 Detect shared vs node-local storage types
- [ ] 4.2 Update Storage step to show storage node affinity
- [ ] 4.3 Add storage type indicators (shared/local)
- [ ] 4.4 Improve storage selection guidance for clusters

## 5. Configuration System Updates
- [ ] 5.1 Add per-node default settings support
- [ ] 5.2 Update config structure for node-specific preferences
- [ ] 5.3 Modify config save/load to handle node settings
- [ ] 5.4 Add migration for existing configs

## 6. Cluster Awareness Features
- [ ] 6.1 Add cluster membership detection
- [ ] 6.2 Show cluster health/status information
- [ ] 6.3 Display current node vs available nodes
- [ ] 6.4 Add cluster information to VM listing

## 7. Testing and Validation
- [ ] 7.1 Test on single-node setups (regression)
- [ ] 7.2 Test on multi-node clusters
- [ ] 7.3 Validate storage detection accuracy
- [ ] 7.4 Test node selection and VM creation
- [ ] 7.5 Update mock mode for multi-node testing
