import cp from 'child_process';

export class AsyncExecResponse {
    stdout: string;
    stderr: string;
    error: cp.ExecException | null;

    constructor(stdout: string, stderr: string, error: cp.ExecException | null) {
        this.stdout = stdout;
        this.stderr = stderr;
        this.error = error;
    }

    get stdoutLines(): Array<string> {
        return this.splitOutput(this.stdout);
    }

    get stderrLines(): Array<string> {
        return this.splitOutput(this.stderr);
    }

    private splitOutput(output: string): Array<string> {
        return output.split('\n').filter((line) => line.length);
    }
}

export default async function asyncExec(cmd: string): Promise<AsyncExecResponse> {
    return new Promise((resolve, reject) => {
        cp.exec(cmd, (error, stdout, stderr) => {
            const response = new AsyncExecResponse(stdout, stderr, error);
            if (error) {
                reject(response);
            } else {
                resolve(response);
            }
        });
    });
}
