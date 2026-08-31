# Changelog

### Changed

## [1.3.0]

### Changed
- adds optional value max oid to process to the inventory page

## [1.2.3]

### Changed
- fix button misalignment on multilines in table
- fix schedules not resuming for unchanged inventory records after Redis/RedBeat is reset while MongoDB data is preserved
- fix font flash on page switch by inlining Proxima Nova as WOFF2 instead of loading OTF files on demand
- add "Restore configuration" button to recover Profiles, Groups, and Inventory from section files on disk when MongoDB data is lost
- hide Logout button when authentication is disabled
- fix port being required when adding a Group inventory record
- fix Groups tab freezing for large device counts by paginating the group list and batching inventory-membership lookups
- add "Bulk add devices" to a group, supporting a manual grid or a pasted address list with shared SNMP config

## [1.2.1]

### Changed
- flask-cors to 6.0.0
- uuid to 14.0.0
- follow-redirects 1.16.0

## [1.2.0]

### Changed
- add fallback for MONGODB and REDIS connection strings, fix logging
- create MONGODB connection string from environment variables instead of full MONGO_URI variable
- create REDIS connection string from environment variables instead of full REDIS_URL variable
- add authorization mechanism

## [1.1.0]

### Changed
- add error handling for apply changes action
- after clicking 'Apply changes' workflow is initially attempting to create new job immediately, if it is impossible, schedule it for the future

## [1.0.2]

### Changed
- add CHANGELOG
- upgraded node version in github workflows to 20.12.0

### Upgraded github actions
- docker/setup-qemu-action to "3"
- docker/setup-buildx-action to "3.2.0"
- docker/metadata-action to "5.5.1"
- actions/setup-node to "4.0.2"
- actions/checkout to "4"
- cycjimmy/semantic-release-action to "4.1.0"
- semantic version to "21.1.1"
- semantic-release-replace-plugin to "1.2.7"

### upgraded devDependencies
- mongodb to "6.5.0"
- @splunk/babel-preset to "^4.0.0"
- enzyme-adapter-react-16 to "^1.15.8"
- node to "20.12.0"
- mongoose to "^8.3.0"
- lerna to "^8.1.2"