export class HttpError extends Error {

    public statusCode: number;

    constructor(public status: number, message?: string, public error?: string | Error, public data?: any, public code?: number) {
        super(message);

        this.statusCode = status;

        if (error && (error as any).code) {
            this.code = (error as any).code
        }

        Object.setPrototypeOf(this, HttpError.prototype);

    }
}