# drive-by-path

[![Status](https://travis-ci.org/zkochan/drive-by-path.svg?branch=master)](https://travis-ci.org/zkochan/drive-by-path "See test builds")
[![Build status](https://ci.appveyor.com/api/projects/status/p6gfn1w3fc8e94v1?svg=true)](https://ci.appveyor.com/project/zkochan/drive-by-path)

> Returns the drive to which a path belongs

## Install

Install it via npm.

```
npm install drive-by-path
```

## Usage

```js
const driveByPath = require('drive-by-path')

driveByPath('/zkochan/foo')
  .then(drive => console.log(drive))
//> {
//    matchedMountpointPath: '/'
//    device: '/dev/disk0',
//    displayName: '/dev/disk0',
//    ...
//  }
```

## API

### `driveByPath(path): Promise<DriveInfo>`

Returns info abouth the drive under which the path is located.
Also returns what mountpoint was matched via `matchedMountpointPath`:
one drive can have multiple mountpoints.

**Arguments:**

* `path` - *string* - the filepath for which the drive is searched

## License

[MIT](LICENSE)
