import fs from "fs";
import { tmpdir } from "os";
import path from "path";
import { mkdtemp } from "node:fs/promises";
import { join } from 'node:path'
import { exec, execSync } from "child_process";

const doExecSync: typeof execSync = (...args: any[]) => {
    console.log("command: ", args[0]);

    try {
        // @ts-expect-error - who cares, this clearly works.
        return execSync(...args);
    } catch (e: any) {
        if (e.output) {
            console.error(e.output.toString());
        }

        throw e;
    }
}

export class TempWorkspace {
    private directoryPath: string | undefined;

    constructor() { }

    /**
     * Creates a temporary directory and copies Ragged's built files into it.
     * The Ragged file are the same ones as installed in this e2e project.
     */
    async init() {
        // Create a temporary directory
        this.directoryPath = await mkdtemp(join(tmpdir(), 'build-'))

        // if we ever need to copy dotfiles, we can use this
        // doExecSync(`cp -r "${join(__dirname, "project-template/.*")}" "${this.directoryPath}"`);
        doExecSync(`cp -r ${join(__dirname, "project-template")}/* "${this.directoryPath}"`, { cwd: __dirname });

        // Copy Ragged's built files into it
        // const raggedOriginPath = join(__dirname, "node_modules", "ragged");
        // console.log(raggedOriginPath);
        // const raggedDestinationPath = path.resolve(this.directoryPath, "node_modules", "ragged");
        // doExecSync(`rm -rf "${raggedDestinationPath}"`);
        // doExecSync(`mkdir -p "${raggedDestinationPath}/node_modules"`);
        // doExecSync(`cp -r "${raggedOriginPath}" "${raggedDestinationPath}"`);
    }

    /**
     * Returns the path of the temporary directory.
     */
    getTmpDirPath() {
        return this.directoryPath;
    }

    runTest() {
        doExecSync(`pnpm install`, { cwd: this.directoryPath });
        doExecSync(`pnpm tsc --noEmit`, { cwd: this.directoryPath });
        doExecSync(`pnpm tsx index.ts`, { cwd: this.directoryPath });
    }

    destroy() {
        if (!this.directoryPath) {
            return;
        }

        if (!this.directoryPath.startsWith("/tmp/")) {
            throw new Error("The temporary directory path does not start with /tmp/. This is a safety check to prevent deleting the wrong directory.");
        }

        fs.rmdirSync(this.directoryPath, { recursive: true });
    }
}