export = driveByPath;

declare function driveByPath (filepath: string, cwd?: string): Promise<driveByPath.Drive>;

declare namespace driveByPath {
  type Drive = {
    matchedMountpointPath: string,
    device: string,
    displayName: string,
    description: string,
    size: number,
    mountpoints: {path: string}[],
    raw: string,
    protected: boolean,
    system: boolean,
  }
}
